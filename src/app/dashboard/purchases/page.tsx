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
import { Button } from "@/components/ui/button"
import { Upload, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore } from "@/firebase"
import { collection, addDoc, setDoc, doc, writeBatch } from "firebase/firestore"
import type { Purchase, Account } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";
import { useToast } from "@/hooks/use-toast";
import { AccountSearchInput } from "@/components/account-search-input";
import { useRouter } from "next/navigation";

export default function PurchasesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        if (!event.target.files || !firestore || !companyId) return;
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n').slice(1); // Skip header
                if (lines.length === 0) {
                    toast({ variant: 'destructive', title: 'Error de archivo', description: 'El archivo CSV está vacío o tiene un formato incorrecto.' });
                    return;
                }

                const batch = writeBatch(firestore);
                const collectionRef = collection(firestore, `companies/${companyId}/purchases`);
                let count = 0;

                lines.forEach(line => {
                    const columns = line.split(',');
                    // Assuming CSV format: tipo doc, folio, rut, razon social, fecha, neto, iva, total
                    if (columns.length < 8) return;
                    
                    const newPurchase: Omit<Purchase, 'id'> = {
                        documentType: columns[0].trim(),
                        documentNumber: columns[1].trim(),
                        supplierRut: columns[2].trim(),
                        supplier: columns[3].trim(),
                        date: new Date(columns[4].trim()).toISOString().substring(0,10),
                        netAmount: parseFloat(columns[5]) || 0,
                        taxAmount: parseFloat(columns[6]) || 0,
                        total: parseFloat(columns[7]) || 0,
                        status: 'Pendiente',
                        companyId: companyId,
                    };
                    const docRef = doc(collectionRef);
                    batch.set(docRef, newPurchase);
                    count++;
                });

                if (count === 0) {
                     toast({ variant: 'destructive', title: 'Error de formato', description: 'No se encontraron documentos válidos en el archivo.' });
                    return;
                }
                
                try {
                    await batch.commit();
                    toast({ title: 'Importación Exitosa', description: `Se importaron ${count} documentos de compra.` });
                } catch (error) {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `companies/${companyId}/purchases`,
                        operation: 'create',
                    }));
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const pendingPurchases = purchases?.filter(p => p.status === 'Pendiente') || [];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>1. Importar y Asignar Cuentas de Compra</CardTitle>
                        <CardDescription>Importa documentos y asigna las cuentas de gasto/activo para cada uno.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
                        <Button size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()} disabled={!companyId}>
                            <Upload className="h-4 w-4" />
                            Importar Compras (CSV)
                        </Button>
                        <Button 
                            size="sm" 
                            className="gap-1" 
                            disabled={pendingPurchases.length === 0}
                            onClick={() => router.push('/dashboard/purchases/centralize')}
                        >
                           Ir a Centralizar <ArrowRight className="h-4 w-4" />
                        </Button>
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
                            <TableHead className="text-right">Neto</TableHead>
                            <TableHead className="text-right">IVA</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && pendingPurchases.map((purchase) => (
                            <TableRow key={purchase.id}>
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
                                <TableCell className="text-right">${purchase.netAmount.toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right">${purchase.taxAmount.toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right font-bold">${purchase.total.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                        {!loading && pendingPurchases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    {!companyId ? "Selecciona una empresa para empezar." : "No hay documentos de compra pendientes. ¡Importa un archivo!"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
