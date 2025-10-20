
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
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { Institution } from "@/lib/types"
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
import { initialInstitutions } from "@/lib/seed-data";


export default function InstitucionesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { data: institutions, loading } = useCollection<Institution>({ path: 'institutions' });

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        const collectionRef = collection(firestore, 'institutions');

        try {
            const batch = writeBatch(firestore);
            const existingDocs = await getDocs(collectionRef);
            existingDocs.forEach(doc => batch.delete(doc.ref));

            initialInstitutions.forEach(item => {
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, item);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "La lista de instituciones ha sido actualizada.",
            });
        } catch (error) {
            console.error("Error updating institutions: ", error);
            toast({
                variant: 'destructive',
                title: "Error de Permisos",
                description: "No se pudieron actualizar las instituciones."
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
                            <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                            <CardDescription>Gestiona las instituciones para el cálculo de remuneraciones.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             {userProfile?.role === 'Admin' && (
                                <Button size="sm" onClick={() => setIsAlertOpen(true)} disabled={isSubmitting}>
                                    {isSubmitting ? 'Actualizando...' : 'Actualizar Parámetros'}
                                </Button>
                            )}
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
                                        No se encontraron instituciones. Un administrador debe poblarlas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción borrará las instituciones existentes y las reemplazará con los valores del sistema.
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
