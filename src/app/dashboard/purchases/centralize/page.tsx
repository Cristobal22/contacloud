
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
import type { Purchase, Account, VoucherEntry, Subject, OtherTax } from "@/lib/types";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { AccountSearchInput } from "@/components/account-search-input";

type SummaryRow = {
    accountCode: string;
    accountName: string;
    totalNet: number;
    docCount: number;
}

type OtherTaxesSummary = {
    code: string;
    name: string;
    total: number;
}

export default function CentralizePurchasesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    
    const purchasesQuery = React.useMemo(() => {
        if (!firestore || !companyId) return null;
        return query(collection(firestore, `companies/${companyId}/purchases`), where('status', '==', 'Pendiente'));
    }, [firestore, companyId]);

    const { data: allPurchases, loading: purchasesLoading } = useCollection<Purchase>({
        query: purchasesQuery,
    });
    
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
    });

    const { data: existingSubjects, loading: subjectsLoading } = useCollection<Subject>({
        path: companyId ? `companies/${companyId}/subjects` : undefined,
    });

    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isAssignAllDialogOpen, setIsAssignAllDialogOpen] = React.useState(false);
    const [bulkAssignAccount, setBulkAssignAccount] = React.useState<string | null>(null);

    const loading = purchasesLoading || accountsLoading || subjectsLoading;
    
    const {
        summary,
        totalDebit,
        totalCredit,
        unassignedDocs,
        closedPeriodDocs,
        purchasesToProcess,
        isValid,
        isBalanced,
        totalIvaCredit,
        otherTaxesSummary,
        totalPayable
    } = React.useMemo(() => {
        if (!allPurchases || !accounts || !selectedCompany) {
            return { summary: [], totalDebit: 0, totalCredit: 0, unassignedDocs: [], closedPeriodDocs: [], purchasesToProcess: [], isValid: false, isBalanced: false, totalIvaCredit: 0, otherTaxesSummary: [], totalPayable: 0 };
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
        const otherTaxesGrouped = new Map<string, { name: string, total: number }>();
        let currentTotalIvaCredit = 0;
        let currentTotalPayable = 0;

        processableDocs.forEach(p => {
            const sign = p.documentType.includes('61') ? -1 : 1; // 61=Nota de Crédito, so invert sign
            const totalAmount = p.total * sign;
            currentTotalPayable += totalAmount;

            if (p.assignedAccount) {
                const netAmount = (p.netAmount + (p.exemptAmount || 0)) * sign;
                const current = netSummary.get(p.assignedAccount) || { name: accounts.find(a => a.code === p.assignedAccount)?.name || 'N/A', total: 0, count: 0 };
                current.total += netAmount;
                current.count++;
                netSummary.set(p.assignedAccount, current);
            }
            
            const taxAmount = (p.taxAmount || 0) * sign;
            currentTotalIvaCredit += taxAmount;

            if (p.otherTaxes) {
                p.otherTaxes.forEach(tax => {
                    const taxTotal = (tax.amount || 0) * sign;
                    const currentTax = otherTaxesGrouped.get(tax.code) || { name: tax.name, total: 0 };
                    currentTax.total += taxTotal;
                    otherTaxesGrouped.set(tax.code, currentTax);
                });
            }
        });

        const summaryRows: SummaryRow[] = Array.from(netSummary.entries()).map(([code, data]) => ({
            accountCode: code,
            accountName: data.name,
            totalNet: data.total,
            docCount: data.count,
        }));

        const otSummary: OtherTaxesSummary[] = Array.from(otherTaxesGrouped.entries()).map(([code, data]) => ({
            code: code,
            name: data.name,
            total: data.total,
        }));

        const totalOtherTaxes = otSummary.reduce((sum, tax) => sum + tax.total, 0);
        const totalNet = summaryRows.reduce((sum, row) => sum + row.totalNet, 0);

        const debit = totalNet + currentTotalIvaCredit + totalOtherTaxes;
        
        const balanced = Math.round(debit) === Math.round(currentTotalPayable);
        
        const valid = unassigned.length === 0 && 
                      processableDocs.length > 0 && 
                      balanced && 
                      (totalOtherTaxes === 0 || !!selectedCompany.purchasesOtherTaxesAccount);

        return {
            summary: summaryRows,
            totalIvaCredit: currentTotalIvaCredit,
            otherTaxesSummary: otSummary,
            totalPayable: currentTotalPayable,
            totalDebit: debit,
            totalCredit: currentTotalPayable,
            unassignedDocs: unassigned,
            closedPeriodDocs: rejectedDocs,
            purchasesToProcess: processableDocs,
            isValid: valid,
            isBalanced: balanced,
        };
    }, [allPurchases, accounts, selectedCompany]);

    const handleBulkAssignAccount = async () => {
        if (!firestore || !companyId || !bulkAssignAccount || !unassignedDocs || unassignedDocs.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay cuenta seleccionada o no hay documentos que actualizar.' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const purchasesCollectionRef = collection(firestore, `companies/${companyId}/purchases`);

        unassignedDocs.forEach(docToUpdate => {
            const docRef = doc(purchasesCollectionRef, docToUpdate.id);
            batch.update(docRef, { assignedAccount: bulkAssignAccount });
        });

        try {
            await batch.commit();
            toast({
                title: 'Actualización Exitosa',
                description: `Se asignó la cuenta ${bulkAssignAccount} a ${unassignedDocs.length} documentos.`,
            });
            setIsAssignAllDialogOpen(false);
            setBulkAssignAccount(null);
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `companies/${companyId}/purchases`,
                operation: 'update',
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCentralize = async () => {
        if (!firestore || !companyId || !selectedCompany || !purchasesToProcess || !isValid || !existingSubjects) {
            toast({ variant: 'destructive', title: 'Error de validación', description: 'No se puede centralizar. Revisa que todo esté correcto.' });
            return;
        }

        setIsProcessing(true);

        const batch = writeBatch(firestore);

        const existingSubjectRuts = new Set(existingSubjects.map(s => s.rut));
        const newSuppliers = new Map<string, { rut: string; name: string }>();
        purchasesToProcess.forEach(p => {
            if (p.supplierRut && !existingSubjectRuts.has(p.supplierRut) && !newSuppliers.has(p.supplierRut)) {
                newSuppliers.set(p.supplierRut, { rut: p.supplierRut, name: p.supplier });
            }
        });

        if (newSuppliers.size > 0) {
            const subjectsCollectionRef = collection(firestore, `companies/${companyId}/subjects`);
            newSuppliers.forEach(supplier => {
                const newSubjectRef = doc(subjectsCollectionRef);
                batch.set(newSubjectRef, {
                    name: supplier.name,
                    rut: supplier.rut,
                    type: 'Proveedor',
                    status: 'Active',
                    companyId: companyId,
                });
            });
        }
        
        const periodDate = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate) : new Date();
        const lastDay = lastDayOfMonth(periodDate);
        const monthName = format(periodDate, 'MMMM', { locale: es });

        const entries: Omit<VoucherEntry, 'id'>[] = [];
        summary.forEach(row => {
            entries.push({
                account: row.accountCode,
                description: `Neto compras ${row.accountName}`,
                debit: row.totalNet > 0 ? row.totalNet : 0,
                credit: row.totalNet < 0 ? -row.totalNet : 0,
            });
        });

        if (totalIvaCredit !== 0 && selectedCompany.purchasesVatAccount) {
            entries.push({
                account: selectedCompany.purchasesVatAccount,
                description: 'IVA Crédito Fiscal del período',
                debit: totalIvaCredit > 0 ? totalIvaCredit : 0,
                credit: totalIvaCredit < 0 ? -totalIvaCredit : 0,
            });
        }

        if (otherTaxesSummary.length > 0 && selectedCompany.purchasesOtherTaxesAccount) {
            otherTaxesSummary.forEach(tax => {
                if (tax.total !== 0) {
                    entries.push({
                        account: selectedCompany.purchasesOtherTaxesAccount!,
                        description: tax.name,
                        debit: tax.total > 0 ? tax.total : 0,
                        credit: tax.total < 0 ? -tax.total : 0,
                    });
                }
            });
        }

        if (totalPayable !== 0 && selectedCompany.purchasesInvoicesPayableAccount) {
            entries.push({
                account: selectedCompany.purchasesInvoicesPayableAccount,
                description: 'Cuentas por Pagar Proveedores',
                debit: totalPayable < 0 ? -totalPayable : 0,
                credit: totalPayable > 0 ? totalPayable : 0,
            });
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

        const newVoucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(newVoucherRef, voucherData);

        purchasesToProcess.forEach(purchase => {
            const purchaseRef = doc(firestore, `companies/${companyId}/purchases`, purchase.id);
            batch.update(purchaseRef, { status: 'Contabilizado', voucherId: newVoucherRef.id });
        });
        
        try {
            await batch.commit();
            let toastDescription = 'El comprobante ha sido generado y las compras actualizadas.';
            if (newSuppliers.size > 0) {
                toastDescription += ` Se crearon ${newSuppliers.size} nuevos proveedores.`;
            }

            toast({
                title: 'Centralización Exitosa',
                description: toastDescription,
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
                                <AlertDescription className="flex flex-col gap-2">
                                    <div>
                                      <p>Debes asignar una cuenta de gasto a todos los documentos. Puedes volver a la página anterior o asignar una cuenta a todos los documentos pendientes desde aquí.</p>
                                      <ul className="list-disc pl-5 mt-2 text-xs">
                                         {unassignedDocs.slice(0, 5).map(doc => (
                                             <li key={doc.id}>Folio {doc.documentNumber} de {doc.supplier}</li>
                                         ))}
                                          {unassignedDocs.length > 5 && <li>... y {unassignedDocs.length - 5} más.</li>}
                                      </ul>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => setIsAssignAllDialogOpen(true)}>
                                        Asignar Cuenta a Todos
                                    </Button>
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
                                                <TableCell className="text-right">${Math.round(row.totalNet).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalIvaCredit > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesVatAccount} - IVA Crédito Fiscal</TableCell>
                                                <TableCell className="text-right">${Math.round(totalIvaCredit).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {otherTaxesSummary.filter(t => t.total > 0).map(tax => (
                                            <TableRow key={tax.code}>
                                                <TableCell>{selectedCompany?.purchasesOtherTaxesAccount} - {tax.name}</TableCell>
                                                <TableCell className="text-right">${Math.round(tax.total).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalPayable < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesInvoicesPayableAccount} - Disminución Proveedores</TableCell>
                                                <TableCell className="text-right">${Math.round(-totalPayable).toLocaleString('es-CL')}</TableCell>
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
                                                <TableCell className="text-right">${Math.round(-row.totalNet).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalIvaCredit < 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesVatAccount} - Ajuste IVA Crédito</TableCell>
                                                <TableCell className="text-right">${Math.round(-totalIvaCredit).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        )}
                                        {otherTaxesSummary.filter(t => t.total < 0).map(tax => (
                                            <TableRow key={tax.code}>
                                                <TableCell>{selectedCompany?.purchasesOtherTaxesAccount} - Ajuste {tax.name}</TableCell>
                                                <TableCell className="text-right">${Math.round(-tax.total).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {totalPayable > 0 && (
                                            <TableRow>
                                                <TableCell>{selectedCompany?.purchasesInvoicesPayableAccount} - Proveedores</TableCell>
                                                <TableCell className="text-right">${Math.round(totalPayable).toLocaleString('es-CL')}</TableCell>
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

            <Dialog open={isAssignAllDialogOpen} onOpenChange={setIsAssignAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Cuenta a Documentos Pendientes</DialogTitle>
                        <DialogDescription>
                            Selecciona la cuenta de gasto que deseas asignar a los {unassignedDocs.length} documentos sin clasificar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       <AccountSearchInput
                            label="Cuenta de Gasto"
                            value={bulkAssignAccount || ''}
                            onValueChange={setBulkAssignAccount}
                            accounts={accounts || []}
                            loading={accountsLoading}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleBulkAssignAccount} disabled={!bulkAssignAccount || isProcessing}>
                            {isProcessing ? 'Guardando...' : 'Guardar y Asignar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
