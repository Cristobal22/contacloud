
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
import type { TaxParameter } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { initialTaxParameters } from "@/lib/seed-data";
import { writeBatch, collection, getDocs } from "firebase/firestore";
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


export default function ParametrosIUTPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { data: tablaIUT, loading } = useCollection<TaxParameter>({ path: 'tax-parameters' });

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleUpdateParameters = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        const collectionRef = collection(firestore, 'tax-parameters');

        try {
            const batch = writeBatch(firestore);
            // Delete existing documents
            const existingDocs = await getDocs(collectionRef);
            existingDocs.forEach(doc => batch.delete(doc.ref));

            // Add new documents
            initialTaxParameters.forEach(param => {
                const docRef = doc(collectionRef, param.id);
                batch.set(docRef, param);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "La tabla de IUT ha sido actualizada con los valores más recientes.",
            });
        } catch (error) {
            console.error("Error updating tax parameters: ", error);
            toast({
                variant: 'destructive',
                title: "Error de Permisos",
                description: "No se pudieron actualizar los parámetros. Asegúrate de tener los permisos necesarios."
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
                            <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                            <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
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
                                        No se encontraron parámetros de IUT. Un administrador debe poblarlos.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <p className="text-xs text-muted-foreground mt-4">Valores en Unidades Tributarias Mensuales (UTM).</p>
                </CardContent>
            </Card>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción borrará todos los parámetros de IUT existentes y los reemplazará con los valores del sistema. Esta acción es recomendada si los datos están desactualizados o corruptos.
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
