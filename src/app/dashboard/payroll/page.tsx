
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

import type { Employee, AfpEntity, Payroll, EconomicIndicator, TaxableCap, Voucher, Account, FamilyAllowanceParameter, PayrollDraft, Bono } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { PayrollProcessPreviewDialog } from '@/components/payroll-process-preview-dialog';
import PayslipPreview from '@/components/payslip-preview';
import { PayrollProcessedTable } from '@/components/payroll/PayrollProcessedTable';
import { PayrollDraftsTable } from '@/components/payroll/PayrollDraftsTable';

function PayrollContent({ companyId }: { companyId: string }) {
    const firestore = useFirestore();
    const { user } = useAuth(); // Needed for API calls
    const { toast } = useToast();
    
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = React.useState(true);
    const currentYear = new Date().getFullYear();
    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(new Date().getMonth() + 1);
    
    const [payrollDrafts, setPayrollDrafts] = React.useState<PayrollDraft[]>([]);
    const [processedPayrolls, setProcessedPayrolls] = React.useState<Payroll[]>([]);
    const [isPeriodProcessed, setIsPeriodProcessed] = React.useState(false);
    
    const [selectedPayrollForPreview, setSelectedPayrollForPreview] = React.useState<Payroll | PayrollDraft | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [totalsForPreview, setTotalsForPreview] = React.useState<any>(null);
    const [isCentralizePreviewOpen, setIsCentralizePreviewOpen] = React.useState(false);

    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: `companies/${companyId}/employees` });
    
    const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        if (employeesLoading) return;

        const initializePeriod = async () => {
            setIsLoadingDrafts(true);
            const q = query(collection(firestore, `companies/${companyId}/payrolls`), where("year", "==", year), where("month", "==", month));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                setProcessedPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
                setIsPeriodProcessed(true);
                setPayrollDrafts([]);
            } else {
                const activeEmployees = employees?.filter(e => e.status === 'Active' && e.baseSalary) || [];
                const initialDrafts: PayrollDraft[] = activeEmployees.map(emp => ({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    baseSalary: emp.baseSalary || 0,
                    absentDays: 0, variableBonos: [], overtimeHours50: 0, overtimeHours100: 0, advances: 0, year, month,
                }));

                const calculatedDrafts = await Promise.all(initialDrafts.map(d => handleDraftChange(d.employeeId, d, false)));
                setPayrollDrafts(calculatedDrafts.filter(d => d !== null) as PayrollDraft[]);
                setProcessedPayrolls([]);
                setIsPeriodProcessed(false);
            }
            setIsLoadingDrafts(false);
        };

        initializePeriod();
    }, [year, month, companyId, employees, employeesLoading, firestore]);

    const handleDraftChange = React.useCallback(async (employeeId: string, updatedDraftData: Partial<PayrollDraft>, isUpdate: boolean = true) => {
        if (!user) return null;

        const currentDraft = payrollDrafts.find(d => d.employeeId === employeeId) || updatedDraftData;
        const newDraft = { ...currentDraft, ...updatedDraftData };
        
        if(isUpdate) {
             setPayrollDrafts(prev => prev.map(d => d.employeeId === employeeId ? newDraft as PayrollDraft : d));
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/payroll/calculate-preview?companyId=${companyId}&year=${year}&month=${month}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newDraft),
            });

            if (!response.ok) throw new Error('API calculation failed');
            
            const calculatedDraft: PayrollDraft = await response.json();

            if(isUpdate) {
                setPayrollDrafts(prev => prev.map(d => d.employeeId === employeeId ? calculatedDraft : d));
            }
            return calculatedDraft;

        } catch (error) {
            console.error("Error in handleDraftChange:", error);
            toast({ variant: 'destructive', title: 'Error de Cálculo', description: 'No se pudo recalcular la liquidación.' });
            if(isUpdate) {
                setPayrollDrafts(prev => prev.map(d => d.employeeId === employeeId ? currentDraft as PayrollDraft : d));
            }
            return null;
        }
    }, [user, companyId, year, month, payrollDrafts, toast]);

    const debouncedHandleDraftChange = (employeeId: string, field: keyof PayrollDraft, value: any) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        const updatedDraft = payrollDrafts.find(d => d.employeeId === employeeId);
        if(updatedDraft) {
            const newDraftData = { ...updatedDraft, [field]: value };
            setPayrollDrafts(prev => prev.map(d => d.employeeId === employeeId ? newDraftData : d));

            debounceTimeout.current = setTimeout(() => {
                handleDraftChange(employeeId, newDraftData);
            }, 500);
        }
    };

    const handleOpenPreview = (payroll: Payroll | PayrollDraft) => {
        setSelectedPayrollForPreview(payroll);
        setIsPreviewOpen(true);
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
        setIsCentralizePreviewOpen(true);
    };
    
    const handleAnnulSuccess = (annulledPayrollId: string) => {
        setProcessedPayrolls(prev => prev.filter(p => p.id !== annulledPayrollId));
        if (processedPayrolls.length === 1) setIsPeriodProcessed(false);
    };

    const handleConfirmAndProcess = async () => { 
        if (!firestore || !payrollDrafts.length || !totalsForPreview || !companyId) return;
        
        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const periodId = `${year}-${String(month).padStart(2, '0')}`;
        const payrollsCollectionRef = collection(firestore, `companies/${companyId}/payrolls`);
        
        payrollDrafts.forEach(draft => {
            const { id, ...payrollData } = draft; 
            const finalPayroll: Omit<Payroll, 'id'> = { ...payrollData, companyId: companyId, period: periodId, createdAt: Timestamp.now() } as Omit<Payroll, 'id'>;
            const newPayrollRef = doc(payrollsCollectionRef);
            batch.set(newPayrollRef, finalPayroll);
        });

        try {
            await batch.commit();
            toast({ title: 'Nómina Procesada', description: 'Las liquidaciones han sido guardadas con éxito.' });
            const q = query(collection(firestore, `companies/${companyId}/payrolls`), where("year", "==", year), where("month", "==", month));
            const snapshot = await getDocs(q);
            setProcessedPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
            setIsPeriodProcessed(true);
            setPayrollDrafts([]);
        } catch (error) {
            console.error("Error processing payroll: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Hubo un problema al procesar la nómina.' });
        } finally {
            setIsProcessing(false);
            setIsCentralizePreviewOpen(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <Card>
                     <CardHeader><CardTitle>Gestión de Liquidaciones</CardTitle><CardDescription>Selecciona un período para gestionar las liquidaciones de sueldo.</CardDescription></CardHeader>
                    <CardContent>
                         <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                           <div className="flex-1 grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="month">Mes</Label><Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}><SelectTrigger id="month"><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(0,i), 'MMMM', {locale: es})}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="year">Año</Label><Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}><SelectTrigger id="year"><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 5}, (_, i) => <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>{currentYear-i}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        {employeesLoading || isLoadingDrafts ? (
                            <div className="text-center h-24 flex items-center justify-center">Cargando y calculando...</div>
                        ) : isPeriodProcessed ? (
                            <PayrollProcessedTable companyId={companyId} payrolls={processedPayrolls} onAnnulSuccess={handleAnnulSuccess} onPreview={handleOpenPreview} onDownload={() => {}} onDownloadAll={() => {}} />
                        ) : (
                            <PayrollDraftsTable drafts={payrollDrafts} onDraftChange={debouncedHandleDraftChange} onPreview={handleOpenPreview} />
                        )}
                    </CardContent>
                    {!isPeriodProcessed && !employeesLoading && !isLoadingDrafts && payrollDrafts.length > 0 && (
                        <CardFooter className="flex justify-end"><Button onClick={handleOpenCentralizePreview}>Revisar y Centralizar</Button></CardFooter>
                    )}
                </Card>
            </div>

            <PayrollProcessPreviewDialog isOpen={isCentralizePreviewOpen} onClose={() => setIsCentralizePreviewOpen(false)} onConfirm={handleConfirmAndProcess} isProcessing={isProcessing} totals={totalsForPreview} period={`${es.localize?.month(month - 1)}, ${year}`} />

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="max-w-3xl h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Vista Previa de Liquidación</DialogTitle></DialogHeader>{selectedPayrollForPreview && employees && (<PayslipPreview employee={employees.find(e => e.id === selectedPayrollForPreview.employeeId)!} payroll={selectedPayrollForPreview as Payroll} />)}<DialogFooter><Button onClick={() => setIsPreviewOpen(false)}>Cerrar</Button></DialogFooter></DialogContent></Dialog>
        </>
    );
}

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    if (!selectedCompany) { 
        return (
            <div className="flex items-center justify-center h-full"><Card className="w-full max-w-md text-center"><CardHeader><CardTitle>Seleccione una Empresa</CardTitle><CardDescription>Por favor, elija una empresa para empezar a gestionar las liquidaciones.</CardDescription></CardHeader></Card></div>
        );
    }
    return <PayrollContent companyId={selectedCompany.id} />;
}
