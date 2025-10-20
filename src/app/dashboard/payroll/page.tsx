

'use client';

import React from 'react';
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
    CardFooter,
  } from "@/components/ui/card"
  import { Button, buttonVariants } from "@/components/ui/button"
  import { Eye, MoreHorizontal, Trash2 } from "lucide-react"
  import { useCollection, useFirestore, useUser } from '@/firebase';
  import type { Employee, AfpEntity, HealthEntity, Payroll, EconomicIndicator, TaxParameter } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { PayrollDetailDialog } from '@/components/payroll-detail-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [selectedPayroll, setSelectedPayroll] = React.useState<{ payroll: Payroll, employee: Employee } | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [payrollToDelete, setPayrollToDelete] = React.useState<Payroll | null>(null);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);

    React.useEffect(() => {
        if (selectedCompany?.periodStartDate) {
            const startDate = parseISO(selectedCompany.periodStartDate);
            setYear(startDate.getFullYear());
            setMonth(startDate.getMonth() + 1);
        } else {
            setYear(currentYear);
            setMonth(currentMonth);
        }
    }, [selectedCompany, currentYear, currentMonth]);


    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
      path: companyId ? `companies/${companyId}/employees` : undefined,
      companyId: companyId 
    });
     const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>({ 
      path: companyId ? `companies/${companyId}/payrolls` : undefined,
      companyId: companyId 
    });
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });

    const { data: globalIndicators, loading: globalIndicatorsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const { data: companyIndicators, loading: companyIndicatorsLoading } = useCollection<EconomicIndicator>({ path: companyId ? `companies/${companyId}/economic-indicators` : undefined });
    const { data: taxParameters, loading: taxParametersLoading } = useCollection<TaxParameter>({ path: 'tax-parameters' });

    const loading = employeesLoading || afpLoading || healthLoading || payrollsLoading || globalIndicatorsLoading || companyIndicatorsLoading || taxParametersLoading;
    
    const handleProcessPayrolls = async () => {
        if (!employees || !afpEntities || !healthEntities || !companyId || !firestore || !selectedCompany || !taxParameters) {
            toast({ variant: 'destructive', title: 'Faltan datos', description: 'No se pueden procesar las liquidaciones sin empleados o parámetros económicos/tributarios.'});
            return;
        }

        if (!selectedCompany.periodStartDate) {
            toast({ variant: 'destructive', title: 'Período no definido', description: 'Por favor, define un período de trabajo en la configuración de la empresa antes de procesar.'});
            return;
        }
        
        const periodStartDate = parseISO(selectedCompany.periodStartDate);
        if(periodStartDate.getFullYear() !== year || periodStartDate.getMonth() + 1 !== month) {
             toast({ variant: 'destructive', title: 'Período no coincide', description: 'El período seleccionado no coincide con el período de trabajo activo de la empresa.'});
            return;
        }

        setIsProcessing(true);
        
        const periodIndicatorId = `${year}-${month.toString().padStart(2, '0')}`;
        const companyIndicator = companyIndicators?.find(i => i.id === periodIndicatorId);
        const globalIndicator = globalIndicators?.find(i => i.id === periodIndicatorId);
        const periodIndicator = companyIndicator || globalIndicator;
        
        if (!periodIndicator?.minWage || !periodIndicator?.utm) {
            toast({ variant: 'destructive', title: 'Faltan Parámetros', description: `No se encontraron los parámetros económicos (sueldo mínimo, UTM) para ${month}/${year}.`});
            setIsProcessing(false);
            return;
        }
        
        const GRATIFICATION_CAP_MONTHLY = Math.round((4.75 * periodIndicator.minWage) / 12);
        const period = format(new Date(year, month - 1), 'MMMM yyyy', { locale: es });
        const afpMap = new Map(afpEntities.map(afp => [afp.name, afp.mandatoryContribution]));

        const batch = writeBatch(firestore);

        const activeEmployees = employees.filter(emp => emp.status === 'Active' && emp.baseSalary);
        if (activeEmployees.length === 0) {
            toast({ title: 'Sin empleados', description: 'No hay empleados activos con sueldo base para procesar.'});
            setIsProcessing(false);
            return;
        }

        activeEmployees.forEach(emp => {
            const baseSalary = emp.baseSalary || 0;
            let gratification = emp.gratification || 0;
            if (emp.gratificationType === 'Automatico') {
                const calculatedGratification = baseSalary * 0.25;
                gratification = Math.min(calculatedGratification, GRATIFICATION_CAP_MONTHLY);
            }

            const taxableEarnings = baseSalary + gratification;
            const nonTaxableEarnings = (emp.mobilization || 0) + (emp.collation || 0);
            const totalEarnings = taxableEarnings + nonTaxableEarnings;

            const afpPercentage = emp.afp ? (afpMap.get(emp.afp) || 10) / 100 : 0;
            let healthDiscount = 0;
            if (emp.healthSystem === 'Fonasa') {
                healthDiscount = taxableEarnings * 0.07;
            } else if (emp.healthContributionType === 'Porcentaje') {
                healthDiscount = taxableEarnings * ((emp.healthContributionValue || 7) / 100);
            } else { 
                healthDiscount = (emp.healthContributionValue || 0) * (periodIndicator.uf || 37000); 
            }
            
            const afpDiscount = taxableEarnings * afpPercentage;

            let unemploymentInsuranceDiscount = 0;
            if (emp.hasUnemploymentInsurance && emp.unemploymentInsuranceType === 'Indefinido') {
                unemploymentInsuranceDiscount = taxableEarnings * 0.006;
            }
            
            const taxBase = taxableEarnings - afpDiscount - healthDiscount - unemploymentInsuranceDiscount;
            const taxBracket = taxParameters.find(t => taxBase > t.desde && taxBase <= t.hasta && t.year === year && t.month === month);

            let iut = 0;
            let iutFactor = 0;
            let iutRebajaInCLP = 0;
            if (taxBracket) {
                iutFactor = taxBracket.factor;
                iutRebajaInCLP = taxBracket.rebaja;
                iut = (taxBase * iutFactor) - iutRebajaInCLP;
                if (iut < 0) iut = 0;
            }

            const totalDiscounts = afpDiscount + healthDiscount + iut + unemploymentInsuranceDiscount;
            const netSalary = totalEarnings - totalDiscounts;
            
            const newPayroll: Omit<Payroll, 'id'> = {
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                period: period,
                year: year,
                month: month,
                baseSalary: baseSalary,
                gratification: gratification,
                taxableEarnings: taxableEarnings,
                nonTaxableEarnings: nonTaxableEarnings,
                otherTaxableEarnings: 0, 
                totalEarnings: totalEarnings,
                afpDiscount: afpDiscount,
                healthDiscount: healthDiscount,
                unemploymentInsuranceDiscount: unemploymentInsuranceDiscount,
                iut: iut,
                iutFactor: iutFactor,
                iutRebajaInCLP: iutRebajaInCLP,
                otherDiscounts: 0,
                totalDiscounts: totalDiscounts,
                netSalary: netSalary,
                companyId: companyId,
            };
            const payrollRef = doc(collection(firestore, `companies/${companyId}/payrolls`));
            batch.set(payrollRef, newPayroll);
        });

        try {
            await batch.commit();
            toast({ title: 'Proceso Exitoso', description: `Se guardaron ${activeEmployees.length} liquidaciones para el período ${period}.`});
        } catch (error) {
             console.error("Error saving payrolls:", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `companies/${companyId}/payrolls`,
                operation: 'create',
            }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleViewDetails = (payroll: Payroll) => {
        const employee = employees?.find(e => e.id === payroll.employeeId);
        if (employee) {
            setSelectedPayroll({ payroll, employee });
        }
    }

    const handleOpenDeleteDialog = (payroll: Payroll) => {
        setPayrollToDelete(payroll);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!firestore || !companyId || !payrollToDelete) return;
        const docRef = doc(firestore, `companies/${companyId}/payrolls`, payrollToDelete.id);
        
        try {
            await deleteDoc(docRef);
            toast({ title: "Liquidación Anulada", description: "El registro de la liquidación ha sido eliminado." });
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            }));
        } finally {
            setIsDeleteDialogOpen(false);
            setPayrollToDelete(null);
        }
    };

    const filteredPayrolls = React.useMemo(() => {
        return payrolls?.filter(p => p.year === year && p.month === month) || [];
    }, [payrolls, year, month]);

    const canProcess = companyId && selectedCompany?.periodStartDate;

    return (
        <>
             <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Procesar Liquidaciones de Sueldo</CardTitle>
                        <CardDescription>
                            Selecciona un período para calcular y guardar las liquidaciones de todos los empleados activos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="month">Mes</Label>
                                    <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
                                        <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    {format(new Date(0, i), 'MMMM', { locale: es })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Año</Label>
                                     <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                                        <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <SelectItem key={currentYear - i} value={(currentYear - i).toString()}>
                                                    {currentYear - i}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={handleProcessPayrolls} disabled={loading || isProcessing || !canProcess}>
                                {loading ? 'Cargando...' : isProcessing ? 'Procesando...' : 'Procesar Liquidaciones'}
                            </Button>
                        </div>
                         {!canProcess && companyId && (
                            <p className="text-sm text-destructive mt-2">
                                Por favor, define un período de trabajo en la configuración de la empresa para poder procesar las liquidaciones.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Liquidaciones Procesadas</CardTitle>
                        <CardDescription>Liquidaciones guardadas para el período seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Sueldo Base</TableHead>
                                    <TableHead className="text-right">Descuentos</TableHead>
                                    <TableHead className="text-right">Impuesto Único</TableHead>
                                    <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center">Cargando datos...</TableCell></TableRow>
                            ) : filteredPayrolls.length > 0 ? (
                                filteredPayrolls.map((payroll) => (
                                    <TableRow key={payroll.id}>
                                        <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                                        <TableCell>{payroll.period}</TableCell>
                                        <TableCell className="text-right">${Math.round(payroll.baseSalary).toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right text-destructive">-${Math.round(payroll.afpDiscount + payroll.healthDiscount).toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right text-destructive">-${Math.round(payroll.iut || 0).toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right font-bold">${Math.round(payroll.netSalary).toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Acciones</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleViewDetails(payroll)}>
                                                        <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onSelect={() => handleOpenDeleteDialog(payroll)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Anular Liquidación
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={7} className="text-center">
                                    {!companyId ? "Selecciona una empresa para ver sus liquidaciones." : "No se encontraron liquidaciones para este período."}
                                </TableCell></TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <PayrollDetailDialog 
                isOpen={!!selectedPayroll}
                onClose={() => setSelectedPayroll(null)}
                data={selectedPayroll}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto anulará permanentemente la liquidación de <span className="font-bold">{payrollToDelete?.employeeName}</span> para el período <span className="font-bold">{payrollToDelete?.period}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDelete}
                        >
                            Sí, anular
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
