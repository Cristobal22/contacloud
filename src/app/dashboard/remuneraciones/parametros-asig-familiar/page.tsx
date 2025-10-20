
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
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore } from "@/firebase"
import type { FamilyAllowanceParameter } from "@/lib/types"
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";
import { initialFamilyAllowanceParameters } from "@/lib/seed-data";
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


export default function ParametrosAsigFamiliarPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ path: 'family-allowance-parameters' });

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        
        const collectionPath = `family-allowance-parameters`;
        const collectionRef = collection(firestore, collectionPath);
        const batch = writeBatch(firestore);
        
        try {
            // 1. Delete existing documents
            const querySnapshot = await getDocs(collectionRef);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 2. Add new documents
            initialFamilyAllowanceParameters.forEach(paramData => {
                const docRef = doc(collection(firestore, collectionPath));
                batch.set(docRef, paramData);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "Los parámetros de asignación familiar han sido actualizados.",
            });
        } catch (error) {
            console.error("Error updating family allowance parameters: ", error);
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
                        <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                        <CardDescription>Gestiona los tramos y montos para el cálculo de la asignación familiar.</CardDescription>
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
                            <TableHead>Tramo</TableHead>
                            <TableHead className="text-right">Renta Desde</TableHead>
                            <TableHead className="text-right">Renta Hasta</TableHead>
                            <TableHead className="text-right">Monto del Beneficio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && tramosAsignacion?.map((tramo) => (
                            <TableRow key={tramo.id}>
                                <TableCell className="font-medium">{tramo.tramo}</TableCell>
                                <TableCell className="text-right">${tramo.desde.toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right">{tramo.hasta === Infinity || tramo.hasta >= 999999999 ? 'Y más' : `$${tramo.hasta.toLocaleString('es-CL')}`}</TableCell>
                                <TableCell className="text-right font-medium">${tramo.monto.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && tramosAsignacion?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    No se encontraron parámetros. Puedes poblarlos con el botón "Actualizar Parámetros".
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
                 <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual.</p>
            </CardContent>
        </Card>
    )
}
