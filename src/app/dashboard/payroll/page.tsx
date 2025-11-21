'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, getDoc, doc } from 'firebase/firestore';
import type { Employee, Payroll, PayrollDraft } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { PayrollProcessPreviewDialog } from '@/components/payroll-process-preview-dialog';
import { PayrollDraftsTable } from '@/components/payroll/PayrollDraftsTable';
import { ProcessedPayrollsTable } from '@/components/payroll/ProcessedPayrollsTable';
import { PayrollDetailDialog } from '@/components/payroll-detail-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear + 5 - i);

type EmployeeStatus = {
    employee: Employee;
    draft: PayrollDraft | null;
    error: string | null;
    isRecalculating?: boolean;
}

async function calculateOrGetError(employee: Employee, year: number, month: number, token: string, companyId: string, draftOverrides?: Partial<PayrollDraft>): Promise<PayrollDraft | { error: string }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const bodyPayload = { ...employee, overrides: draftOverrides };
        const response = await fetch(`/api/payroll/calculate-preview?companyId=${companyId}&year=${year}&month=${month}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Error del servidor (${response.status})`);
        return data as PayrollDraft;
    } catch (error) {
        console.error(`Falló el cálculo para el empleado ${employee.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return { error: errorMessage };
    }
}

function PayrollContent({ companyId, initialPeriod }: { companyId: string, initialPeriod: { year: number, month: number } }) {
    const { toast } = useToast();
    const { user, loading: authLoading } = useUser();
    const firestore = useFirestore();
    const [selectedYear, setSelectedYear] = React.useState(String(initialPeriod.year));
    const [selectedMonth, setSelectedMonth] = React.useState(String(initialPeriod.month));
    const [refetchTrigger, setRefetchTrigger] = React.useState(0);
    const [employeeStatuses, setEmployeeStatuses] = React.useState<EmployeeStatus[]>([]);
    const [calculationStatus, setCalculationStatus] = React.useState('idle');
    const [generalError, setGeneralError] = React.useState<string | null>(null);
    const [previewingData, setPreviewingData] = React.useState<{ payroll: Payroll; employee: Employee; } | null>(null);
    const [isUndoDialogOpen, setIsUndoDialogOpen] = React.useState(false);
    const [isUndoing, setIsUndoing] = React.useState(false);

    const allEmployeesQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(collection(firestore, `companies/${companyId}/employees`), where("status", "==", "Active"));
    }, [firestore, companyId]);

    const processedPayrollsQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        const periodDateUTC = new Date(Date.UTC(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1));
        return query(collection(firestore, `companies/${companyId}/payrolls`), where("period", "==", periodDateUTC));
    }, [firestore, companyId, selectedYear, selectedMonth, refetchTrigger]);

    const { data: allEmployees, loading: employeesLoading, error: employeesError } = useCollection<Employee>({ query: allEmployeesQuery });
    const { data: processedPayrolls, loading: payrollsLoading } = useCollection<Payroll>({ query: processedPayrollsQuery });

    const isPeriodProcessed = React.useMemo(() => processedPayrolls && processedPayrolls.length > 0, [processedPayrolls]);

    React.useEffect(() => {
        setEmployeeStatuses([]);
        setCalculationStatus('idle');
        setGeneralError(null);
    }, [selectedYear, selectedMonth, refetchTrigger]);

    React.useEffect(() => {
        if (authLoading || employeesLoading || payrollsLoading || isPeriodProcessed) return;
        if (!user) { setGeneralError("Sesión no válida. Por favor, inicie sesión de nuevo."); setCalculationStatus('done'); return; }
        if (employeesError) { setGeneralError(`Error crítico al cargar empleados: ${employeesError.message}`); setCalculationStatus('done'); return; }
        if (!allEmployees || allEmployees.length === 0) { setCalculationStatus('done'); return; }
        setGeneralError(null);
        setCalculationStatus('calculating');
        const processAllEmployees = async () => {
            const token = await user.getIdToken();
            const numericYear = parseInt(selectedYear, 10);
            const numericMonth = parseInt(selectedMonth, 10);
            const periodStart = new Date(numericYear, numericMonth - 1, 1);
            const periodEnd = new Date(numericYear, numericMonth, 0);
            const statusPromises = allEmployees.map(async (emp): Promise<EmployeeStatus> => {
                if (!emp.contractStartDate) return { employee: emp, draft: null, error: 'Falta fecha de inicio de contrato.' };
                const startDate = (emp.contractStartDate as unknown as Timestamp).toDate();
                if (startDate > periodEnd) return { employee: emp, draft: null, error: 'Contrato no vigente para el período (inicio posterior).' };
                if (emp.contractEndDate) {
                    const endDate = (emp.contractEndDate as unknown as Timestamp).toDate();
                    if (endDate < periodStart) return { employee: emp, draft: null, error: 'Contrato no vigente para el período (fin anterior).' };
                }
                const result = await calculateOrGetError(emp, numericYear, numericMonth, token, companyId);
                return 'error' in result ? { employee: emp, draft: null, error: result.error } : { employee: emp, draft: result, error: null };
            });
            const results = await Promise.all(statusPromises);
            const forbiddenError = results.find(r => r.error === 'Forbidden');
            if (forbiddenError) setGeneralError("Error de Permiso: No tienes acceso para calcular liquidaciones en esta empresa.");
            setEmployeeStatuses(results);
            setCalculationStatus('done');
        };
        processAllEmployees();
    }, [authLoading, user, allEmployees, isPeriodProcessed, employeesError, employeesLoading, payrollsLoading, selectedYear, selectedMonth, companyId]);
    
    const handlePreview = async (item: Payroll | PayrollDraft) => {
        const employeeId = item.employeeId;
        if (!firestore) return;
        const employeeDocRef = doc(firestore, `companies/${companyId}/employees`, employeeId);
        try {
            const employeeDoc = await getDoc(employeeDocRef);
            if (!employeeDoc.exists()) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar al empleado asociado a esta liquidación." });
                return;
            }
            const employeeData = employeeDoc.data() as Employee;
            
            // Ensure the object passed to the dialog is a full Payroll object
            const payrollData: Payroll = {
                id: 'id' in item ? item.id! : 'preview-id',
                companyId: companyId,
                employeeId: employeeId,
                employeeName: item.employeeName || `${employeeData.firstName} ${employeeData.lastName}`,
                period: 'period' in item ? item.period! : `${selectedYear}-${selectedMonth}`,
                year: item.year || parseInt(selectedYear),
                month: item.month || parseInt(selectedMonth),
                baseSalary: item.baseSalary || 0,
                workedDays: item.workedDays || 0,
                absentDays: item.absentDays || 0,
                proportionalBaseSalary: 'proportionalBaseSalary' in item ? item.proportionalBaseSalary! : 0,
                overtimeHours50: item.overtimeHours50 || 0,
                overtimeHours100: item.overtimeHours100 || 0,
                totalOvertimePay: 'totalOvertimePay' in item ? item.totalOvertimePay! : 0,
                bonos: 'bonos' in item ? item.bonos! : (item as PayrollDraft).variableBonos || [],
                gratification: item.gratification || 0,
                taxableEarnings: item.taxableEarnings || 0,
                nonTaxableEarnings: item.nonTaxableEarnings || 0,
                totalEarnings: item.totalEarnings || 0,
                afpDiscount: item.afpDiscount || 0,
                healthDiscount: item.healthDiscount || 0,
                unemploymentInsuranceDiscount: item.unemploymentInsuranceDiscount || 0,
                iut: item.iut || 0,
                familyAllowance: 'familyAllowance' in item ? item.familyAllowance! : 0,
                advances: item.advances || 0,
                totalDiscounts: item.totalDiscounts || 0,
                netSalary: item.netSalary || 0,
                createdAt: 'createdAt' in item ? item.createdAt : new Date(),
            };

            setPreviewingData({ payroll: payrollData, employee: employeeData });

        } catch (error) {
            console.error("Error fetching employee for preview:", error);
            toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al cargar los datos del empleado." });
        }
    };
    
    const handleDraftChange = (employeeId: string, field: keyof PayrollDraft, value: any) => {
        setEmployeeStatuses(currentStatuses =>
            currentStatuses.map(s => {
                if (s.employee.id === employeeId) {
                    const updatedDraft = { ...(s.draft || {}), employeeId, employeeName: s.employee.firstName + ' ' + s.employee.lastName, [field]: value } as PayrollDraft;
                    return { ...s, draft: updatedDraft };
                }
                return s;
            })
        );
    };
    
    const handleRecalculate = async (employeeId: string) => {
        const currentStatus = employeeStatuses.find(s => s.employee.id === employeeId);
        if (!currentStatus || !user) return;
        setEmployeeStatuses(currentStatuses => currentStatuses.map(s => s.employee.id === employeeId ? { ...s, isRecalculating: true } : s));
        try {
            const token = await user.getIdToken();
            const numericYear = parseInt(selectedYear, 10);
            const numericMonth = parseInt(selectedMonth, 10);
            const draftOverrides: Partial<PayrollDraft> = { workedDays: currentStatus.draft?.workedDays, absentDays: currentStatus.draft?.absentDays, overtimeHours50: currentStatus.draft?.overtimeHours50, overtimeHours100: currentStatus.draft?.overtimeHours100, variableBonos: currentStatus.draft?.variableBonos, advances: currentStatus.draft?.advances };
            const result = await calculateOrGetError(currentStatus.employee, numericYear, numericMonth, token, companyId, draftOverrides);
            setEmployeeStatuses(currentStatuses =>
                currentStatuses.map(s => {
                    if (s.employee.id === employeeId) {
                        return 'error' in result ? { ...s, error: result.error, isRecalculating: false } : { ...s, draft: result as PayrollDraft, error: null, isRecalculating: false };
                    }
                    return s;
                })
            );
        } catch (error) {
            console.error("Recalculation failed:", error);
            setEmployeeStatuses(currentStatuses => currentStatuses.map(s => s.employee.id === employeeId ? { ...s, error: 'Error al recalcular', isRecalculating: false } : s));
        }
    };

    const handleProcessingSuccess = () => setRefetchTrigger(c => c + 1);

    const handleUndoCentralization = async () => {
        setIsUndoing(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/payroll/undo-centralization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ companyId, year: selectedYear, month: selectedMonth }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Error al anular la centralización'); }
            toast({ title: "Éxito", description: "La centralización ha sido anulada. Puede procesar el período nuevamente." });
            setIsUndoDialogOpen(false);
            setRefetchTrigger(c => c + 1);
        } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido'; toast({ variant: "destructive", title: "Error de Anulación", description: errorMessage });
        } finally { setIsUndoing(false); }
    };

    const isLoading = authLoading || employeesLoading || payrollsLoading || calculationStatus === 'calculating';
    const successfulDrafts = employeeStatuses.filter(s => s.draft).map(s => s.draft as PayrollDraft);
    const failedEmployees = employeeStatuses.filter(s => s.error && s.error !== 'Forbidden');
    const numericMonth = parseInt(selectedMonth, 10);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Gestión de Liquidaciones</CardTitle>
                        <CardDescription>Período: {months.find(m => m.value === numericMonth)?.label} {selectedYear}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent></Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}><SelectTrigger className="w-[100px]"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
                        {!isPeriodProcessed && <PayrollProcessPreviewDialog drafts={successfulDrafts} year={selectedYear} month={selectedMonth} onSuccess={handleProcessingSuccess} />}
                    </div>
                </CardHeader>
            </Card>

            {isLoading && <div className="text-center py-12">{calculationStatus === 'calculating' ? 'Calculando liquidaciones...' : 'Cargando datos...'}</div>}
            {generalError && !isLoading && <div className="text-center py-12 text-red-500 font-medium">{generalError}</div>}

            {!isPeriodProcessed && !generalError && calculationStatus === 'done' && (
                allEmployees && allEmployees.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Borradores Generados ({successfulDrafts.length})</CardTitle></CardHeader>
                            <CardContent>{successfulDrafts.length > 0 ? <PayrollDraftsTable statuses={employeeStatuses.filter(s => s.draft)} year={parseInt(selectedYear)} month={numericMonth} onPreview={handlePreview} onDraftChange={handleDraftChange} onRecalculate={handleRecalculate} /> : <div className="text-center py-10 text-gray-500">No se generaron liquidaciones. Revise la sección de problemas.</div>}</CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-amber-600">Empleados con Problemas ({failedEmployees.length})</CardTitle></CardHeader>
                            <CardContent>{failedEmployees.length > 0 ? <ul className="space-y-3">{failedEmployees.map(status => <li key={status.employee.id} className="p-3 bg-amber-50 rounded-md border border-amber-200"><p className="font-semibold">{status.employee.firstName} {status.employee.lastName}</p><p className="text-sm text-red-600">Motivo: {status.error}</p></li>)}</ul> : <div className="text-center py-10 text-gray-500">Todos los empleados se procesaron correctamente.</div>}</CardContent>
                        </Card>
                    </div>
                ) : <Card><CardContent className="pt-6"><div className="text-center py-10 text-gray-500">No hay empleados activos en esta empresa.</div></CardContent></Card>
            )}

            {!isLoading && !generalError && isPeriodProcessed && processedPayrolls && (
                <Card>
                    <CardHeader>
                        <CardTitle>Período Procesado y Centralizado</CardTitle>
                        <CardDescription>La contabilidad de este período ya está generada. Para hacer cambios, primero debes anular este proceso.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="destructive" onClick={() => setIsUndoDialogOpen(true)} disabled={isUndoing}>{isUndoing ? 'Anulando...' : 'Anular Centralización'}</Button>
                        <ProcessedPayrollsTable payrolls={processedPayrolls} onPreview={handlePreview} />
                    </CardContent>
                </Card>
            )}

            <PayrollDetailDialog data={previewingData} isOpen={!!previewingData} onClose={() => setPreviewingData(null)} />

            <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>¿Anular Centralización del Período?</DialogTitle><DialogDescription>Esta acción eliminará el comprobante de centralización y las liquidaciones procesadas para {months.find(m => m.value === numericMonth)?.label} {selectedYear}. <br />Podrás volver a generar los borradores y procesar el período nuevamente. Esta acción es irreversible.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setIsUndoDialogOpen(false)} disabled={isUndoing}>Cancelar</Button><Button variant="destructive" onClick={handleUndoCentralization} disabled={isUndoing}>{isUndoing ? 'Anulando...' : 'Sí, anular proceso'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { user, loading: authLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);

    if (authLoading || profileLoading) return <div className="flex items-center justify-center h-full"><p>Cargando...</p></div>;

    if (!selectedCompany) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center"><CardHeader><CardTitle>Seleccione una Empresa</CardTitle><CardDescription>Por favor, elija una empresa para empezar a gestionar las liquidaciones.</CardDescription></CardHeader></Card>
            </div>
        );
    }
    
    const now = new Date();
    return <PayrollContent companyId={selectedCompany.id} initialPeriod={{ year: now.getFullYear(), month: now.getMonth() + 1 }} />;
}
