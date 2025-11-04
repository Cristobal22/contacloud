'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore } from '@/firebase';
import type { Employee, AfpEntity, HealthEntity, Payroll, EconomicIndicator, TaxableCap, Voucher, Account, Bono, VoucherEntry } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { es } from 'date-fns/locale';
import { format, endOfMonth } from 'date-fns';
import { initialTaxParameters } from '@/lib/seed-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, PlusCircle, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PayrollProcessPreviewDialog } from '@/components/payroll-process-preview-dialog';
import { generatePayslipPDF } from '@/lib/payslip-pdf-generator';
import PayslipPreview from '@/components/payslip-preview'; // Import the new component

type PayrollDraft = Partial<Payroll> & { 
    employeeId: string; 
    employeeName: string; 
    baseSalary: number; 
    absentDays: number;
    variableBonos: Bono[];
    overtimeHours50: number;
    overtimeHours100: number;
    advances: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

function VariableBonosManager({ draft, onUpdate, children }: { draft: PayrollDraft, onUpdate: (bonos: Bono[]) => void, children: React.ReactNode }) {
    const [bonos, setBonos] = React.useState<Bono[]>(draft.variableBonos || []);
    const [glosa, setGlosa] = React.useState('');
    const [monto, setMonto] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleAdd = () => {
        if (!glosa || monto <= 0) return;
        const newBonos = [...bonos, { glosa, monto }];
        setBonos(newBonos);
        onUpdate(newBonos);
        setGlosa('');
        setMonto(0);
    };

    const handleRemove = (index: number) => {
        const newBonos = bonos.filter((_, i) => i !== index);
        setBonos(newBonos);
        onUpdate(newBonos);
    };
    
    const totalBonos = bonos.reduce((sum, bono) => sum + bono.monto, 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bonos Variables del Mes para {draft.employeeName}</DialogTitle>
                    <DialogDescription>Agrega los bonos imponibles que aplican solo para este período.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Glosa (Ej: Bono de Producción)" value={glosa} onChange={(e) => setGlosa(e.target.value)} />
                        <Input type="number" placeholder="Monto" value={monto || ''} onChange={(e) => setMonto(parseFloat(e.target.value) || 0)} />
                        <Button onClick={handleAdd}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                        {bonos.map((bono, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span>{bono.glosa}</span>
                                <div className="flex items-center gap-2">
                                    <span>{formatCurrency(bono.monto)}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="font-bold text-right">Total Bonos Variables: {formatCurrency(totalBonos)}</div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PayrollContent({ companyId }: { companyId: string }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);
    const currentYear = new Date().getFullYear();
    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(new Date().getMonth() + 1);
    const [payrollDrafts, setPayrollDrafts] = React.useState<PayrollDraft[]>([]);
    const [processedPayrolls, setProcessedPayrolls] = React.useState<Payroll[]>([]);
    const [isPeriodProcessed, setIsPeriodProcessed] = React.useState(false);
    const [selectedPayrollForPreview, setSelectedPayrollForPreview] = React.useState<Payroll | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [totalsForPreview, setTotalsForPreview] = React.useState<{ totalEarnings: number; afpDiscount: number; healthDiscount: number; unemploymentInsuranceDiscount: number; iut: number; advances: number; netSalary: number; } | null>(null);
    const [isIndividualPayslipPreviewOpen, setIsIndividualPayslipPreviewOpen] = React.useState(false);
    const [individualPayslipData, setIndividualPayslipData] = React.useState<{ employee: Employee; payroll: Payroll } | null>(null);


    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: `companies/${companyId}/employees` });
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({ path: `companies/${companyId}/accounts` });
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: globalIndicators, loading: indicatorsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const { data: taxableCaps, loading: capsLoading } = useCollection<TaxableCap>({ path: 'taxable-caps' });

    const loading = employeesLoading || afpLoading || indicatorsLoading || capsLoading || accountsLoading;

    React.useEffect(() => {
        if (loading || !employees) return;
        const initializePeriod = async () => {
            const q = query(collection(firestore, `companies/${companyId}/payrolls`), where("year", "==", year), where("month", "==", month));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setProcessedPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
                setIsPeriodProcessed(true);
                setPayrollDrafts([]);
            } else {
                const drafts = employees.filter(e => e.status === 'Active' && e.baseSalary).map(emp => ({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    baseSalary: emp.baseSalary || 0,
                    absentDays: 0, variableBonos: [], overtimeHours50: 0, overtimeHours100: 0, advances: 0, year, month
                }));
                setPayrollDrafts(drafts.map(d => calculatePayroll(d, employees, afpEntities, globalIndicators, taxableCaps, year, month)));
                setProcessedPayrolls([]);
                setIsPeriodProcessed(false);
            }
        };
        initializePeriod();
    }, [year, month, companyId, employees, loading]);

    const handleDraftChange = (employeeId: string, field: keyof PayrollDraft, value: any) => {
        setPayrollDrafts(prev => prev.map(d => d.employeeId === employeeId ? calculatePayroll({ ...d, [field]: value }, employees, afpEntities, globalIndicators, taxableCaps, year, month) : d));
    };
    
    const handleOpenIndividualPayslipPreview = (payroll: Payroll) => {
        const employee = employees?.find(e => e.id === payroll.employeeId);
        if (employee) {
            setIndividualPayslipData({ employee, payroll });
            setIsIndividualPayslipPreviewOpen(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la ficha del empleado para la vista previa.' });
        }
    };

    const handleOpenCentralizePreview = () => {
        const calculatedTotals = payrollDrafts.reduce((acc, p) => ({
            totalEarnings: acc.totalEarnings + (p.totalEarnings || 0),
            afpDiscount: acc.afpDiscount + (p.afpDiscount || 0),
            healthDiscount: acc.healthDiscount + (p.healthDiscount || 0),
            unemploymentInsuranceDiscount: acc.unemploymentInsuranceDiscount + (p.unemploymentInsuranceDiscount || 0),
            iut: acc.iut + (p.iut || 0),
            advances: acc.advances + (p.advances || 0),
            netSalary: acc.netSalary + (p.netSalary || 0),
        }), { totalEarnings: 0, afpDiscount: 0, healthDiscount: 0, unemploymentInsuranceDiscount: 0, iut: 0, advances: 0, netSalary: 0 });
        setTotalsForPreview(calculatedTotals);
        setIsPreviewOpen(true);
    };


    const handleConfirmAndProcess = async () => {
        console.log("handleConfirmAndProcess ejecutado"); // Added console log
        if (!companyId || !firestore || !payrollDrafts.length || !totalsForPreview) return;
        
        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const periodId = `${year}-${String(month).padStart(2, '0')}`;
        const payrollsCollectionRef = collection(firestore, `companies/${companyId}/payrolls`);

        const payrollPayableAccount = accounts?.find(acc => acc.name === 'SUELDOS POR PAGAR');
        const socialChargesPayableAccount = accounts?.find(acc => acc.name === 'IMPOSICIONES POR PAGAR');
        const bankAccount = accounts?.find(acc => acc.name === 'BANCOS');

        if (!payrollPayableAccount || !socialChargesPayableAccount || !bankAccount) {
            toast({ variant: 'destructive', title: 'Error de Configuración', description: 'No se encontraron las cuentas contables necesarias (SUELDOS POR PAGAR, IMPOSICIONES POR PAGAR, BANCOS). Por favor, verifique su plan de cuentas.' });
            setIsProcessing(false);
            return;
        }

        // 1. Save each payroll draft as a final payroll
        payrollDrafts.forEach(draft => {
            const { id, ...payrollData } = draft; // 'id' might be present if it's an existing draft, remove it for new doc
            const finalPayroll: Omit<Payroll, 'id'> = {
                ...payrollData,
                companyId: companyId,
                period: periodId,
                year: year,
                month: month,
                createdAt: Timestamp.now(),
            } as Omit<Payroll, 'id'>; // Ensure all required fields are present

            const newPayrollRef = doc(payrollsCollectionRef);
            batch.set(newPayrollRef, finalPayroll);
        });

        // 2. Create a summary voucher (asiento contable)
        const voucherEntries: VoucherEntry[] = [];

        // Débito: Total de Haberes (Gasto de Remuneraciones)
        // Asumiendo que 'totalEarnings' representa el gasto total de remuneraciones (haberes imponibles y no imponibles).
        // Si solo se quieren los haberes imponibles como gasto, se debería ajustar aquí.
        voucherEntries.push({
            accountId: payrollPayableAccount.id, // O una cuenta de Gasto de Remuneraciones si existiera
            accountName: payrollPayableAccount.name, // O una cuenta de Gasto de Remuneraciones si existiera
            debit: totalsForPreview.totalEarnings,
            credit: 0,
        });

        // Crédito: Descuentos (AFP, Salud, Seguro Cesantía, Impuesto Único) - IMPOSICIONES POR PAGAR
        const totalSocialCharges = totalsForPreview.afpDiscount + totalsForPreview.healthDiscount + totalsForPreview.unemploymentInsuranceDiscount + totalsForPreview.iut;
        voucherEntries.push({
            accountId: socialChargesPayableAccount.id,
            accountName: socialChargesPayableAccount.name,
            debit: 0,
            credit: totalSocialCharges,
        });

        // Crédito: Neto a pagar (Sueldo Líquido - Anticipos) - BANCOS
        // Asumimos que los anticipos ya se descontaron para llegar al netSalary y el netSalary es lo que sale de bancos.
        // Si los anticipos se manejan con otra cuenta, se debería ajustar la entrada aquí.
        voucherEntries.push({
            accountId: bankAccount.id,
            accountName: bankAccount.name,
            debit: 0,
            credit: totalsForPreview.netSalary,
        });

        const newVoucher: Omit<Voucher, 'id'> = {
            companyId: companyId,
            date: Timestamp.now(),
            description: `Centralización de Nómina ${format(new Date(year, month - 1), 'MMMM', { locale: es })} ${year}`,
            type: 'Egreso', // Asumiendo que la centralización de nómina es una salida de dinero eventual (o pasivo a pagar)
            status: 'Borrador', // Se inicia como borrador, puede ser 'Contabilizado' más tarde
            total: totalsForPreview.totalEarnings, // El total del voucher debería ser el mismo que el total de haberes para que cuadre el asiento
            entries: voucherEntries,
            createdAt: Timestamp.now(),
        };
        const voucherCollectionRef = collection(firestore, `companies/${companyId}/vouchers`);
        batch.set(doc(voucherCollectionRef), newVoucher);

        try {
            await batch.commit();
            toast({ title: 'Nómina Procesada', description: 'Las liquidaciones y el comprobante contable han sido guardados.' });
            setIsPeriodProcessed(true);
            setPayrollDrafts([]); // Limpiar borradores después de procesar
            router.push('/dashboard/payroll'); // Navegar de vuelta a la vista principal de nómina
        } catch (error) {
            console.error("Error al procesar la nómina:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Hubo un problema al procesar la nómina y generar el comprobante.' });
        } finally {
            setIsProcessing(false);
            setIsPreviewOpen(false);
        }
    };

    const handleDownloadPDF = (payroll: Payroll) => {
        const employee = employees?.find(e => e.id === payroll.employeeId);
        if (employee) generatePayslipPDF(employee, payroll);
        else toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la ficha del empleado.' });
    };
    
    const handleDownloadAllPDFs = () => processedPayrolls.forEach(handleDownloadPDF);

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Liquidaciones</CardTitle>
                        <CardDescription>Selecciona un período para ingresar novedades, procesar la nómina y generar PDFs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="month">Mes</Label><Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}><SelectTrigger id="month"><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(0,i), 'MMMM', {locale: es})}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="year">Año</Label><Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}><SelectTrigger id="year"><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 5}, (_, i) => <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>{currentYear-i}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{isPeriodProcessed ? 'Liquidaciones Procesadas' : 'Novedades del Mes'}</CardTitle>
                            {isPeriodProcessed && <Button onClick={handleDownloadAllPDFs}><Download className="mr-2 h-4 w-4" />Descargar Todos</Button>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead className="text-right">Sueldo Base</TableHead>
                                    {isPeriodProcessed ? <>
                                        <TableHead className="text-right">Total Haberes</TableHead>
                                        <TableHead className="text-right">Total Descuentos</TableHead>
                                    </> : <>
                                        <TableHead className="w-[120px] text-right">Días Ausencia</TableHead>
                                        <TableHead className="w-[150px] text-center">Bonos Variables</TableHead>
                                        <TableHead className="w-[140px] text-right">H. Extra (50%)</TableHead>
                                        <TableHead className="w-[140px] text-right">H. Extra (100%)</TableHead>
                                        <TableHead className="w-[120px] text-right">Anticipos</TableHead>
                                    </>}
                                    <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                                     <TableHead className="text-right">Acciones</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {loading ? ( <TableRow><TableCell colSpan={isPeriodProcessed ? 6 : 8} className="text-center h-24">Cargando...</TableCell></TableRow> )
                                    : isPeriodProcessed ? (
                                        processedPayrolls.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.employeeName}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(p.baseSalary)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(p.totalEarnings || 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(p.totalDiscounts || 0)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(p.netSalary || 0)}</TableCell>
                                                <TableCell className="text-right flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenIndividualPayslipPreview(p)}>Vista Previa</Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(p)}><Download className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : payrollDrafts.length > 0 ? (
                                        payrollDrafts.map(draft => (
                                            <TableRow key={draft.employeeId}>
                                                <TableCell>{draft.employeeName}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(draft.baseSalary)}</TableCell>
                                                <TableCell><Input type="number" className="text-right" value={draft.absentDays || ''} onChange={e => handleDraftChange(draft.employeeId, 'absentDays', parseInt(e.target.value) || 0)} /></TableCell>
                                                <TableCell className="text-center">
                                                    <VariableBonosManager draft={draft} onUpdate={(b) => handleDraftChange(draft.employeeId, 'variableBonos', b)}>
                                                        <Button variant="outline" size="sm">{(draft.variableBonos?.reduce((s, b) => s + b.monto, 0) || 0) > 0 ? formatCurrency(draft.variableBonos.reduce((s, b) => s + b.monto, 0)) : 'Agregar'}</Button>
                                                    </VariableBonosManager>
                                                </TableCell>
                                                <TableCell><Input type="number" className="text-right" value={draft.overtimeHours50 || ''} onChange={e => handleDraftChange(draft.employeeId, 'overtimeHours50', parseInt(e.target.value) || 0)} /></TableCell>
                                                <TableCell><Input type="number" className="text-right" value={draft.overtimeHours100 || ''} onChange={e => handleDraftChange(draft.employeeId, 'overtimeHours100', parseInt(e.target.value) || 0)} /></TableCell>
                                                <TableCell><Input type="number" className="text-right" value={draft.advances || ''} onChange={e => handleDraftChange(draft.employeeId, 'advances', parseInt(e.target.value) || 0)} /></TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(draft.netSalary || 0)}</TableCell>
                                                 <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenIndividualPayslipPreview(draft)}>Vista Previa</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : ( <TableRow><TableCell colSpan={isPeriodProcessed ? 6 : 8} className="text-center h-24">No hay empleados activos.</TableCell></TableRow> )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        {!isPeriodProcessed && <Button onClick={handleOpenCentralizePreview} disabled={!payrollDrafts.length}>Revisar y Centralizar</Button>}
                    </CardFooter>
                </Card>
            </div>
            <PayrollProcessPreviewDialog isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onConfirm={handleConfirmAndProcess} isProcessing={isProcessing} totals={totalsForPreview as any} period={`${es.localize?.month(month - 1)} ${year}`} />

            {/* Individual Payslip Preview Dialog */}
            <Dialog open={isIndividualPayslipPreviewOpen} onOpenChange={setIsIndividualPayslipPreviewOpen}>
                <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vista Previa de Liquidación de Sueldo</DialogTitle>
                        <DialogDescription>Revisa los detalles de la liquidación antes de procesar.</DialogDescription>
                    </DialogHeader>
                    {individualPayslipData && (
                        <PayslipPreview employee={individualPayslipData.employee} payroll={individualPayslipData.payroll} />
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsIndividualPayslipPreviewOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    if (!selectedCompany) { return <div className="flex items-center justify-center h-full"><Card className="w-full max-w-md text-center"><CardHeader><CardTitle>Seleccione una Empresa</CardTitle><CardDescription>Por favor, elija una empresa para empezar.</CardDescription></CardHeader></Card></div> }
    return <PayrollContent companyId={selectedCompany.id} />;
}

function calculatePayroll(draft: PayrollDraft, employees: Employee[], afpEntities: AfpEntity[], indicators: EconomicIndicator[], taxableCaps: TaxableCap[], year: number, month: number): PayrollDraft {
    const employee = employees?.find(e => e.id === draft.employeeId);
    if (!employee) return { ...draft, netSalary: 0, totalEarnings: 0, totalDiscounts: 0 };

    const indicator = indicators?.find(i => i.id === `${year}-${String(month).padStart(2, '0')}`);
    const caps = taxableCaps?.find(c => c.year === year);
    if (!indicator?.minWage || !indicator?.utm || !indicator?.uf || !caps) {
        return { ...draft, netSalary: 0, totalEarnings: 0, totalDiscounts: 0 };
    }

    const baseSalary = employee.baseSalary || 0;
    const gratificationType = employee.gratificationType || 'Sin Gratificación';
    const fixedBonos = employee.bonosFijos || [];
    const mobilization = employee.mobilization || 0;
    const collation = employee.collation || 0;
    const healthSystem = employee.healthSystem || 'Fonasa';
    const healthContributionType = employee.healthContributionType || 'Porcentaje';
    const healthContributionValue = employee.healthContributionValue || 7;
    const hasUnemploymentInsurance = employee.hasUnemploymentInsurance || false;
    const unemploymentInsuranceType = employee.unemploymentInsuranceType;
    const afpName = employee.afp;
    
    const proportionalBaseSalary = (baseSalary / 30) * (30 - (draft.absentDays || 0));

    const hourlyRate = (baseSalary / 30) * 7 / (employee.weeklyHours || 45);
    const overtimePay50 = hourlyRate * 1.5 * (draft.overtimeHours50 || 0);
    const overtimePay100 = hourlyRate * 2.0 * (draft.overtimeHours100 || 0);
    const totalOvertimePay = overtimePay50 + overtimePay100;

    const variableBonos = draft.variableBonos || [];
    const allBonos = [...fixedBonos.map(b => ({ ...b, tipo: 'fijo' as const })), ...variableBonos.map(b => ({ ...b, tipo: 'variable' as const }))];
    const totalBonosAmount = allBonos.reduce((sum, bono) => sum + bono.monto, 0);

    const baseFor25PercentGratification = proportionalBaseSalary + totalBonosAmount + totalOvertimePay;

    const GRATIFICATION_CAP_MONTHLY = Math.round((4.75 * indicator.minWage) / 12);
    let gratification = 0;
    if (gratificationType === 'Automatico') {
        gratification = Math.min(baseFor25PercentGratification * 0.25, GRATIFICATION_CAP_MONTHLY);
    } else if (gratificationType === 'Tope Legal') {
        gratification = GRATIFICATION_CAP_MONTHLY;
    }

    const otherTaxableEarnings = totalBonosAmount + totalOvertimePay;
    const taxableEarnings = proportionalBaseSalary + gratification + otherTaxableEarnings;
    const nonTaxableEarnings = mobilization + collation;
    const totalEarnings = taxableEarnings + nonTaxableEarnings;

    const taxableIncomeAFP = Math.min(taxableEarnings, caps.afpCap * indicator.uf);
    const taxableIncomeAFC = Math.min(taxableEarnings, caps.afcCap * indicator.uf);

    const afpMap = new Map(afpEntities?.filter(e => e.year === year && e.month === month).map(afp => [afp.name, afp.mandatoryContribution]));
    const afpPercentage = afpName ? (afpMap.get(afpName) || 0) / 100 : 0;
    const afpDiscount = taxableIncomeAFP * afpPercentage;

    let healthDiscount = 0;
    if (healthSystem === 'Fonasa') {
        healthDiscount = taxableIncomeAFP * 0.07;
    } else if (healthContributionType === 'Porcentaje') {
        healthDiscount = taxableIncomeAFP * (healthContributionValue / 100);
    } else { 
        healthDiscount = healthContributionValue * indicator.uf; 
    }

    let unemploymentInsuranceDiscount = 0;
    if (hasUnemploymentInsurance && unemploymentInsuranceType === 'Indefinido') {
        unemploymentInsuranceDiscount = taxableIncomeAFC * 0.006;
    }

    const taxBaseCLP = taxableEarnings - afpDiscount - healthDiscount - unemploymentInsuranceDiscount;
    const taxBaseUTM = taxBaseCLP / indicator.utm;
    const taxBracket = initialTaxParameters.find(t => taxBaseUTM > t.desdeUTM && taxBaseUTM <= t.hastaUTM);
    
    let iut = 0;
    if (taxBracket) {
        iut = Math.max(0, (taxBaseCLP * taxBracket.factor) - (taxBracket.rebajaUTM * indicator.utm));
    }

    const otherDiscounts = draft.advances || 0;
    const totalDiscounts = afpDiscount + healthDiscount + iut + unemploymentInsuranceDiscount + otherDiscounts;
    const netSalary = totalEarnings - totalDiscounts;

    return {
        ...draft,
        bonos: allBonos,
        taxableEarnings,
        nonTaxableEarnings,
        totalEarnings,
        afpDiscount,
        healthDiscount,
        unemploymentInsuranceDiscount,
        iut,
        totalDiscounts,
        netSalary,
    };
}
