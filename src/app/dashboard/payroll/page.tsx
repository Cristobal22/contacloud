'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from '@/firebase/auth/use-user';
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
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';

const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

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
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error del servidor (${response.status})`);
        }
        const data = await response.json();
        return data as PayrollDraft;
    } catch (error) {
        console.error(`Falló el cálculo para el empleado ${employee.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return { error: `Calculation error: ${errorMessage}` };
    }
}

function PayrollContent() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useUser();
    const firestore = useFirestore();
    const context = React.useContext(SelectedCompanyContext);

    if (!context) throw new Error("SelectedCompanyContext must be used within a provider");
    const { selectedCompany, periodYear, periodMonth } = context;
    const companyId = selectedCompany?.id;

    const [refetchTrigger, setRefetchTrigger] = React.useState(0);
    const [employeeStatuses, setEmployeeStatuses] = React.useState<EmployeeStatus[]>([]);
    const [calculationStatus, setCalculationStatus] = React.useState('idle');
    const [generalError, setGeneralError] = React.useState<string | null>(null);
    const [previewingData, setPreviewingData] = React.useState<{ payroll: Payroll; employee: Employee; } | null>(null);
    const [isUndoDialogOpen, setIsUndoDialogOpen] = React.useState(false);
    const [isUndoing, setIsUndoing] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const allEmployeesQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(collection(firestore, `companies/${companyId}/employees`), where("status", "==", "Active"));
    }, [firestore, companyId]);

    const processedPayrollsQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        const periodDateUTC = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
        return query(collection(firestore, `companies/${companyId}/payrolls`), where("period", "==", periodDateUTC));
    }, [firestore, companyId, periodYear, periodMonth, refetchTrigger]);

    const { data: allEmployees, loading: employeesLoading, error: employeesError } = useCollection<Employee>({ query: allEmployeesQuery });
    const { data: processedPayrolls, loading: payrollsLoading } = useCollection<Payroll>({ query: processedPayrollsQuery });

    const isPeriodProcessed = React.useMemo(() => processedPayrolls && processedPayrolls.length > 0, [processedPayrolls]);

    React.useEffect(() => {
        setEmployeeStatuses([]);
        setCalculationStatus('idle');
        setGeneralError(null);
    }, [periodYear, periodMonth, refetchTrigger, companyId]);

    React.useEffect(() => {
        if (!companyId || authLoading || employeesLoading || payrollsLoading || isPeriodProcessed) return;
        if (!user) { setGeneralError("Sesión no válida. Por favor, inicie sesión de nuevo."); setCalculationStatus('done'); return; }
        if (employeesError) { setGeneralError(`Error crítico al cargar empleados: ${employeesError.message}`); setCalculationStatus('done'); return; }
        if (!allEmployees || allEmployees.length === 0) { setCalculationStatus('done'); return; }
        
        setGeneralError(null);
        setCalculationStatus('calculating');
        const processAllEmployees = async () => {
            const token = await user.getIdToken();
            const periodStart = new Date(periodYear, periodMonth - 1, 1);
            const periodEnd = new Date(periodYear, periodMonth, 0);
            
            const activeEmployeesForPeriod = allEmployees.filter(emp => {
                if (!emp.contractStartDate) return false;
                const startDate = (emp.contractStartDate as unknown as Timestamp).toDate();
                if (startDate > periodEnd) return false;
                if (emp.contractEndDate) {
                    const endDate = (emp.contractEndDate as unknown as Timestamp).toDate();
                    if (endDate < periodStart) return false;
                }
                return true;
            });

            if (activeEmployeesForPeriod.length === 0) {
                setCalculationStatus('done');
                return;
            }

            const statusPromises = activeEmployeesForPeriod.map(async (emp): Promise<EmployeeStatus> => {
                const result = await calculateOrGetError(emp, periodYear, periodMonth, token, companyId);
                return 'error' in result ? { employee: emp, draft: null, error: result.error } : { employee: emp, draft: result, error: null };
            });

            const results = await Promise.all(statusPromises);

            // Intelligent error handling
            const allFailedForIndicators = results.length > 0 && results.every(
                r => r.error && r.error.includes('Faltan indicadores económicos')
            );

            if (allFailedForIndicators) {
                setGeneralError("Mes sin indicadores económicos hasta el momento");
            } else {
                const forbiddenError = results.find(r => r.error === 'Forbidden');
                if (forbiddenError) setGeneralError("Error de Permiso: No tienes acceso para calcular liquidaciones en esta empresa.");
                setEmployeeStatuses(results);
            }

            setCalculationStatus('done');
        };
        processAllEmployees();
    }, [authLoading, user, allEmployees, isPeriodProcessed, employeesError, employeesLoading, payrollsLoading, periodYear, periodMonth, companyId]);
    
    const handlePreview = async (item: Payroll | PayrollDraft) => {
        const employeeId = item.employeeId;
        if (!firestore || !companyId) return;
        const employeeDocRef = doc(firestore, `companies/${companyId}/employees`, employeeId);
        try {
            const employeeDoc = await getDoc(employeeDocRef);
            if (!employeeDoc.exists()) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar al empleado asociado a esta liquidación." });
                return;
            }
            const employeeData = employeeDoc.data() as Employee;
            
            const payrollData: Payroll = {
                id: 'id' in item ? item.id! : 'preview-id',
                companyId: companyId,
                employeeId: employeeId,
                employeeName: item.employeeName || `${employeeData.firstName} ${employeeData.lastName}`,
                period: 'period' in item ? item.period! : `${periodYear}-${periodMonth}`,
                year: item.year || periodYear,
                month: item.month || periodMonth,
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
        if (!currentStatus || !user || !companyId) return;
        setEmployeeStatuses(currentStatuses => currentStatuses.map(s => s.employee.id === employeeId ? { ...s, isRecalculating: true } : s));
        try {
            const token = await user.getIdToken();
            const draftOverrides: Partial<PayrollDraft> = { workedDays: currentStatus.draft?.workedDays, absentDays: currentStatus.draft?.absentDays, overtimeHours50: currentStatus.draft?.overtimeHours50, overtimeHours100: currentStatus.draft?.overtimeHours100, variableBonos: currentStatus.draft?.variableBonos, advances: currentStatus.draft?.advances };
            const result = await calculateOrGetError(currentStatus.employee, periodYear, periodMonth, token, companyId, draftOverrides);
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
        if (!user || !companyId) return;
        setIsUndoing(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/payroll/undo-centralization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ companyId, year: periodYear, month: periodMonth }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Error al anular la centralización'); }
            toast({ title: "Éxito", description: "La centralización ha sido anulada. Puede procesar el período nuevamente." });
            setIsUndoDialogOpen(false);
            setRefetchTrigger(c => c + 1);
        } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido'; toast({ variant: "destructive", title: "Error de Anulación", description: errorMessage });
        } finally { setIsUndoing(false); }
    };

    const handleDownloadAllPayslips = async () => {
        if (!user || !companyId) return;

        setIsDownloading(true);
        toast({ title: "Generando PDF unificado...", description: "Esto puede tardar un momento." });

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/payroll/generate-bulk-payslip-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    companyId: companyId, 
                    year: periodYear,
                    month: periodMonth 
                }),
            });

            if (!response.ok) {
                let errorMsg = `Error HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    errorMsg = response.statusText;
                }
                throw new Error(errorMsg);
            }

            const pdfBlob = await response.blob();
            const periodName = months.find(m => m.value === periodMonth)?.label || 'Mes';
            saveAs(pdfBlob, `Liquidaciones_${periodName}_${periodYear}.pdf`);
            toast({ title: "Éxito", description: "El PDF con todas las liquidaciones se ha descargado." });

        } catch (error) {
            console.error("Error al generar el PDF unificado:", error);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            toast({ 
                variant: "destructive", 
                title: "Error de Descarga", 
                description: errorMessage 
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const isLoading = authLoading || employeesLoading || payrollsLoading || calculationStatus === 'calculating';
    const successfulDrafts = employeeStatuses.filter(s => s.draft).map(s => s.draft as PayrollDraft);
    const failedEmployees = employeeStatuses.filter(s => s.error && s.error !== 'Forbidden');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Gestión de Liquidaciones</CardTitle>
                        <CardDescription>Período: {months.find(m => m.value === periodMonth)?.label} {periodYear}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isPeriodProcessed && <PayrollProcessPreviewDialog drafts={successfulDrafts} year={String(periodYear)} month={String(periodMonth)} onSuccess={handleProcessingSuccess} />}
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
                            <CardContent>{successfulDrafts.length > 0 ? <PayrollDraftsTable statuses={employeeStatuses.filter(s => s.draft)} year={periodYear} month={periodMonth} onPreview={handlePreview} onDraftChange={handleDraftChange} onRecalculate={handleRecalculate} /> : <div className="text-center py-10 text-gray-500">No se generaron liquidaciones. Revise la sección de problemas.</div>}</CardContent>
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
                        <div className="flex items-center gap-2">
                            <Button variant="destructive" onClick={() => setIsUndoDialogOpen(true)} disabled={isUndoing || isDownloading}>{isUndoing ? 'Anulando...' : 'Anular Centralización'}</Button>
                            <Button variant="outline" onClick={handleDownloadAllPayslips} disabled={isDownloading || isUndoing}>
                                <Download className="mr-2 h-4 w-4" />
                                {isDownloading ? 'Descargando...' : 'Descargar Todas'}
                            </Button>
                        </div>
                        <ProcessedPayrollsTable payrolls={processedPayrolls} onPreview={handlePreview} />
                    </CardContent>
                </Card>
            )}

            <PayrollDetailDialog data={previewingData} isOpen={!!previewingData} onClose={() => setPreviewingData(null)} />

            <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>¿Anular Centralización del Período?</DialogTitle><DialogDescription>Esta acción eliminará el comprobante de centralización y las liquidaciones procesadas para {months.find(m => m.value === periodMonth)?.label} {periodYear}. <br />Podrás volver a generar los borradores y procesar el período nuevamente. Esta acción es irreversible.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setIsUndoDialogOpen(false)} disabled={isUndoing}>Cancelar</Button><Button variant="destructive" onClick={handleUndoCentralization} disabled={isUndoing}>{isUndoing ? 'Anulando...' : 'Sí, anular proceso'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function PayrollPage() {
    const context = React.useContext(SelectedCompanyContext);

    if (!context) {
        return <div className="flex items-center justify-center h-full"><p>Cargando contexto...</p></div>;
    }

    const { selectedCompany } = context;

    if (!selectedCompany) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center"><CardHeader><CardTitle>Seleccione una Empresa</CardTitle><CardDescription>Por favor, elija una empresa para empezar a gestionar las liquidaciones.</CardDescription></CardHeader></Card>
            </div>
        );
    }
    
    return <PayrollContent />;
}
