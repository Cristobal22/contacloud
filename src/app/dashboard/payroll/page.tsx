'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { useCollection, useFirestore } from '@/firebase';
  import type { Employee, AfpEntity, HealthEntity, Payroll, EconomicIndicator, TaxableCap } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, getDocs, query } from 'firebase/firestore';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { initialTaxParameters } from '@/lib/seed-data';

// Represents the monthly variable data for an employee
type PayrollDraft = Partial<Payroll> & { employeeId: string; employeeName: string; baseSalary: number; };

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = React.useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    
    const [payrollDrafts, setPayrollDrafts] = React.useState<PayrollDraft[]>([]);

    // Data hooks
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: companyId ? `companies/${companyId}/employees` : undefined });
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });
    const { data: globalIndicators, loading: indicatorsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const { data: taxableCaps, loading: capsLoading } = useCollection<TaxableCap>({ path: 'taxable-caps' });

    const loading = employeesLoading || afpLoading || healthLoading || indicatorsLoading || capsLoading;

    React.useEffect(() => {
        if (!companyId || !firestore || !employees) return;

        const loadOrCreateDrafts = async () => {
            setIsLoadingDrafts(true);
            const periodId = `${year}-${String(month).padStart(2, '0')}`;
            const draftsRef = collection(firestore, `companies/${companyId}/payrollPeriods/${periodId}/drafts`);
            const existingDraftsSnap = await getDocs(draftsRef);

            let drafts: PayrollDraft[] = [];
            if (!existingDraftsSnap.empty) {
                existingDraftsSnap.forEach(doc => {
                    drafts.push({ id: doc.id, ...doc.data() } as PayrollDraft);
                });
            } else {
                const activeEmployees = employees.filter(e => e.status === 'Active' && e.baseSalary);
                drafts = activeEmployees.map(emp => ({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    baseSalary: emp.baseSalary || 0,
                    year,
                    month,
                }));
            }
            
            setPayrollDrafts(drafts.map(d => calculatePayroll(d, employees, afpEntities, globalIndicators, taxableCaps, year, month)));
            setIsLoadingDrafts(false);
        };

        loadOrCreateDrafts();

    }, [year, month, companyId, firestore, employees, afpEntities, globalIndicators, taxableCaps]);


    const handleDraftChange = (employeeId: string, field: keyof PayrollDraft, value: any) => {
        setPayrollDrafts(prevDrafts =>
            prevDrafts.map(draft => {
                if (draft.employeeId === employeeId) {
                    const updatedDraft = { ...draft, [field]: value };
                    return calculatePayroll(updatedDraft, employees, afpEntities, globalIndicators, taxableCaps, year, month);
                }
                return draft;
            })
        );
    };

    const handleSaveDrafts = async () => {
        if (!companyId || !firestore) return false;
        setIsProcessing(true);
        const periodId = `${year}-${String(month).padStart(2, '0')}`;
        const batch = writeBatch(firestore);

        payrollDrafts.forEach(draft => {
            const { id, ...draftData } = draft;
            const docRef = doc(firestore, `companies/${companyId}/payrollPeriods/${periodId}/drafts`, draft.employeeId);
            batch.set(docRef, draftData);
        });

        try {
            await batch.commit();
            toast({ title: 'Borradores Guardados', description: 'Las novedades del mes han sido guardadas exitosamente.' });
            return true;
        } catch (error) {
            console.error("Error saving drafts:", error);
            toast({ variant: 'destructive', title: 'Error al Guardar', description: 'No se pudieron guardar los borradores.' });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReviewAndProcess = async () => {
        const saved = await handleSaveDrafts();
        if (saved) {
            router.push(`/dashboard/payroll/process?year=${year}&month=${month}`);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Novedades del Mes para Liquidaciones</CardTitle>
                    <CardDescription>Selecciona el período e ingresa las variables del mes para cada trabajador antes de procesar la nómina.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
                                    <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{format(new Date(0, i), 'MMMM', { locale: es })}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                                    <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       {Array.from({ length: 5 }, (_, i) => <SelectItem key={currentYear - i} value={(currentYear - i).toString()}>{currentYear - i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Liquidaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Empleado</TableHead>
                                    <TableHead className="text-right">Sueldo Base</TableHead>
                                    <TableHead className="w-[120px] text-right">Días Ausencia</TableHead>
                                    <TableHead className="w-[120px] text-right">Bonos</TableHead>
                                    <TableHead className="w-[120px] text-right">Horas Extra</TableHead>
                                    <TableHead className="w-[120px] text-right">Anticipos</TableHead>
                                    <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(loading || isLoadingDrafts) ? (
                                    <TableRow><TableCell colSpan={7} className="text-center h-24">Cargando empleados y borradores...</TableCell></TableRow>
                                ) : payrollDrafts.length > 0 ? (
                                    payrollDrafts.map(draft => (
                                        <TableRow key={draft.employeeId}>
                                            <TableCell className="font-medium">{draft.employeeName}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(draft.baseSalary)}</TableCell>
                                            <TableCell><Input type="number" className="text-right" value={draft.diasAusencia || ''} onChange={e => handleDraftChange(draft.employeeId, 'diasAusencia', parseInt(e.target.value) || 0)} /></TableCell>
                                            <TableCell><Input type="number" className="text-right" value={draft.bonos || ''} onChange={e => handleDraftChange(draft.employeeId, 'bonos', parseInt(e.target.value) || 0)} /></TableCell>
                                            <TableCell><Input type="number" className="text-right" value={draft.horasExtra || ''} onChange={e => handleDraftChange(draft.employeeId, 'horasExtra', parseInt(e.target.value) || 0)} /></TableCell>
                                            <TableCell><Input type="number" className="text-right" value={draft.anticipos || ''} onChange={e => handleDraftChange(draft.employeeId, 'anticipos', parseInt(e.target.value) || 0)} /></TableCell>
                                            <TableCell className="text-right font-bold text-lg">{formatCurrency(draft.netSalary || 0)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={7} className="text-center h-24">No hay empleados activos para procesar en esta empresa.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2 pt-6">
                    <Button variant="outline" onClick={handleSaveDrafts} disabled={isProcessing || loading || isLoadingDrafts}>Guardar Borradores</Button>
                    <Button onClick={handleReviewAndProcess} disabled={isProcessing || loading || isLoadingDrafts}>Revisar y Procesar Nómina</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// --- Calculation Logic ---
function calculatePayroll(
    draft: PayrollDraft, 
    employees: Employee[] | null, 
    afpEntities: AfpEntity[] | null,
    indicators: EconomicIndicator[] | null,
    taxableCaps: TaxableCap[] | null,
    year: number,
    month: number
): PayrollDraft {
    const employee = employees?.find(e => e.id === draft.employeeId);
    if (!employee) return { ...draft, netSalary: 0 };

    const indicator = indicators?.find(i => i.id === `${year}-${String(month).padStart(2, '0')}`);
    const caps = taxableCaps?.find(c => c.year === year);
    if (!indicator?.minWage || !indicator?.utm || !indicator?.uf || !caps) {
        return { ...draft, netSalary: 0 }; // Missing economic data
    }

    const daysInMonth = 30;
    const absences = draft.diasAusencia || 0;
    const workedDays = daysInMonth - absences;
    const baseSalary = employee.baseSalary || 0;
    const proportionalBaseSalary = (baseSalary / daysInMonth) * workedDays;

    const GRATIFICATION_CAP_MONTHLY = Math.round((4.75 * indicator.minWage) / 12);
    let gratification = 0;
    if (employee.gratificationType === 'Automatico') {
        gratification = Math.min(proportionalBaseSalary * 0.25, GRATIFICATION_CAP_MONTHLY);
    }

    const otherTaxableEarnings = (draft.horasExtra || 0) + (draft.bonos || 0);
    const taxableEarnings = proportionalBaseSalary + gratification + otherTaxableEarnings;
    const nonTaxableEarnings = (employee.mobilization || 0) + (employee.collation || 0);
    const totalEarnings = taxableEarnings + nonTaxableEarnings;

    const taxableIncomeAFP = Math.min(taxableEarnings, caps.afpCap * indicator.uf);
    const taxableIncomeAFC = Math.min(taxableEarnings, caps.afcCap * indicator.uf);

    const afpMap = new Map(afpEntities?.filter(e => e.year === year && e.month === month).map(afp => [afp.name, afp.mandatoryContribution]));
    const afpPercentage = employee.afp ? (afpMap.get(employee.afp) || 0) / 100 : 0;
    const afpDiscount = taxableIncomeAFP * afpPercentage;

    let healthDiscount = 0;
    if (employee.healthSystem === 'Fonasa') {
        healthDiscount = taxableIncomeAFP * 0.07;
    } else if (employee.healthContributionType === 'Porcentaje') {
        healthDiscount = taxableIncomeAFP * ((employee.healthContributionValue || 7) / 100);
    } else { 
        healthDiscount = (employee.healthContributionValue || 0) * indicator.uf; 
    }

    let unemploymentInsuranceDiscount = 0;
    if (employee.hasUnemploymentInsurance && employee.unemploymentInsuranceType === 'Indefinido') {
        unemploymentInsuranceDiscount = taxableIncomeAFC * 0.006;
    }

    const taxBaseCLP = taxableEarnings - afpDiscount - healthDiscount - unemploymentInsuranceDiscount;
    const taxBaseUTM = taxBaseCLP / indicator.utm;
    const taxBracket = initialTaxParameters.find(t => taxBaseUTM > t.desdeUTM && taxBaseUTM <= t.hastaUTM);
    
    let iut = 0;
    if (taxBracket) {
        const iutAmount = (taxBaseCLP * taxBracket.factor) - (taxBracket.rebajaUTM * indicator.utm);
        iut = iutAmount > 0 ? iutAmount : 0;
    }

    const otherDiscounts = draft.anticipos || 0;
    const totalDiscounts = afpDiscount + healthDiscount + iut + unemploymentInsuranceDiscount + otherDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    return {
        ...draft,
        sueldoBaseProporcional: proportionalBaseSalary,
        baseSalary: baseSalary,
        gratification,
        taxableEarnings,
        nonTaxableEarnings,
        totalEarnings,
        afpDiscount,
        healthDiscount,
        unemploymentInsuranceDiscount,
        iut,
        otherDiscounts,
        totalDiscounts,
        netSalary,
    };
}
