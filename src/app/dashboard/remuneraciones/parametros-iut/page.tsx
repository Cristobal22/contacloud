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
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { TaxParameter } from "@/lib/types"
import { collection, doc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";

const initialTaxParameters: Omit<TaxParameter, 'id'>[] = [
    { tramo: "1", desde: 0, hasta: 13.5, factor: 0, rebaja: 0 },
    { tramo: "2", desde: 13.5, hasta: 30, factor: 0.04, rebaja: 0.54 },
    { tramo: "3", desde: 30, hasta: 50, factor: 0.08, rebaja: 1.74 },
    { tramo: "4", desde: 50, hasta: 70, factor: 0.135, rebaja: 4.49 },
    { tramo: "5", desde: 70, hasta: 90, factor: 0.23, rebaja: 11.14 },
    { tramo: "6", desde: 90, hasta: 120, factor: 0.304, rebaja: 17.8 },
    { tramo: "7", desde: 120, hasta: 310, factor: 0.35, rebaja: 23.32 },
    { tramo: "8", desde: 310, hasta: Infinity, factor: 0.4, rebaja: 38.82 }
];

export default function ParametrosIUTPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    
    const paramsCollection = React.useMemo(() => 
        firestore && user ? collection(firestore, `users/${user.uid}/tax-parameters`) : null,
    [firestore, user]);

    const { data: tablaIUT, loading, refetch } = useCollection<TaxParameter>({ query: paramsCollection });

    const handleSeedData = async () => {
        if (!firestore || !user) return;

        const collectionPath = `users/${user.uid}/tax-parameters`;
        const batch = writeBatch(firestore);
        
        initialTaxParameters.forEach(paramData => {
            const docRef = doc(collection(firestore, collectionPath));
            batch.set(docRef, paramData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "La tabla de IUT ha sido poblada exitosamente.",
            });
            refetch();
        } catch (error) {
            console.error("Error seeding tax parameters: ", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'create',
            }));
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
                     {tablaIUT?.length === 0 && !loading && (
                        <Button size="sm" onClick={handleSeedData}>Poblar Datos Iniciales</Button>
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
                        {!loading && tablaIUT?.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{`Más de ${item.desde.toLocaleString('es-CL')} ${item.hasta !== Infinity && item.hasta < 999999999 ? `hasta ${item.hasta.toLocaleString('es-CL')}`: ''}`}</TableCell>
                                <TableCell>{`${(item.factor * 100).toFixed(1).replace('.',',')}%`}</TableCell>
                                <TableCell className="text-right font-medium">{item.rebaja.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && tablaIUT?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    No se encontraron parámetros de IUT. Puedes poblarlos con datos iniciales.
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
