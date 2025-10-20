
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
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore } from "@/firebase"
import type { Institution } from "@/lib/types"
import { collection, doc, writeBatch, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";
import { initialInstitutions } from "@/lib/seed-data";
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


export default function InstitucionesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const { data: institutions, loading } = useCollection<Institution>({ path: 'institutions' });

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        const collectionPath = `institutions`;
        const collectionRef = collection(firestore, collectionPath);
        const batch = writeBatch(firestore);
        
        try {
            // 1. Delete existing documents
            const querySnapshot = await getDocs(collectionRef);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // 2. Add new documents
            initialInstitutions.forEach(instData => {
                const docRef = doc(collection(firestore, collectionPath));
                batch.set(docRef, instData);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "Las instituciones han sido actualizadas.",
            });
        } catch (error) {
            console.error("Error updating institutions: ", error);
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
                        <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                        <CardDescription>Gestiona las instituciones para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" className="gap-1">
                                    Actualizar Parámetros
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción borrará la lista de instituciones actual y la reemplazará con los valores predeterminados de la aplicación.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleUpdateParameters}>Sí, actualizar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button size="sm" className="gap-1" disabled>
                            <PlusCircle className="h-4 w-4" />
                            Agregar Institución
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && institutions?.map((inst) => (
                            <TableRow key={inst.id}>
                                <TableCell className="font-medium">{inst.name}</TableCell>
                                <TableCell><Badge variant="secondary">{inst.type}</Badge></TableCell>
                            </TableRow>
                        ))}
                         {!loading && institutions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    No se encontraron instituciones. Puedes poblarlas con el botón "Actualizar Parámetros".
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
