
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
import { collection, writeBatch, doc, Timestamp, query, where } from "firebase/firestore"
import type { Purchase, Account, VoucherEntry, Subject, TaxAccountMapping } from "@/lib/types";
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
    accountCode?: string;
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

    const [editablePurchases, setEditablePurchases] = React.useState<Purchase[]>([]);
    const [isAssignAllDialogOpen, setIsAssignAllDialogOpen] = React.useState(false);
    const [bulkAssignAccount, setBulkAssignAccount] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (allPurchases && existingSubjects && allPurchases.length > 0) {
            const subjectAccountMap = new Map(existingSubjects.map(s => [s.rut, s.lastAssignedAccount]));
            let autoAssignedCount = 0;

            const updatedPurchases = allPurchases.map(p => {
                if (!p.assignedAccount && p.supplierRut) {
                    const lastAccount = subjectAccountMap.get(p.supplierRut);
                    if (lastAccount) {
                        autoAssignedCount++;
                        return { ...p, id: p.id || doc(collection(firestore!, 'purchases')).id, assignedAccount: lastAccount };
                    }
                }
                return { ...p, id: p.id || doc(collection(firestore!, 'purchases')).id };
            });

            setEditablePurchases(updatedPurchases);

            if (autoAssignedCount > 0) {
                toast({ title: 'Asignación Automática', description: `Se asignó una cuenta a ${autoAssignedCount} documento(s) basado en el historial del proveedor.` });
            }
        } else if (allPurchases) {
             setEditablePurchases(allPurchases.map(p => ({ ...p, id: p.id || doc(collection(firestore!, 'purchases')).id })));
        }
    }, [allPurchases, existingSubjects, firestore, toast]);

    const handleAccountChange = (purchaseId: string, newAccountCode: string) => {
        setEditablePurchases(prevPurchases => 
            prevPurchases.map(p => 
                p.id === purchaseId ? { ...p, assignedAccount: newAccountCode } : p
            )
        );
    };
    
    const handleBulkAssignAccount = () => {
        if (!bulkAssignAccount) return;
        setEditablePurchases(prevPurchases => 
            prevPurchases.map(p => 
                !p.assignedAccount ? { ...p, assignedAccount: bulkAssignAccount } : p
            )
        );
        toast({ title: 'Cuentas Asignadas', description: `Se asignó la cuenta ${bulkAssignAccount} a todos los documentos sin cuenta.` });
        setIsAssignAllDialogOpen(false);
        setBulkAssignAccount(null);
    };

    const [isProcessing, setIsProcessing] = React.useState(false);
    const loading = purchasesLoading || accountsLoading || subjectsLoading;
    
    const {
        summary,
        totalDebit,
        totalCredit,
        unassignedDocsCount,
        closedPeriodDocs,
        purchasesToProcess,
        isValid,
        isBalanced,
        totalIvaCredit,
        otherTaxesSummary,
        totalPayable,
        missingTaxAccounts
    } = React.useMemo(() => {
        const initialReturn = { summary: [], totalDebit: 0, totalCredit: 0, unassignedDocsCount: 0, closedPeriodDocs: [], purchasesToProcess: [], isValid: false, isBalanced: false, totalIvaCredit: 0, otherTaxesSummary: [], totalPayable: 0, missingTaxAccounts: [] };
        if (!editablePurchases || !accounts || !selectedCompany) {
            return initialReturn;
        }
        
        const lastClosed = selectedCompany.lastClosedDate ? parseISO(selectedCompany.lastClosedDate) : null;

        const processableDocs = editablePurchases.filter(p => {
            if (!lastClosed) return true;
            try {
                const docDate = parseISO(p.date);
                return isAfter(docDate, lastClosed);
            } catch (e) { return true; }
        });

        const rejectedDocs = editablePurchases.filter(p => {
            if (!lastClosed) return false;
             try {
                const docDate = parseISO(p.date);
                return isBefore(docDate, lastClosed) || isEqual(docDate, lastClosed);
            } catch (e) { return false; }
        });

        const unassignedCount = processableDocs.filter(p => !p.assignedAccount).length;

        const netSummary = new Map<string, { name: string, total: number, count: number }>();
        const otherTaxesGrouped = new Map<string, { name: string, total: number }>();
        let currentTotalIvaCredit = 0;
        let currentTotalPayable = 0;

        processableDocs.forEach(p => {
            const sign = p.documentType.includes('61') ? -1 : 1; 
            currentTotalPayable += p.total * sign;

            if (p.assignedAccount) {
                const netAmount = (p.netAmount + (p.exemptAmount || 0)) * sign;
                const current = netSummary.get(p.assignedAccount) || { name: accounts.find(a => a.code === p.assignedAccount)?.name || 'N/A', total: 0, count: 0 };
                current.total += netAmount;
                current.count++;
                netSummary.set(p.assignedAccount, current);
            }
            
            currentTotalIvaCredit += (p.taxAmount || 0) * sign;

            p.otherTaxes?.forEach(tax => {
                const taxTotal = (tax.amount || 0) * sign;
                const currentTax = otherTaxesGrouped.get(tax.code) || { name: tax.name, total: 0 };
                currentTax.total += taxTotal;
                otherTaxesGrouped.set(tax.code, currentTax);
            });
        });

        const summaryRows: SummaryRow[] = Array.from(netSummary.entries()).map(([code, data]) => ({ accountCode: code, accountName: data.name, totalNet: data.total, docCount: data.count }));
        
        const taxAccountMap = new Map(selectedCompany.purchasesOtherTaxesAccounts?.map(m => [m.taxCode, m.accountCode]));

        const otSummary: OtherTaxesSummary[] = Array.from(otherTaxesGrouped.entries()).map(([code, data]) => ({
            code: code,
            name: data.name,
            total: data.total,
            accountCode: taxAccountMap.get(code)
        }));
        
        const missingTaxes = otSummary.filter(tax => tax.total !== 0 && !tax.accountCode);

        const debit = summaryRows.reduce((sum, row) => sum + Math.max(0, row.totalNet), 0) + 
                    Math.max(0, currentTotalIvaCredit) + 
                    otSummary.reduce((sum, tax) => sum + Math.max(0, tax.total), 0) + 
                    Math.max(0, -currentTotalPayable);

        const credit = summaryRows.reduce((sum, row) => sum + Math.max(0, -row.totalNet), 0) + 
                     Math.max(0, -currentTotalIvaCredit) + 
                     otSummary.reduce((sum, tax) => sum + Math.max(0, -tax.total), 0) + 
                     Math.max(0, currentTotalPayable);

        const balanced = Math.round(debit) === Math.round(credit);
        
        const valid = unassignedCount === 0 && processableDocs.length > 0 && balanced && missingTaxes.length === 0;

        return {
            summary: summaryRows,
            totalIvaCredit: currentTotalIvaCredit,
            otherTaxesSummary: otSummary,
            totalPayable: currentTotalPayable,
            totalDebit: debit,
            totalCredit: credit,
            unassignedDocsCount: unassignedCount,
            closedPeriodDocs: rejectedDocs,
            purchasesToProcess: processableDocs,
            isValid: valid,
            isBalanced: balanced,
            missingTaxAccounts: missingTaxes,
        };
    }, [editablePurchases, accounts, selectedCompany]);

    const handleCentralize = async () => {
        if (!firestore || !companyId || !selectedCompany || !purchasesToProcess || !isValid || !existingSubjects) {
            toast({ variant: 'destructive', title: 'Error de validación', description: 'No se puede centralizar. Revisa que todo esté correcto y que todas las cuentas estén asignadas.' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);

        // --- Supplier Creation & Update Logic ---
        const subjectMapByRut = new Map(existingSubjects.map(s => [s.rut, s]));
        const newSuppliers = new Map<string, { rut: string; name: string }>();
        const supplierAccountUpdates = new Map<string, { subjectId: string; account: string }>();

        purchasesToProcess.forEach(p => {
            if (p.supplierRut) {
                // Check if supplier is new
                if (!subjectMapByRut.has(p.supplierRut) && !newSuppliers.has(p.supplierRut)) {
                    newSuppliers.set(p.supplierRut, { rut: p.supplierRut, name: p.supplier });
                }
                // Track account used for this supplier for future auto-assignment
                if (p.assignedAccount) {
                    const subject = subjectMapByRut.get(p.supplierRut);
                    if (subject && subject.id) {
                         // Check if the assigned account is different from the last one
                        if (subject.lastAssignedAccount !== p.assignedAccount) {
                           supplierAccountUpdates.set(p.supplierRut, { subjectId: subject.id, account: p.assignedAccount });
                        }
                    }
                }
            }
        });
        
        // Batch create new suppliers
        if (newSuppliers.size > 0) {
            const subjectsCollectionRef = collection(firestore, `companies/${companyId}/subjects`);
            newSuppliers.forEach(supplier => {
                const newSubjectRef = doc(subjectsCollectionRef);
                batch.set(newSubjectRef, { name: supplier.name, rut: supplier.rut, type: 'Proveedor', status: 'Active', companyId: companyId });
            });
        }
        
        // Batch update suppliers' last used account
        supplierAccountUpdates.forEach(update => {
            batch.update(doc(firestore, `companies/${companyId}/subjects`, update.subjectId), { lastAssignedAccount: update.account });
        });
        // --- End Supplier Logic ---

        const periodDate = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate) : new Date();
        const lastDay = lastDayOfMonth(periodDate);
        const monthName = format(periodDate, 'MMMM', { locale: es });

        const entries: Omit<VoucherEntry, 'id'>[] = [];
        
        summary.forEach(row => {
            entries.push({ account: row.accountCode, description: `Neto compras ${row.accountName}`, debit: row.totalNet > 0 ? row.totalNet : 0, credit: row.totalNet < 0 ? -row.totalNet : 0 });
        });

        if (totalIvaCredit !== 0 && selectedCompany.purchasesVatAccount) {
            entries.push({ account: selectedCompany.purchasesVatAccount, description: 'IVA Crédito Fiscal del período', debit: totalIvaCredit > 0 ? totalIvaCredit : 0, credit: totalIvaCredit < 0 ? -totalIvaCredit : 0 });
        }

        otherTaxesSummary.forEach(tax => {
            if (tax.total !== 0 && tax.accountCode) {
                entries.push({ account: tax.accountCode, description: tax.name, debit: tax.total > 0 ? tax.total : 0, credit: tax.total < 0 ? -tax.total : 0 });
            }
        });

        if (totalPayable !== 0 && selectedCompany.purchasesInvoicesPayableAccount) {
            entries.push({ account: selectedCompany.purchasesInvoicesPayableAccount, description: 'Cuentas por Pagar Proveedores', debit: totalPayable < 0 ? -totalPayable : 0, credit: totalPayable > 0 ? totalPayable : 0 });
        }
        
        const finalEntries = entries.filter(e => e.debit !== 0 || e.credit !== 0);
        const newVoucherRef = doc(collection(firestore, `companies/${companyId}/vouchers`));
        batch.set(newVoucherRef, {
            date: format(lastDay, 'yyyy-MM-dd'),
            type: 'Traspaso' as const,
            description: `Centralización Compras ${monthName} ${periodDate.getFullYear()}`,
            status: 'Contabilizado' as const,
            total: Math.abs(finalEntries.reduce((sum, e) => sum + e.debit, 0)),
            entries: finalEntries,
            companyId: companyId,
            createdAt: Timestamp.now(),
        });

        purchasesToProcess.forEach(purchase => {
            batch.update(doc(firestore, `companies/${companyId}/purchases`, purchase.id), { status: 'Contabilizado', voucherId: newVoucherRef.id, assignedAccount: purchase.assignedAccount });
        });
        
        try {
            await batch.commit();
            toast({ title: 'Centralización Exitosa', description: `El comprobante ha sido generado. ${supplierAccountUpdates.size} preferencia(s) de proveedor guardada(s). ${newSuppliers.size > 0 ? `${newSuppliers.size} nuevos proveedores creados.` : ''}` });
            router.push('/dashboard/vouchers');
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `companies/${companyId}`, operation: 'update' }));
             setIsProcessing(false);
        }
    };

    if (loading) {
        return <p>Cargando y asignando cuentas...</p>;
    }

    if (!allPurchases || allPurchases.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Sin Documentos Pendientes</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">No hay documentos de compra pendientes por centralizar. <Link href="/dashboard/purchases" className="text-primary underline">Volver al libro de compras</Link>.</p></CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Asignar Cuentas de Gasto</CardTitle>
                    <CardDescription>Revisa cada documento y asigna la cuenta contable de gasto o costo que corresponda. El sistema ha asignado cuentas automáticamente basado en centralizaciones anteriores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Fecha</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead className="w-[350px]">Cuenta de Gasto/Costo Asignada</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {editablePurchases.map(p => (
                                <TableRow key={p.id} className={!p.assignedAccount ? "bg-red-50/50" : ""}>
                                    <TableCell>{p.date}</TableCell>
                                    <TableCell>{p.supplier}</TableCell>
                                    <TableCell>{p.documentType} {p.documentNumber}</TableCell>
                                    <TableCell>
                                        <AccountSearchInput
                                            label=""
                                            value={p.assignedAccount || ''}
                                            onValueChange={(value) => handleAccountChange(p.id, value)}
                                            accounts={accounts || []}
                                            loading={accountsLoading}
                                            placeholder="Seleccionar cuenta..."
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">${p.total.toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div>
                <h1 className="text-2xl font-bold tracking-tight">2. Vista Previa y Centralización</h1>
                <p className="text-muted-foreground">Verifica los totales y confirma la generación del asiento contable.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen del Asiento a Generar</CardTitle>
                </CardHeader>
                <CardContent>
                    {missingTaxAccounts.length > 0 && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Faltan Cuentas de Impuestos Adicionales</AlertTitle>
                            <AlertDescription>
                                <p>Para poder centralizar, debes asignar una cuenta contable a los siguientes impuestos en la <Link href="/dashboard/companies/settings" className="font-bold underline">configuración de la empresa</Link>:</p>
                                <ul className="list-disc pl-5 mt-2 text-xs">
                                    {missingTaxAccounts.map(tax => (
                                        <li key={tax.code}>{tax.name} (Código: {tax.code})</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                     {unassignedDocsCount > 0 && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Atención Requerida: {unassignedDocsCount} Documento(s) Sin Cuenta Asignada</AlertTitle>
                            <AlertDescription className="flex flex-col gap-2 mt-2">
                                <p>Debes asignar una cuenta de gasto a todos los documentos en la tabla de arriba. Puedes hacerlo uno por uno o usar la opción de asignación masiva.</p>
                                <Button size="sm" variant="secondary" onClick={() => setIsAssignAllDialogOpen(true)} className="mt-2">Asignar Cuenta a {unassignedDocsCount} Documentos</Button>
                            </AlertDescription>
                        </Alert>
                     )}
                     {closedPeriodDocs.length > 0 && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Atención Requerida: {closedPeriodDocs.length} Documento(s) en Período Cerrado</AlertTitle>
                            <AlertDescription>
                                <p>Estos documentos no serán incluidos en esta centralización:</p>
                                 <ul className="list-disc pl-5 mt-2 text-xs">
                                   {closedPeriodDocs.slice(0, 5).map(doc => <li key={doc.id}>Folio {doc.documentNumber} de {doc.supplier} (Fecha: {new Date(doc.date).toLocaleDateString('es-CL')})</li>)}
                                    {closedPeriodDocs.length > 5 && <li>... y {closedPeriodDocs.length - 5} más.</li>}
                                </ul>
                            </AlertDescription>
                        </Alert>
                     )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">DEBE (Cargos)</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Cuenta Contable</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {summary.filter(r => r.totalNet > 0).map(row => (
                                        <TableRow key={row.accountCode}><TableCell>{row.accountCode} - {row.accountName}</TableCell><TableCell className="text-right">${Math.round(row.totalNet).toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    {totalIvaCredit > 0 && selectedCompany?.purchasesVatAccount && (
                                        <TableRow><TableCell>{selectedCompany.purchasesVatAccount} - IVA Crédito Fiscal</TableCell><TableCell className="text-right">${Math.round(totalIvaCredit).toLocaleString('es-CL')}</TableCell></TableRow>
                                    )}
                                    {otherTaxesSummary.filter(t => t.total > 0).map(tax => (
                                        <TableRow key={tax.code}><TableCell>{tax.accountCode} - {tax.name}</TableCell><TableCell className="text-right">${Math.round(tax.total).toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    {totalPayable < 0 && selectedCompany?.purchasesInvoicesPayableAccount && (
                                        <TableRow><TableCell>{selectedCompany.purchasesInvoicesPayableAccount} - Disminución Proveedores</TableCell><TableCell className="text-right">${Math.round(-totalPayable).toLocaleString('es-CL')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                                <TableFooter><TableRow className="font-bold text-base"><TableCell>Total Debe</TableCell><TableCell className="text-right">${Math.round(totalDebit).toLocaleString('es-CL')}</TableCell></TableRow></TableFooter>
                            </Table>
                        </div>
                         <div className="space-y-2">
                            <h3 className="font-semibold text-lg">HABER (Abonos)</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Cuenta Contable</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {summary.filter(r => r.totalNet < 0).map(row => (
                                        <TableRow key={row.accountCode}><TableCell>{row.accountCode} - {row.accountName}</TableCell><TableCell className="text-right">${Math.round(-row.totalNet).toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    {totalIvaCredit < 0 && selectedCompany?.purchasesVatAccount && (
                                        <TableRow><TableCell>{selectedCompany.purchasesVatAccount} - Ajuste IVA Crédito</TableCell><TableCell className="text-right">${Math.round(-totalIvaCredit).toLocaleString('es-CL')}</TableCell></TableRow>
                                    )}
                                    {otherTaxesSummary.filter(t => t.total < 0).map(tax => (
                                        <TableRow key={tax.code}><TableCell>{tax.accountCode} - Ajuste {tax.name}</TableCell><TableCell className="text-right">${Math.round(-tax.total).toLocaleString('es-CL')}</TableCell></TableRow>
                                    ))}
                                    {totalPayable > 0 && selectedCompany?.purchasesInvoicesPayableAccount && (
                                        <TableRow><TableCell>{selectedCompany.purchasesInvoicesPayableAccount} - Proveedores</TableCell><TableCell className="text-right">${Math.round(totalPayable).toLocaleString('es-CL')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                                 <TableFooter><TableRow className="font-bold text-base"><TableCell>Total Haber</TableCell><TableCell className="text-right">${Math.round(totalCredit).toLocaleString('es-CL')}</TableCell></TableRow></TableFooter>
                            </Table>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col items-end gap-4 pt-6">
                    <div className="text-right">
                       <p className={`font-bold ${isBalanced ? 'text-green-600' : 'text-destructive'}`}>{isBalanced ? 'El asiento está cuadrado.' : 'El asiento no está cuadrado.'}</p>
                       <p className="text-sm text-muted-foreground">Diferencia: ${(Math.round(totalDebit) - Math.round(totalCredit)).toLocaleString('es-CL')}</p>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" asChild><Link href="/dashboard/purchases">Cancelar</Link></Button>
                        <Button onClick={handleCentralize} disabled={!isValid || isProcessing}>{isProcessing ? "Procesando..." : "Centralizar y Contabilizar"}</Button>
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={isAssignAllDialogOpen} onOpenChange={setIsAssignAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Cuenta a Documentos Pendientes</DialogTitle>
                        <DialogDescription>Selecciona la cuenta de gasto que deseas asignar a los {unassignedDocsCount} documentos sin clasificar.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       <AccountSearchInput label="Cuenta de Gasto/Costo" value={bulkAssignAccount || ''} onValueChange={setBulkAssignAccount} accounts={accounts || []} loading={accountsLoading} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button type="button" onClick={handleBulkAssignAccount} disabled={!bulkAssignAccount}>{isProcessing ? 'Guardando...' : 'Guardar y Asignar'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
