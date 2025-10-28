
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
import type { Sale, VoucherEntry, OtherTax } from "@/lib/types";
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

type OtherTaxesSummary = {
    code: string;
    name: string;
    total: number;
}

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
        otherTaxesSummary,
        totalReceivable,
        totalDebit,
        totalCredit,
        closedPeriodDocs,
        salesToProcess,
        isValid,
        isBalanced
    } = React.useMemo(() => {
        if (!allSales || !selectedCompany) {
            return { totalNet: 0, totalIvaDebit: 0, otherTaxesSummary: [], totalReceivable: 0, totalDebit: 0, totalCredit: 0, closedPeriodDocs: [], salesToProcess: [], isValid: false, isBalanced: false };
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
        
        const otherTaxesGrouped = new Map<string, { name: string, total: number }>();
        let currentTotalNet = 0;
        let currentTotalExempt = 0;
        let currentTotalIva = 0;
        let currentTotalReceivable = 0;

        processableDocs.forEach(doc => {
            const sign = doc.documentType.includes('61') ? -1 : 1; // 61 = Nota de Crédito
            currentTotalNet += (doc.netAmount || 0) * sign;
            currentTotalExempt += (doc.exemptAmount || 0) * sign;
            currentTotalIva += (doc.taxAmount || 0) * sign;
            currentTotalReceivable += doc.total * sign;

            if (doc.otherTaxes) {
                doc.otherTaxes.forEach(tax => {
                    const taxTotal = (tax.amount || 0) * sign;
                    const currentTax = otherTaxesGrouped.get(tax.code) || { name: tax.name, total: 0 };
                    currentTax.total += taxTotal;
                    otherTaxesGrouped.set(tax.code, currentTax);
                });
            }
        });

        const otSummary: OtherTaxesSummary[] = Array.from(otherTaxesGrouped.entries()).map(([code, data]) => ({
            code: code,
            name: data.name,
            total: data.total,
        }));

        const totalNetIncome = currentTotalNet + currentTotalExempt;
        const totalOtherTaxes = otSummary.reduce((sum, tax) => sum + tax.total, 0);

        const debit = currentTotalReceivable;
        const credit = totalNetIncome + currentTotalIva + totalOtherTaxes;

        const balanced = Math.round(debit) === Math.round(credit);
        const hasOtherTaxes = otSummary.some(t => t.total !== 0);

        const valid = processableDocs.length > 0 &&
                      !!selectedCompany.salesInvoicesReceivableAccount &&
                      !!selectedCompany.salesVatAccount &&
                      (!hasOtherTaxes || !!selectedCompany.salesOtherTaxesAccount) &&
                      balanced;

        return {
            totalNet: totalNetIncome,
            totalIvaDebit: currentTotalIva,
            otherTaxesSummary: otSummary,
            totalReceivable: currentTotalReceivable,
            totalDebit: debit,
            totalCredit: credit,
            closedPeriodDocs: rejectedDocs,
            salesToProcess: processableDocs,
            isValid: valid,
            isBalanced: balanced
        };
    }, [allSales, selectedCompany]);

    const handleCentralize = async () => {
        if (!firestore || !companyId || !selectedCompany || !salesToProcess || !isValid) {
            toast({ variant: 'destructive', title: 'Error de validación', description: 'No se puede centralizar. Revisa que las cuentas de venta estén configuradas y el asiento cuadrado.' });
            return;
        }

        setIsProcessing(true);

        const periodDate = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate) : new Date();
        const lastDay = lastDayOfMonth(periodDate);
        const monthName = format(periodDate, 'MMMM', { locale: es });

        const entries: Omit<VoucherEntry, 'id'>[] = [];

        // Asiento: Clientes (DEBE) a Ventas, IVA DF y Otros Impuestos (HABER)
        if (totalReceivable !== 0) {
            entries.push({
                account: selectedCompany.salesInvoicesReceivableAccount!,
                description: `Centralización Ventas Clientes`,
                debit: totalReceivable > 0 ? totalReceivable : 0,
                credit: totalReceivable < 0 ? -totalReceivable : 0,
            });
        }

        const defaultIncomeAccount = selectedCompany.profitAccount || '4010110';
        if (totalNet !== 0) {
            entries.push({
                account: defaultIncomeAccount, 
                description: `Ventas del período`,
                debit: totalNet < 0 ? -totalNet : 0,
                credit: totalNet > 0 ? totalNet : 0,
            });
        }

        if (totalIvaDebit !== 0 && selectedCompany.salesVatAccount) {
            entries.push({
                account: selectedCompany.salesVatAccount,
                description: 'IVA Débito Fiscal del período',
                debit: totalIvaDebit < 0 ? -totalIvaDebit : 0,
                credit: totalIvaDebit > 0 ? totalIvaDebit : 0,
            });
        }

        if (otherTaxesSummary.length > 0 && selectedCompany.salesOtherTaxesAccount) {
            otherTaxesSummary.forEach(tax => {
                 if (tax.total !== 0) {
                    entries.push({
                        account: selectedCompany.salesOtherTaxesAccount!,
                        description: tax.name,
                        debit: tax.total < 0 ? -tax.total : 0,
                        credit: tax.total > 0 ? tax.total : 0,
                    });
                }
            });
        }
        
        const finalEntries = entries.filter(e => e.debit !== 0 || e.credit !== 0);

        const voucherData = {
            date: format(lastDay, 'yyyy-MM-dd'),
            type: 'Traspaso' as const,
            description: `Centralización Ventas ${monthName} ${periodDate.getFullYear()}`,
            status: 'Contabilizado' as const,
            total: Math.abs(finalEntries.reduce((sum, e) => sum + e.debit, 0)),
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
                         {(!isValid && isBalanced) && (
                             <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Falta Configuración de Cuentas</AlertTitle>
                                <AlertDescription>
                                    <p>Debes definir las cuentas contables para "Facturas por Cobrar", "IVA Débito Fiscal" y/o "Otros Impuestos de Ventas" en la <Link href="/dashboard/companies/settings" className="font-bold underline">configuración de la empresa</Link> antes de poder centralizar.</p>
                                </AlertDescription>
                            </Alert>
                         )}
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
                                        {totalReceivable > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.salesInvoicesReceivableAccount} - Clientes</TableCell>
                                                <TableCell className="text-right">${Math.round(totalReceivable).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalNet < 0 && (
                                             <TableRow>
                                                <TableCell>{selectedCompany?.profitAccount || '4010110'} - Ajuste Ingreso por Ventas</TableCell>
                                                <TableCell className="text-right">${Math.round(-totalNet).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalIvaDebit < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.salesVatAccount} - Ajuste IVA Débito Fiscal</TableCell>
                                                <TableCell className="text-right">${Math.round(-totalIvaDebit).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {otherTaxesSummary.filter(t => t.total < 0).map(tax => (
                                            <TableRow key={tax.code}>
                                                <TableCell>{selectedCompany?.salesOtherTaxesAccount} - Ajuste {tax.name}</TableCell>
                                                <TableCell className="text-right">${Math.round(-tax.total).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold text-base">
                                            <TableCell>Total Debe</TableCell>
                                            <TableCell className="text-right">${Math.round(totalDebit).toLocaleString('es-CL')}</TableCell>
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
                                        {totalNet > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.profitAccount || '4010110'} - Ingreso por Ventas</TableCell>
                                                <TableCell className="text-right">${Math.round(totalNet).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalIvaDebit > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.salesVatAccount} - IVA Débito Fiscal</TableCell>
                                                <TableCell className="text-right">${Math.round(totalIvaDebit).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {otherTaxesSummary.filter(t => t.total > 0).map(tax => (
                                            <TableRow key={tax.code}>
                                                <TableCell>{selectedCompany?.salesOtherTaxesAccount} - {tax.name}</TableCell>
                                                <TableCell className="text-right">${Math.round(tax.total).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalReceivable < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.salesInvoicesReceivableAccount} - Disminución Clientes</TableCell>
                                                <TableCell className="text-right">${Math.round(-totalReceivable).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                     <TableFooter>
                                        <TableRow className="font-bold text-base">
                                            <TableCell>Total Haber</TableCell>
                                            <TableCell className="text-right">${Math.round(totalCredit).toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col items-end gap-4 pt-6">
                        <div className="text-right">
                           <p className={`font-bold ${isBalanced ? 'text-green-600' : 'text-destructive'}`}>
                                {isBalanced ? 'El asiento está cuadrado.' : 'El asiento no está cuadrado.'}
                           </p>
                           <p className="text-sm text-muted-foreground">
                               Diferencia: ${(Math.round(totalDebit) - Math.round(totalCredit)).toLocaleString('es-CL')}
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
