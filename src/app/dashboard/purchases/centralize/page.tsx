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
import { collection, addDoc, writeBatch, doc, Timestamp, getDocs, query, where } from "firebase/firestore"
import type { Purchase, Account, VoucherEntry } from "@/lib/types";
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

type SummaryRow = {
    accountCode: string;
    accountName: string;
    totalNet: number;
    docCount: number;
}

export default function CentralizePurchasesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const { data: allPurchases, loading: purchasesLoading } = useCollection<Purchase>({
        path: companyId ? `companies/${companyId}/purchases` : undefined,
        companyId: companyId,
        query: companyId ? (c, q, w) => q(c, w('status', '==', 'Pendiente')) : undefined,
    });
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
    });

    const [isProcessing, setIsProcessing] = React.useState(false);

    const loading = purchasesLoading || accountsLoading;
    
    const {
        summary,
        totalDebit,
        totalCredit,
        unassignedDocs,
        closedPeriodDocs,
        purchasesToProcess,
        isValid
    } = React.useMemo(() => {
        if (!allPurchases || !accounts || !selectedCompany) {
            return { summary: [], totalDebit: 0, totalCredit: 0, unassignedDocs: [], closedPeriodDocs: [], purchasesToProcess: [], isValid: false };
        }
        
        const lastClosed = selectedCompany.lastClosedDate ? parseISO(selectedCompany.lastClosedDate) : null;

        const processableDocs = allPurchases.filter(p => {
            if (!lastClosed) return true;
            const docDate = parseISO(p.date);
            return isAfter(docDate, lastClosed);
        });

        const rejectedDocs = allPurchases.filter(p => {
             if (!lastClosed) return false;
            const docDate = parseISO(p.date);
            return isBefore(docDate, lastClosed) || isEqual(docDate, lastClosed);
        });

        const unassigned = processableDocs.filter(p => !p.assignedAccount);

        const netSummary = new Map<string, { name: string, total: number, count: number }>();
        let totalIvaCredit = 0;
        let totalPayable = 0;

        processableDocs.forEach(p => {
            if (!p.assignedAccount) return;

            // Handle credit notes (type 61) by inverting amounts
            const sign = p.documentType.includes('61') ? -1 : 1;
            const netAmount = p.netAmount * sign;
            const taxAmount = p.taxAmount * sign;
            const totalAmount = p.total * sign;

            const current = netSummary.get(p.assignedAccount) || { name: accounts.find(a => a.code === p.assignedAccount)?.name || 'N/A', total: 0, count: 0 };
            current.total += netAmount;
            current.count++;
            netSummary.set(p.assignedAccount, current);
            
            totalIvaCredit += taxAmount;
            totalPayable += totalAmount;
        });

        const summaryRows: SummaryRow[] = Array.from(netSummary.entries()).map(([code, data]) => ({
            accountCode: code,
            accountName: data.name,
            totalNet: data.total,
            docCount: data.count,
        }));
        
        const debit = summaryRows.reduce((sum, row) => sum + row.totalNet, 0) + totalIvaCredit;
        
        const isBalanced = Math.round(debit) === Math.round(totalPayable);
        
        return {
            summary: summaryRows,
            totalIvaCredit,
            totalPayable,
            totalDebit: debit,
            totalCredit: totalPayable,
            unassignedDocs: unassigned,
            closedPeriodDocs: rejectedDocs,
            purchasesToProcess: processableDocs,
            isValid: unassigned.length === 0 && processableDocs.length > 0 && isBalanced,
        };
    }, [allPurchases, accounts, selectedCompany]);

    const handleCentralize = async () => {
        if (!firestore || !companyId || !selectedCompany || !purchasesToProcess || !isValid) {
            toast({ variant: 'destructive', title: 'Error de validación', description: 'No se puede centralizar. Revisa que todo esté correcto.' });
            return;
        }

        setIsProcessing(true);

        const periodDate = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate) : new Date();
        const lastDay = lastDayOfMonth(periodDate);
        const monthName = format(periodDate, 'MMMM', { locale: es });

        const entries: Omit<VoucherEntry, 'id'>[] = [];
        summary.forEach(row => {
            if (row.totalNet > 0) {
                entries.push({
                    account: row.accountCode,
                    description: `Neto compras ${row.accountName}`,
                    debit: row.totalNet,
                    credit: 0,
                });
            } else if (row.totalNet < 0) {
                 entries.push({
                    account: row.accountCode,
                    description: `Ajuste compras ${row.accountName}`,
                    debit: 0,
                    credit: -row.totalNet,
                });
            }
        });
        if (selectedCompany.purchasesVatAccount) {
            if (totalIvaCredit > 0) {
                 entries.push({
                    account: selectedCompany.purchasesVatAccount,
                    description: 'IVA Crédito Fiscal del período',
                    debit: totalIvaCredit,
                    credit: 0,
                });
            } else if (totalIvaCredit < 0){
                 entries.push({
                    account: selectedCompany.purchasesVatAccount,
                    description: 'Ajuste IVA Crédito Fiscal',
                    debit: 0,
                    credit: -totalIvaCredit,
                });
            }
        }
        if (selectedCompany.purchasesInvoicesPayableAccount) {
             if (totalPayable > 0) {
                entries.push({
                    account: selectedCompany.purchasesInvoicesPayableAccount,
                    description: 'Cuentas por Pagar Proveedores',
                    debit: 0,
                    credit: totalPayable,
                });
            } else if (totalPayable < 0) {
                 entries.push({
                    account: selectedCompany.purchasesInvoicesPayableAccount,
                    description: 'Disminución Cuentas por Pagar',
                    debit: -totalPayable,
                    credit: 0,
                });
            }
        }
        
        const finalEntries = entries.filter(e => e.debit !== 0 || e.credit !== 0);

        const voucherData = {
            date: format(lastDay, 'yyyy-MM-dd'),
            type: 'Traspaso' as const,
            description: `Centralización Compras ${monthName} ${periodDate.getFullYear()}`,
            status: 'Contabilizado' as const,
            total: Math.abs(finalEntries.reduce((sum, e) => sum + e.debit, 0)),
            entries: finalEntries,
            companyId: companyId,
            createdAt: Timestamp.now(),
        };

        const batch = writeBatch(firestore);
        const newVoucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(newVoucherRef, voucherData);

        purchasesToProcess.forEach(purchase => {
            const purchaseRef = doc(firestore, `companies/${companyId}/purchases`, purchase.id);
            batch.update(purchaseRef, { status: 'Contabilizado', voucherId: newVoucherRef.id });
        });
        
        try {
            await batch.commit();
            toast({
                title: 'Centralización Exitosa',
                description: 'El comprobante ha sido generado y las compras actualizadas.'
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
                <h1 className="text-2xl font-bold tracking-tight">2. Vista Previa y Centralización de Compras</h1>
                <p className="text-muted-foreground">Verifica los totales y confirma la generación del asiento contable.</p>
            </div>
            
            {loading && <p>Cargando vista previa...</p>}

            {!loading && allPurchases && allPurchases.length === 0 && (
                <Card>
                    <CardHeader><CardTitle>Sin Documentos Pendientes</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">No hay documentos de compra pendientes por centralizar. Vuelve a la página anterior para importar nuevos documentos.</p></CardContent>
                </Card>
            )}

            {!loading && allPurchases && allPurchases.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del Asiento a Generar</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {unassignedDocs.length > 0 && (
                             <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Atención Requerida: {unassignedDocs.length} Documento(s) Sin Cuenta Asignada</AlertTitle>
                                <AlertDescription>
                                    <p>Debes asignar una cuenta de gasto a todos los documentos. Vuelve a la página anterior para corregir:</p>
                                    <ul className="list-disc pl-5 mt-2 text-xs">
                                       {unassignedDocs.slice(0, 5).map(doc => (
                                           <li key={doc.id}>Folio {doc.documentNumber} de {doc.supplier}</li>
                                       ))}
                                        {unassignedDocs.length > 5 && <li>... y {unassignedDocs.length - 5} más.</li>}
                                    </ul>
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
                                           <li key={doc.id}>Folio {doc.documentNumber} de {doc.supplier} (Fecha: {new Date(doc.date).toLocaleDateString('es-CL')})</li>
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
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cuenta Contable</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.filter(r => r.totalNet > 0).map(row => (
                                            <TableRow key={row.accountCode}>
                                                <TableCell>{row.accountCode} - {row.accountName}</TableCell>
                                                <TableCell className="text-right">${row.totalNet.toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalIvaCredit > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesVatAccount} - IVA Crédito Fiscal</TableCell>
                                                <TableCell className="text-right">${totalIvaCredit.toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalPayable < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesInvoicesPayableAccount} - Disminución Proveedores</TableCell>
                                                <TableCell className="text-right">${(-totalPayable).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
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
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cuenta Contable</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.filter(r => r.totalNet < 0).map(row => (
                                            <TableRow key={row.accountCode}>
                                                <TableCell>{row.accountCode} - {row.accountName}</TableCell>
                                                <TableCell className="text-right">${(-row.totalNet).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalIvaCredit < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesVatAccount} - Ajuste IVA Crédito</TableCell>
                                                <TableCell className="text-right">${(-totalIvaCredit).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalPayable > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesInvoicesPayableAccount} - Proveedores</TableCell>
                                                <TableCell className="text-right">${totalPayable.toLocaleString('es-CL')}</TableCell>
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
                           <p className={`font-bold ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                                {isValid ? 'El asiento está cuadrado.' : 'El asiento no está cuadrado o faltan datos.'}
                           </p>
                           <p className="text-sm text-muted-foreground">
                               Diferencia: ${(Math.round(totalDebit) - Math.round(totalCredit)).toLocaleString('es-CL')}
                           </p>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" asChild>
                                <Link href="/dashboard/purchases">Atrás y Corregir</Link>
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
