
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
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { FamilyAllowanceParameter } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";
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
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { writeBatch, collection, getDocs, doc } from "firebase/firestore";
import { initialFamilyAllowanceParameters } from "@/lib/seed-data";

export default function ParametrosAsigFamiliarPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ path: 'family-allowance-parameters' });

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        const collectionRef = collection(firestore, 'family-allowance-parameters');

        try {
            const batch = writeBatch(firestore);
            const existingDocs = await getDocs(collectionRef);
            existingDocs.forEach(doc => batch.delete(doc.ref));

            initialFamilyAllowanceParameters.forEach(param => {
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, param);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "La tabla de Asignación Familiar ha sido actualizada.",
            });
        } catch (error) {
            console.error("Error updating family allowance parameters: ", error);
            toast({
                variant: 'destructive',
                title: "Error de Permisos",
                description: "No se pudieron actualizar los parámetros."
            })
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                            <CardDescription>Gestiona los tramos y montos para el cálculo de la asignación familiar.</CardDescription>
                        </div>
                        {userProfile?.role === 'Admin' && (
                            <Button size="sm" onClick={() => setIsAlertOpen(true)} disabled={isSubmitting}>
                                {isSubmitting ? 'Actualizando...' : 'Actualizar Parámetros'}
                            </Button>
                        )}
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
                                        No se encontraron parámetros. Un administrador debe poblarlos.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual.</p>
                </CardContent>
            </Card>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción borrará los parámetros de asignación familiar existentes y los reemplazará con los valores del sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleUpdateParameters}
                            disabled={isSubmitting}
                        >
                            Sí, actualizar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
