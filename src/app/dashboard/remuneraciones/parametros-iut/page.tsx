
'use client';

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
import { useCollection, useFirestore } from "@/firebase"
import type { TaxParameter } from "@/lib/types"
import { collection, doc, writeBatch, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";
import { initialTaxParameters } from "@/lib/seed-data";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function ParametrosIUTPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const { data: tablaIUT, loading } = useCollection<TaxParameter>({ path: 'tax-parameters' });

    const handleUpdateParameters = async () => {
        if (!firestore) return;

        const collectionPath = `tax-parameters`;
        const collectionRef = collection(firestore, collectionPath);
        const batch = writeBatch(firestore);
        
        try {
            // 1. Delete existing documents
            const querySnapshot = await getDocs(collectionRef);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 2. Add new documents
            initialTaxParameters.forEach(paramData => {
                const docRef = doc(firestore, collectionPath, paramData.id);
                batch.set(docRef, paramData);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "La tabla de IUT ha sido actualizada con los últimos valores.",
            });
        } catch (error) {
            console.error("Error updating tax parameters: ", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'create',
            }));
             toast({
                variant: 'destructive',
                title: "Error al actualizar",
                description: "No se pudieron actualizar los parámetros. Revisa los permisos de la base de datos.",
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                        <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm">Actualizar Parámetros</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción borrará los parámetros existentes y los reemplazará con los valores predeterminados de la aplicación. Esto asegura que tengas los datos más recientes.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUpdateParameters}>Sí, actualizar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Renta (UTM)</TableHead>
                            <TableHead>Tasa de Impuesto</TableHead>
                            <TableHead className="text-right">Cantidad a Rebajar (UTM)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && tablaIUT?.sort((a, b) => a.desde - b.desde).map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{`Más de ${item.desde.toLocaleString('es-CL')} ${item.hasta !== Infinity && item.hasta < 999999999 ? `hasta ${item.hasta.toLocaleString('es-CL')}`: ''}`}</TableCell>
                                <TableCell>{`${(item.factor * 100).toFixed(1).replace('.',',')}%`}</TableCell>
                                <TableCell className="text-right font-medium">{item.rebaja.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && tablaIUT?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    No se encontraron parámetros de IUT. Puedes poblarlos con el botón "Actualizar Parámetros".
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">Valores en Unidades Tributarias Mensuales (UTM).</p>
            </CardContent>
        </Card>
    )
}
