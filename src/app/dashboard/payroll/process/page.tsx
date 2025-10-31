'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from '@/firebase';
import type { Payroll } from '@/lib/types';
import { SelectedCompanyContext } from '../../layout';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch, getDocs, query } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

type PayrollDraft = Partial<Payroll> & { employeeId: string; employeeName: string; };

function PayrollProcessingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();

    const [drafts, setDrafts] = React.useState<PayrollDraft[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const year = searchParams.get('year');
    const month = searchParams.get('month');

    React.useEffect(() => {
        if (!companyId || !firestore || !year || !month) return;

        const fetchDrafts = async () => {
            setIsLoading(true);
            const periodId = `${year}-${String(month).padStart(2, '0')}`;
            const draftsRef = collection(firestore, `companies/${companyId}/payrollPeriods/${periodId}/drafts`);
            const draftsSnap = await getDocs(draftsRef);

            if (draftsSnap.empty) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se encontraron borradores para este período.' });
                router.back();
                return;
            }
            
            const loadedDrafts: PayrollDraft[] = [];
            draftsSnap.forEach(doc => {
                loadedDrafts.push({ id: doc.id, ...doc.data() } as PayrollDraft);
            });
            setDrafts(loadedDrafts);
            setIsLoading(false);
        };

        fetchDrafts();
    }, [companyId, firestore, year, month, toast, router]);

    const handleFinalProcess = async () => {
        if (!companyId || !firestore || !year || !month || drafts.length === 0) return;
        
        setIsProcessing(true);
        const periodId = `${year}-${String(month).padStart(2, '0')}`;
        const payrollsCollectionRef = collection(firestore, `companies/${companyId}/payrolls`);
        const draftsCollectionRef = collection(firestore, `companies/${companyId}/payrollPeriods/${periodId}/drafts`);
        const batch = writeBatch(firestore);

        drafts.forEach(draft => {
            const { id, ...payrollData } = draft;
            const finalPayroll: Omit<Payroll, 'id'> = {
                ...payrollData,
                companyId: companyId,
                period: `${year}-${String(month).padStart(2, '0')}`,
                year: parseInt(year),
                month: parseInt(month),
            } as Omit<Payroll, 'id'>;
            const newPayrollRef = doc(payrollsCollectionRef);
            batch.set(newPayrollRef, finalPayroll);
        });

        // Delete all drafts for the period
        drafts.forEach(draft => {
            const draftRef = doc(draftsCollectionRef, draft.employeeId);
            batch.delete(draftRef);
        });

        try {
            await batch.commit();
            toast({ title: 'Nómina Procesada Exitosamente', description: `Se han generado ${drafts.length} liquidaciones para el período.` });
            router.push('/dashboard/payroll');
        } catch (error) {
            console.error("Error finalizing payroll:", error);
            toast({ variant: 'destructive', title: 'Error en el Procesamiento', description: 'Ocurrió un error al guardar las liquidaciones finales.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const totals = React.useMemo(() => {
        return drafts.reduce((acc, curr) => {
            acc.totalHaberes += curr.totalEarnings || 0;
            acc.totalDescuentos += curr.totalDiscounts || 0;
            acc.totalLiquido += curr.netSalary || 0;
            return acc;
        }, { totalHaberes: 0, totalDescuentos: 0, totalLiquido: 0 });
    }, [drafts]);

    return (
        <div className="space-y-6">
             <Button variant="outline" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Novedades</Button>
            <Card>
                <CardHeader>
                    <CardTitle>Revisión y Confirmación de Nómina</CardTitle>
                    <CardDescription>Período: {month && year ? `${String(month).padStart(2, '0')}/${year}` : ''}. Revisa los totales antes de procesar la nómina de forma definitiva.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Cargando resumen...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead className="text-right">Total Haberes</TableHead>
                                    <TableHead className="text-right">Total Descuentos</TableHead>
                                    <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drafts.map(d => (
                                    <TableRow key={d.employeeId}>
                                        <TableCell>{d.employeeName}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(d.totalEarnings || 0)}</TableCell>
                                        <TableCell className="text-right text-destructive">-{formatCurrency(d.totalDiscounts || 0)}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(d.netSalary || 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-end space-y-4 pt-6">
                    <div className="w-full max-w-sm space-y-2 text-right">
                        <div className="flex justify-between"><span>Total Haberes:</span><span>{formatCurrency(totals.totalHaberes)}</span></div>
                        <div className="flex justify-between"><span>Total Descuentos:</span><span>-{formatCurrency(totals.totalDescuentos)}</span></div>
                        <div className="flex justify-between font-bold text-lg"><span>Total Líquido a Pagar:</span><span>{formatCurrency(totals.totalLiquido)}</span></div>
                    </div>
                    <Button onClick={handleFinalProcess} disabled={isLoading || isProcessing || drafts.length === 0} size="lg">
                        {isProcessing ? 'Procesando...' : 'Confirmar y Procesar Nómina'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// Suspense is needed for useSearchParams
export default function PayrollProcessingPageWrapper() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <PayrollProcessingPage />
        </React.Suspense>
    );
}
