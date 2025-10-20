
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
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { AfpEntity } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { initialAfpEntities } from "@/lib/seed-data";

export default function AfpEntitiesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { data: afpEntities, loading } = useCollection<AfpEntity>({ path: 'afp-entities' });

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        const collectionRef = collection(firestore, 'afp-entities');

        try {
            const batch = writeBatch(firestore);
            const existingDocs = await getDocs(collectionRef);
            existingDocs.forEach(doc => batch.delete(doc.ref));

            initialAfpEntities.forEach(item => {
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, item);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "La lista de entidades AFP ha sido actualizada.",
            });
        } catch (error) {
            console.error("Error updating AFP entities: ", error);
            toast({
                variant: 'destructive',
                title: "Error de Permisos",
                description: "No se pudieron actualizar las entidades."
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
                            <CardTitle>Entidades AFP</CardTitle>
                            <CardDescription>Gestiona las AFP para el cálculo de remuneraciones.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             {userProfile?.role === 'Admin' && (
                                <Button size="sm" onClick={() => setIsAlertOpen(true)} disabled={isSubmitting}>
                                    {isSubmitting ? 'Actualizando...' : 'Actualizar Parámetros'}
                                </Button>
                            )}
                            <Button size="sm" className="gap-1" disabled>
                                <PlusCircle className="h-4 w-4" />
                                Agregar Entidad
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Cotización Obligatoria</TableHead>
                                    <TableHead>Código Previred</TableHead>
                                    <TableHead>Régimen Previsional</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                                    </TableRow>
                                )}
                                {!loading && afpEntities?.map((entity) => (
                                    <TableRow key={entity.id}>
                                        <TableCell className="font-medium">{entity.name}</TableCell>
                                        <TableCell className="text-right">{entity.mandatoryContribution.toFixed(2).replace('.',',')}%</TableCell>
                                        <TableCell>{entity.previredCode}</TableCell>
                                        <TableCell>{entity.provisionalRegime}</TableCell>
                                    </TableRow>
                                ))}
                                {!loading && afpEntities?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No se encontraron entidades de AFP. Un administrador debe poblarlas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción borrará las entidades AFP existentes y las reemplazará con los valores del sistema.
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
