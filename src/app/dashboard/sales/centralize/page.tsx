
'use client';
import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore } from "@/firebase"
import { collection, addDoc, writeBatch, doc, Timestamp, query, where } from "firebase/firestore"
import type { Sale, VoucherEntry } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../../layout";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, lastDayOfMonth, parseISO, isAfter, isEqual, isBefore } from "date-fns";
import { es } from "date-fns/locale";

export default function CentralizeSalesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const salesQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(collection(firestore, `companies/${companyId}/sales`), where('status', '==', 'Pendiente'));
    }, [firestore, companyId]);

    const { data: allSales, loading: salesLoading } = useCollection<Sale>({
        query: salesQuery,
    });

    const [isProcessing, setIsProcessing] = React.useState(false);

    const loading = salesLoading;
    
    const {
        totalNet,
        totalIvaDebit,
        totalReceivable,
        closedPeriodDocs,
        salesToProcess,
        isValid
    } = React.useMemo(() => {
        if (!allSales || !selectedCompany) {
            return { totalNet: 0, totalIvaDebit: 0, totalReceivable: 0, closedPeriodDocs: [], salesToProcess: [], isValid: false };
        }
        
        const lastClosed = selectedCompany.lastClosedDate ? parseISO(selectedCompany.lastClosedDate) : null;
        
        const processableDocs = allSales.filter(p => {
            if (!lastClosed) return true;
            const docDate = parseISO(p.date);
            return isAfter(docDate, lastClosed);
        });

        const rejectedDocs = allSales.filter(p => {
             if (!lastClosed) return false;
            const docDate = parseISO(p.date);
            return isBefore(docDate, lastClosed) || isEqual(docDate, lastClosed);
        });
        
        const VAT_RATE = 0.19;
        const total = processableDocs.reduce((sum, doc) => sum + doc.total, 0);
        const totalExempt = processableDocs.reduce((sum, doc) => sum + doc.exemptAmount, 0);
        const totalTaxable = total - totalExempt;
        const net = totalTaxable / (1 + VAT_RATE);
        const iva = totalTaxable - net;

        return {
            totalNet: net + totalExempt, // Total income is net + exempt
            totalIvaDebit: iva,
            totalReceivable: total,
            closedPeriodDocs: rejectedDocs,
            salesToProcess: processableDocs,
            isValid: processableDocs.length > 0 && !!selectedCompany.salesInvoicesReceivableAccount && !!selectedCompany.salesVatAccount,
        };
    }, [allSales, selectedCompany]);

    const handleCentralize = async () => {
        if (!firestore || !companyId || !selectedCompany || !salesToProcess || !isValid) {
            toast({ variant: 'destructive', title: 'Error de validación', description: 'No se puede centralizar. Revisa que las cuentas de venta estén configuradas.' });
            return;
        }

        setIsProcessing(true);

        const periodDate = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate) : new Date();
        const lastDay = lastDayOfMonth(periodDate);
        const monthName = format(periodDate, 'MMMM', { locale: es });

        const entries: Omit<VoucherEntry, 'id'>[] = [];

        // Asiento: Clientes (DEBE) a Ventas (HABER) y a IVA DF (HABER)
        entries.push({
            account: selectedCompany.salesInvoicesReceivableAccount!,
            description: `Centralización Ventas Clientes`,
            debit: totalReceivable,
            credit: 0,
        });

        // This assumes a single income account for all sales. A more complex system might need to find one.
        const defaultIncomeAccount = selectedCompany.profitAccount || '4010110';
        entries.push({
            account: defaultIncomeAccount, 
            description: `Ventas del período`,
            debit: 0,
            credit: totalNet,
        });

        entries.push({
            account: selectedCompany.salesVatAccount!,
            description: 'IVA Débito Fiscal del período',
            debit: 0,
            credit: totalIvaDebit,
        });
        
        const finalEntries = entries.filter(e => e.debit !== 0 || e.credit !== 0);

        const voucherData = {
            date: format(lastDay, 'yyyy-MM-dd'),
            type: 'Traspaso' as const,
            description: `Centralización Ventas ${monthName} ${periodDate.getFullYear()}`,
            status: 'Contabilizado' as const,
            total: totalReceivable,
            entries: finalEntries,
            companyId: companyId,
            createdAt: Timestamp.now(),
        };

        const batch = writeBatch(firestore);
        const newVoucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(newVoucherRef, voucherData);

        salesToProcess.forEach(sale => {
            const saleRef = doc(firestore, `companies/${companyId}/sales`, sale.id);
            batch.update(saleRef, { status: 'Contabilizado', voucherId: newVoucherRef.id });
        });
        
        try {
            await batch.commit();
            toast({
                title: 'Centralización Exitosa',
                description: 'El comprobante de ventas ha sido generado y las ventas actualizadas.'
            });
            router.push('/dashboard/vouchers');
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `companies/${companyId}`,
                operation: 'update',
            }));
            setIsProcessing(false);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">2. Vista Previa y Centralización de Ventas</h1>
                <p className="text-muted-foreground">Verifica los totales y confirma la generación del asiento contable.</p>
            </div>
            
            {loading && <p>Cargando vista previa...</p>}

            {!loading && allSales && allSales.length === 0 && (
                <Card>
                    <CardHeader><CardTitle>Sin Documentos Pendientes</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">No hay documentos de venta pendientes por centralizar. Vuelve a la página anterior para importar nuevos documentos.</p></CardContent>
                </Card>
            )}

            {!loading && allSales && allSales.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del Asiento a Generar</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {!selectedCompany?.salesInvoicesReceivableAccount || !selectedCompany?.salesVatAccount ? (
                             <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Falta Configuración de Cuentas</AlertTitle>
                                <AlertDescription>
                                    <p>Debes definir las cuentas contables para "Facturas por Cobrar" y "IVA Débito Fiscal" en la <Link href="/dashboard/companies/settings" className="font-bold underline">configuración de la empresa</Link> antes de poder centralizar.</p>
                                </AlertDescription>
                            </Alert>
                         ): null}
                         {closedPeriodDocs.length > 0 && (
                             <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención Requerida: {closedPeriodDocs.length} Documento(s) en Período Cerrado</AlertTitle>
                                <AlertDescription>
                                    <p>Estos documentos no serán incluidos en esta centralización y permanecerán pendientes:</p>
                                     <ul className="list-disc pl-5 mt-2 text-xs">
                                       {closedPeriodDocs.slice(0, 5).map(doc => (
                                           <li key={doc.id}>Folio {doc.documentNumber} de {doc.customer} (Fecha: {new Date(doc.date).toLocaleDateString('es-CL')})</li>
                                       ))}
                                        {closedPeriodDocs.length > 5 && <li>... y {closedPeriodDocs.length - 5} más.</li>}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                         )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* DEBE */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">DEBE (Cargos)</h3>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Cuenta Contable</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{selectedCompany?.salesInvoicesReceivableAccount} - Clientes</TableCell>
                                            <TableCell className="text-right">${Math.round(totalReceivable).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold text-base">
                                            <TableCell>Total Debe</TableCell>
                                            <TableCell className="text-right">${Math.round(totalReceivable).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                            {/* HABER */}
                             <div className="space-y-2">
                                <h3 className="font-semibold text-lg">HABER (Abonos)</h3>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Cuenta Contable</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{selectedCompany?.profitAccount || '4010110'} - Ingreso por Ventas</TableCell>
                                            <TableCell className="text-right">${Math.round(totalNet).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>{selectedCompany?.salesVatAccount} - IVA Débito Fiscal</TableCell>
                                            <TableCell className="text-right">${Math.round(totalIvaDebit).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                     <TableFooter>
                                        <TableRow className="font-bold text-base">
                                            <TableCell>Total Haber</TableCell>
                                            <TableCell className="text-right">${Math.round(totalNet + totalIvaDebit).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col items-end gap-4 pt-6">
                        <div className="text-right">
                           <p className={`font-bold ${Math.round(totalReceivable) === Math.round(totalNet + totalIvaDebit) ? 'text-green-600' : 'text-destructive'}`}>
                                {Math.round(totalReceivable) === Math.round(totalNet + totalIvaDebit) ? 'El asiento está cuadrado.' : 'El asiento no está cuadrado.'}
                           </p>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" asChild>
                                <Link href="/dashboard/sales">Atrás</Link>
                            </Button>
                            <Button 
                                onClick={handleCentralize} 
                                disabled={!isValid || isProcessing}
                            >
                                {isProcessing ? "Procesando..." : "Centralizar y Contabilizar"}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
