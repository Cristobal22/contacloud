'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Employee, Payroll, PayrollDraft } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { PayrollProcessPreviewDialog } from '@/components/payroll-process-preview-dialog';
import { PayrollDraftsTable } from '@/components/payroll/PayrollDraftsTable';
import { PayrollDetailDialog } from '@/components/payroll-detail-dialog';
import { parseISO } from 'date-fns';
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
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error del servidor (${response.status})`);
        }

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
    const [previewingData, setPreviewingData] = React.useState<{ payroll: PayrollDraft; employee: Employee; } | null>(null);
    
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
        if (authLoading || employeesLoading || payrollsLoading || isPeriodProcessed) {
            setCalculationStatus('done');
            return;
        }

        if (!user) {
            setGeneralError("Sesión no válida. Por favor, inicie sesión de nuevo.");
            setCalculationStatus('done');
            return;
        }

        if (employeesError) {
            setGeneralError(`Error crítico al cargar empleados: ${employeesError.message}`);
            setCalculationStatus('done');
            return;
        }

        if (!allEmployees || allEmployees.length === 0) {
            setGeneralError("No hay empleados activos en esta empresa.");
            setCalculationStatus('done');
            return;
        }

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
                return 'error' in result
                    ? { employee: emp, draft: null, error: result.error }
                    : { employee: emp, draft: result, error: null };
            });

            const results = await Promise.all(statusPromises);
            setEmployeeStatuses(results);
            setCalculationStatus('done');
        };

        processAllEmployees();

    }, [authLoading, user, allEmployees, isPeriodProcessed, employeesError, employeesLoading, payrollsLoading, selectedYear, selectedMonth, companyId]);
    
    const handlePreview = (draftToPreview: PayrollDraft) => {
        const employeeStatus = employeeStatuses.find(status => status.draft?.employeeId === draftToPreview.employeeId);
        if (employeeStatus && employeeStatus.draft) {
            setPreviewingData({
                payroll: employeeStatus.draft,
                employee: employeeStatus.employee,
            });
        }
    };
    
    const handleDraftChange = async (employeeId: string, field: keyof PayrollDraft, value: any) => {
        const fieldsThatTriggerRecalculation: (keyof PayrollDraft)[] = ['workedDays', 'absentDays', 'overtimeHours50', 'overtimeHours100', 'variableBonos', 'advances'];
        const requiresRecalculation = fieldsThatTriggerRecalculation.includes(field);
        const currentStatus = employeeStatuses.find(s => s.employee.id === employeeId);

        if (!currentStatus || !user) return;
        
        const updatedDraft = { ...(currentStatus.draft || {}), employeeId, employeeName: currentStatus.employee.firstName + ' ' + currentStatus.employee.lastName, [field]: value };

        setEmployeeStatuses(currentStatuses =>
            currentStatuses.map(s => s.employee.id === employeeId ? { ...s, draft: updatedDraft, isRecalculating: requiresRecalculation } : s)
        );
        
        if (requiresRecalculation) {
            try {
                const token = await user.getIdToken();
                const numericYear = parseInt(selectedYear, 10);
                const numericMonth = parseInt(selectedMonth, 10);
                
                const result = await calculateOrGetError(currentStatus.employee, numericYear, numericMonth, token, companyId, updatedDraft);

                setEmployeeStatuses(currentStatuses =>
                    currentStatuses.map(s => {
                        if (s.employee.id === employeeId) {
                            return 'error' in result
                                ? { ...s, error: result.error, isRecalculating: false }
                                : { ...s, draft: result as PayrollDraft, error: null, isRecalculating: false };
                        }
                        return s;
                    })
                );
            } catch (error) {
                console.error("Recalculation failed:", error);
                setEmployeeStatuses(currentStatuses =>
                    currentStatuses.map(s => s.employee.id === employeeId ? { ...s, error: 'Error al recalcular', isRecalculating: false } : s)
                );
            }
        }
    };
    
    const handleProcessingSuccess = () => {
        setRefetchTrigger(c => c + 1);
    };

    const handleUndoCentralization = async () => {
        setIsUndoing(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/payroll/undo-centralization', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ companyId, year: selectedYear, month: selectedMonth }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al anular la centralización');
            }
            
            toast({ title: "Éxito", description: "La centralización ha sido anulada. Puede procesar el período nuevamente." });
            setIsUndoDialogOpen(false);
            setRefetchTrigger(c => c + 1);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
            toast({ variant: "destructive", title: "Error de Anulación", description: errorMessage });
        } finally {
            setIsUndoing(false);
        }
    };

    const isLoading = authLoading || employeesLoading || payrollsLoading || calculationStatus === 'calculating';
    const successfulDrafts = employeeStatuses.filter(s => s.draft).map(s => s.draft as PayrollDraft);
    const failedEmployees = employeeStatuses.filter(s => s.error);

    let loadingMessage = 'Verificando sesión...';
    if (!authLoading && (employeesLoading || payrollsLoading)) loadingMessage = 'Cargando datos...';
    else if (!authLoading && calculationStatus === 'calculating') loadingMessage = 'Calculando liquidaciones...';

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
                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading}>
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mes" /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}>
                            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Año" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                        {!isPeriodProcessed && <PayrollProcessPreviewDialog drafts={successfulDrafts} year={selectedYear} month={selectedMonth} onSuccess={handleProcessingSuccess} />} 
                    </div>
                </CardHeader>
            </Card>

            {isLoading && <div className="text-center py-12">{loadingMessage}</div>}

            {generalError && !isLoading && <div className="text-center py-12 text-red-500 font-medium">{generalError}</div>}

            {!isPeriodProcessed && !generalError && calculationStatus === 'done' && (
                 <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Borradores Generados ({successfulDrafts.length})</CardTitle></CardHeader>
                        <CardContent>
                            {successfulDrafts.length > 0 ? (
                                <PayrollDraftsTable drafts={successfulDrafts} onPreview={handlePreview} onDraftChange={handleDraftChange} />
                            ) : (
                                <div className="text-center py-10 text-gray-500">No se generaron liquidaciones exitosas.</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-amber-600">Empleados con Problemas ({failedEmployees.length})</CardTitle></CardHeader>
                        <CardContent>
                            {failedEmployees.length > 0 ? (
                                <ul className="space-y-3">
                                    {failedEmployees.map(status => (
                                        <li key={status.employee.id} className="p-3 bg-amber-50 rounded-md border border-amber-200">
                                            <p className="font-semibold">{status.employee.firstName} {status.employee.lastName}</p>
                                            <p className="text-sm text-red-600">Motivo: {status.error}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-10 text-gray-500">Todos los empleados se procesaron correctamente.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {!isLoading && !generalError && isPeriodProcessed && (
                <Card>
                    <CardHeader>
                        <CardTitle>Período Procesado y Centralizado</CardTitle>
                        <CardDescription>La contabilidad de este período ya está generada. Para hacer cambios, primero debes anular este proceso.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button variant="destructive" onClick={() => setIsUndoDialogOpen(true)} disabled={isUndoing}>
                            {isUndoing ? 'Anulando...' : 'Anular Centralización'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <PayrollDetailDialog data={previewingData} isOpen={!!previewingData} onClose={() => setPreviewingData(null)} />

            <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Anular Centralización del Período?</DialogTitle>
                        <DialogDescription>
                            Esta acción eliminará el comprobante de centralización y las liquidaciones procesadas para {months.find(m => m.value === numericMonth)?.label} {selectedYear}. <br />
                            Podrás volver a generar los borradores y procesar el período nuevamente. Esta acción es irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUndoDialogOpen(false)} disabled={isUndoing}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleUndoCentralization} disabled={isUndoing}>
                            {isUndoing ? 'Anulando...' : 'Sí, anular proceso'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};

    if (!selectedCompany) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Seleccione una Empresa</CardTitle>
                        <CardDescription>Por favor, elija una empresa para empezar a gestionar las liquidaciones.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const now = new Date();
    const initialYear = now.getFullYear();
    const initialMonth = now.getMonth() + 1;

    return <PayrollContent companyId={selectedCompany.id} initialPeriod={{ year: initialYear, month: initialMonth }} />;
}
