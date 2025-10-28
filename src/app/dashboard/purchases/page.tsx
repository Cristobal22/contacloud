
'use client';

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Upload, ArrowRight, Trash2, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore } from "@/firebase"
import { collection, addDoc, setDoc, doc, writeBatch, query, where, getDocs } from "firebase/firestore"
import type { Purchase, Account, OtherTax } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";
import { useToast } from "@/hooks/use-toast";
import { AccountSearchInput } from "@/components/account-search-input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { parseISO } from "date-fns";

const taxCodeMap: { [key: string]: string } = {
    "15": "Imp. Específico Diesel",
    "16": "Imp. Específico Gasolinas",
    "23": "Imp. Adic. Pirotecnia, Armas y Similares",
    "24": "Imp. Adic. Alfombras y Tapices Finos",
    "25": "Imp. Adic. Pieles Finas",
    "26": "Imp. Adic. Casas Rodantes",
    "27": "Imp. Adic. Licores, Piscos y Vinos", // ILA
    "28": "Imp. Adic. Bebidas Analcohólicas y Minerales",
    "29": "Imp. Adic. Vehículos de Lujo",
    "32": "Margen de Comercialización",
    "49": "Tabacos Elaborados",
    "50": "Cigarrillos",
};

const getTaxNameFromCode = (code: string) => {
    return taxCodeMap[code] || `Otro Imp. Cód ${code}`;
}

export default function PurchasesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isAssignAllDialogOpen, setIsAssignAllDialogOpen] = React.useState(false);
    const [bulkAssignAccount, setBulkAssignAccount] = React.useState<string | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>({
        path: companyId ? `companies/${companyId}/purchases` : undefined,
        companyId: companyId
    });
    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: companyId ? `companies/${companyId}/accounts` : undefined,
    });

    const loading = purchasesLoading || accountsLoading;

    const handleAccountChange = (purchaseId: string, accountCode: string) => {
        if (!firestore || !companyId) return;

        const purchaseRef = doc(firestore, `companies/${companyId}/purchases`, purchaseId);
        setDoc(purchaseRef, { assignedAccount: accountCode }, { merge: true })
            .catch(err => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: purchaseRef.path,
                    operation: 'update',
                    requestResourceData: { assignedAccount: accountCode },
                }));
            });
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !firestore || !companyId || !selectedCompany) return;
        const file = event.target.files[0];
        if (file) {
            setIsProcessing(true);
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    toast({ variant: 'destructive', title: 'Error de archivo', description: 'El archivo CSV está vacío o no contiene un encabezado.' });
                    setIsProcessing(false);
                    return;
                }

                const headerLine = lines[0].replace(/"/g, '');
                const headers = headerLine.split(';').map(h => h.trim());
                const dataLines = lines.slice(1);

                const colIdx = {
                    docType: headers.indexOf('Tipo Doc'),
                    docNum: headers.indexOf('Folio'),
                    rut: headers.indexOf('RUT Proveedor'),
                    name: headers.indexOf('Razon Social'),
                    date: headers.indexOf('Fecha Docto'),
                    exempt: headers.indexOf('Monto Exento'),
                    net: headers.indexOf('Monto Neto'),
                    vat: headers.indexOf('Monto IVA Recuperable'),
                    total: headers.indexOf('Monto Total'),
                };

                // Check for critical missing headers
                if (colIdx.docType === -1 || colIdx.docNum === -1 || colIdx.rut === -1 || colIdx.name === -1) {
                    toast({ variant: 'destructive', title: 'Error de formato', description: 'El archivo CSV no parece ser un Registro de Compras válido. Faltan encabezados críticos.' });
                    setIsProcessing(false);
                    return;
                }

                const otherTaxesHeaders: { codeIndex: number, valueIndex: number }[] = [];
                headers.forEach((h, i) => {
                    if (h === 'Codigo Otro Impuesto') { // Exact match
                        const valueIndex = headers.indexOf('Valor Otro Impuesto', i); // Search after the code
                        if (valueIndex > i) {
                            otherTaxesHeaders.push({ codeIndex: i, valueIndex: valueIndex });
                        }
                    }
                });

                const supplierAccountMap = new Map<string, string>();
                if (purchases) {
                    purchases.forEach(p => {
                        if (p.supplierRut && p.assignedAccount) {
                            supplierAccountMap.set(p.supplierRut, p.assignedAccount);
                        }
                    });
                }

                const batch = writeBatch(firestore);
                const collectionRef = collection(firestore, `companies/${companyId}/purchases`);
                let count = 0;
                let hasDateMismatch = false;
                const workingPeriodMonth = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate).getMonth() : -1;
                const workingPeriodYear = selectedCompany.periodStartDate ? parseISO(selectedCompany.periodStartDate).getFullYear() : -1;

                dataLines.forEach(line => {
                    const columns = line.split(';');

                    const parseDate = (dateStr: string) => {
                        const [day, month, year] = dateStr.split('-');
                        if (!day || !month || !year) return new Date().toISOString().substring(0, 10);
                        return new Date(`${year}-${month}-${day}`).toISOString().substring(0, 10);
                    };

                    const supplierRut = columns[colIdx.rut]?.trim() || '';
                    const documentDateStr = parseDate(columns[colIdx.date]?.trim() || '');
                    const documentDate = parseISO(documentDateStr);

                    if (workingPeriodMonth !== -1 && (documentDate.getMonth() !== workingPeriodMonth || documentDate.getFullYear() !== workingPeriodYear)) {
                        hasDateMismatch = true;
                    }

                    const otherTaxes: OtherTax[] = [];
                    otherTaxesHeaders.forEach(taxHeader => {
                        const taxCode = columns[taxHeader.codeIndex]?.trim();
                        const taxAmount = parseFloat(columns[taxHeader.valueIndex]) || 0;
                        if (taxCode && taxAmount > 0) {
                            otherTaxes.push({
                                code: taxCode,
                                name: getTaxNameFromCode(taxCode),
                                amount: taxAmount,
                            });
                        }
                    });

                    const newPurchase: Omit<Purchase, 'id'> = {
                        documentType: columns[colIdx.docType]?.trim() || '',
                        documentNumber: columns[colIdx.docNum]?.trim() || '',
                        supplierRut: supplierRut,
                        supplier: columns[colIdx.name]?.trim() || '',
                        date: documentDateStr,
                        exemptAmount: parseFloat(columns[colIdx.exempt]) || 0,
                        netAmount: parseFloat(columns[colIdx.net]) || 0,
                        taxAmount: parseFloat(columns[colIdx.vat]) || 0,
                        otherTaxes: otherTaxes,
                        total: parseFloat(columns[colIdx.total]) || 0,
                        status: 'Pendiente',
                        companyId: companyId,
                    };

                    const assignedAccount = supplierAccountMap.get(supplierRut);
                    if (assignedAccount) {
                        newPurchase.assignedAccount = assignedAccount;
                    }

                    if (newPurchase.documentNumber && newPurchase.supplier) {
                        const docRef = doc(collectionRef);
                        batch.set(docRef, newPurchase);
                        count++;
                    }
                });

                if (count === 0) {
                    toast({ variant: 'destructive', title: 'Error de formato', description: 'No se encontraron documentos válidos en el archivo. Verifica que los datos y encabezados sean correctos.' });
                    setIsProcessing(false);
                    return;
                }

                try {
                    await batch.commit();
                    toast({ title: 'Importación Exitosa', description: `Se importaron ${count} documentos de compra.` });
                    if (hasDateMismatch) {
                        toast({
                            variant: 'destructive',
                            title: 'Advertencia de Fechas',
                            description: 'Algunos documentos importados no corresponden al período de trabajo actual. Revísalos antes de centralizar.',
                            duration: 8000,
                        });
                    }
                } catch (error) {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `companies/${companyId}/purchases`,
                        operation: 'create',
                    }));
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeletePending = async () => {
        if (!firestore || !companyId) return;
        setIsProcessing(true);

        const collectionPath = `companies/${companyId}/purchases`;
        const q = query(collection(firestore, collectionPath), where("status", "==", "Pendiente"));

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ description: "No hay documentos pendientes para eliminar." });
                setIsDeleteDialogOpen(false);
                setIsProcessing(false);
                return;
            }

            const batch = writeBatch(firestore);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            toast({
                title: 'Proceso Cancelado',
                description: 'Se han eliminado todos los documentos de compra pendientes.',
                variant: 'destructive'
            });

        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'delete',
            }));
        } finally {
            setIsDeleteDialogOpen(false);
            setIsProcessing(false);
        }
    };

    const pendingPurchases = purchases?.filter(p => p.status === 'Pendiente') || [];
    const unassignedPurchases = pendingPurchases.filter(p => !p.assignedAccount);

    const handleBulkAssignAccount = async () => {
        if (!firestore || !companyId || !bulkAssignAccount || unassignedPurchases.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay cuenta seleccionada o no hay documentos que actualizar.' });
            return;
        }
    
        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const purchasesCollectionRef = collection(firestore, `companies/${companyId}/purchases`);
    
        unassignedPurchases.forEach(docToUpdate => {
            const docRef = doc(purchasesCollectionRef, docToUpdate.id);
            batch.update(docRef, { assignedAccount: bulkAssignAccount });
        });
    
        try {
            await batch.commit();
            toast({
                title: 'Actualización Exitosa',
                description: `Se asignó la cuenta ${bulkAssignAccount} a ${unassignedPurchases.length} documentos.`,
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


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Centralización de Compras</CardTitle>
                            <CardDescription>Paso 1: Importa documentos y asigna las cuentas de gasto/activo.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
                                <Button size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()} disabled={!companyId || isProcessing}>
                                    <Upload className="h-4 w-4" />
                                    Importar CSV
                                </Button>
                                {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
                            </div>
                            {unassignedPurchases.length > 0 && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="gap-1" 
                                    onClick={() => setIsAssignAllDialogOpen(true)}
                                    disabled={isProcessing}
                                >
                                    <Edit className="h-4 w-4" />
                                    Asignar Cuenta a Todos
                                </Button>
                            )}
                            {pendingPurchases.length > 0 && (
                                <>
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        className="gap-1" 
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                        disabled={isProcessing}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar Pendientes
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="gap-1" 
                                        onClick={() => router.push('/dashboard/purchases/centralize')}
                                        disabled={isProcessing || unassignedPurchases.length > 0}
                                    >
                                    Ir a Centralizar <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead className="w-[300px]">Cuenta de Gasto/Activo</TableHead>
                                <TableHead className="text-right">Exento</TableHead>
                                <TableHead className="text-right">Neto</TableHead>
                                <TableHead className="text-right">IVA</TableHead>
                                <TableHead className="text-right">Otros Imp.</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && pendingPurchases.map((purchase) => (
                                <TableRow 
                                    key={purchase.id}
                                    className={cn(!purchase.assignedAccount && "bg-destructive/10 border-l-4 border-destructive")}
                                >
                                    <TableCell>{new Date(purchase.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell className="font-medium">{purchase.documentType} {purchase.documentNumber}</TableCell>
                                    <TableCell>{purchase.supplier}</TableCell>
                                    <TableCell>
                                        <AccountSearchInput 
                                            value={purchase.assignedAccount || ''}
                                            onValueChange={(value) => handleAccountChange(purchase.id, value)}
                                            accounts={accounts || []}
                                            loading={accountsLoading}
                                            label=""
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">${Math.round(purchase.exemptAmount).toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">${Math.round(purchase.netAmount).toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">${Math.round(purchase.taxAmount).toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">${Math.round(purchase.otherTaxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0).toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right font-bold">${Math.round(purchase.total).toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                            {!loading && pendingPurchases.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">
                                        {!companyId ? "Selecciona una empresa para empezar." : "No hay documentos de compra pendientes. ¡Importa un archivo!"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente **todos** los documentos de compra con estado "Pendiente" para la empresa seleccionada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDeletePending}
                        >
                            Sí, eliminar pendientes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isAssignAllDialogOpen} onOpenChange={setIsAssignAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Cuenta a Documentos no Clasificados</DialogTitle>
                        <DialogDescription>
                            Selecciona la cuenta de gasto/activo que deseas asignar a los {unassignedPurchases.length} documentos sin cuenta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       <AccountSearchInput
                            label="Cuenta de Gasto/Activo"
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
        </>
    )
}
