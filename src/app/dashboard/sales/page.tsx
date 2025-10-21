
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
import { Upload, ArrowRight, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore } from "@/firebase"
import { collection, addDoc, writeBatch, query, where, getDocs, doc } from "firebase/firestore"
import type { Sale } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SelectedCompanyContext } from "../layout";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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

export default function SalesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const { data: sales, loading: salesLoading } = useCollection<Sale>({
        path: companyId ? `companies/${companyId}/sales` : undefined,
        companyId: companyId
    });

    const loading = salesLoading;

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !firestore || !companyId) return;
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n').slice(1).filter(line => line.trim() !== '');
                if (lines.length === 0) {
                    toast({ variant: 'destructive', title: 'Error de archivo', description: 'El archivo CSV está vacío o tiene un formato incorrecto.' });
                    return;
                }

                const batch = writeBatch(firestore);
                const collectionRef = collection(firestore, `companies/${companyId}/sales`);
                let count = 0;

                lines.forEach(line => {
                    const columns = line.split(';');
                    if (columns.length < 14) return;

                    const parseDate = (dateStr: string) => {
                        const [day, month, year] = dateStr.split('-');
                        if (!day || !month || !year) return new Date().toISOString().substring(0, 10);
                        return new Date(`${year}-${month}-${day}`).toISOString().substring(0,10);
                    };
                    
                    const newSale: Omit<Sale, 'id'> = {
                        date: parseDate(columns[6]?.trim() || ''),
                        documentNumber: columns[5]?.trim() || '',
                        customer: columns[4]?.trim() || '',
                        exemptAmount: parseFloat(columns[9]) || 0,
                        netAmount: parseFloat(columns[10]) || 0,
                        total: parseFloat(columns[13]) || 0,
                        status: 'Pendiente',
                        companyId: companyId
                    };

                    if (newSale.documentNumber && newSale.customer) {
                        const docRef = doc(collectionRef);
                        batch.set(docRef, newSale);
                        count++;
                    }
                });

                if (count === 0) {
                     toast({ variant: 'destructive', title: 'Error de formato', description: 'No se encontraron documentos válidos en el archivo.' });
                    return;
                }
                
                try {
                    await batch.commit();
                    toast({ title: 'Importación Exitosa', description: `Se importaron ${count} documentos de venta.` });
                } catch (error) {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `companies/${companyId}/sales`,
                        operation: 'create',
                    }));
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeletePending = async () => {
        if (!firestore || !companyId) return;

        const collectionPath = `companies/${companyId}/sales`;
        const q = query(collection(firestore, collectionPath), where("status", "==", "Pendiente"));

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ description: "No hay documentos pendientes para eliminar." });
                setIsDeleteDialogOpen(false);
                return;
            }

            const batch = writeBatch(firestore);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            toast({
                title: 'Proceso Cancelado',
                description: 'Se han eliminado todos los documentos de venta pendientes.',
                variant: 'destructive'
            });

        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'delete',
            }));
        } finally {
            setIsDeleteDialogOpen(false);
        }
    };


    const pendingSales = sales?.filter(p => p.status === 'Pendiente') || [];

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Centralización de Ventas</CardTitle>
                            <CardDescription>Paso 1: Importa los documentos de venta desde el archivo del SII.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
                            <Button size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()} disabled={!companyId}>
                                <Upload className="h-4 w-4" />
                                Importar Ventas (CSV)
                            </Button>
                            {pendingSales.length > 0 && (
                                <>
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        className="gap-1" 
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar Pendientes
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="gap-1" 
                                        onClick={() => router.push('/dashboard/sales/centralize')}
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
                                <TableHead>Nº Documento</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Exento</TableHead>
                                <TableHead className="text-right">Neto</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && pendingSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{new Date(sale.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell className="font-medium">{sale.documentNumber}</TableCell>
                                    <TableCell>{sale.customer}</TableCell>
                                    <TableCell className="text-right">${sale.exemptAmount.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">${sale.netAmount.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right font-bold">${sale.total.toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                            {!loading && pendingSales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        {!companyId ? "Selecciona una empresa para empezar." : "No hay documentos de venta pendientes. ¡Importa un archivo!"}
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
                            Esta acción no se puede deshacer. Se eliminarán permanentemente **todos** los documentos de venta con estado "Pendiente" para la empresa seleccionada.
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
        </>
    )
}
