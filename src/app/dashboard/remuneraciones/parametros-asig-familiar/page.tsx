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
import type { FamilyAllowanceParameter } from "@/lib/types"
import { collection, writeBatch, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";

const initialFamilyAllowanceParameters: Omit<FamilyAllowanceParameter, 'id'>[] = [
    { tramo: "A", desde: 0, hasta: 515879, monto: 20328 },
    { tramo: "B", desde: 515880, hasta: 753496, monto: 12475 },
    { tramo: "C", desde: 753497, hasta: 1175196, monto: 3942 },
    { tramo: "D", desde: 1175197, hasta: Infinity, monto: 0 }
];

export default function ParametrosAsigFamiliarPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    
    const paramsCollection = React.useMemo(() => 
        firestore && user ? collection(firestore, `users/${user.uid}/family-allowance-parameters`) : null, 
    [firestore, user]);

    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ query: paramsCollection });

    const handleSeedData = async () => {
        if (!firestore || !user) return;
        
        const collectionPath = `users/${user.uid}/family-allowance-parameters`;
        const batch = writeBatch(firestore);
        
        initialFamilyAllowanceParameters.forEach(paramData => {
            const docRef = doc(collection(firestore, collectionPath));
            batch.set(docRef, paramData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Los parámetros de asignación familiar han sido poblados exitosamente.",
            });
        } catch (error) {
            console.error("Error seeding family allowance parameters: ", error);
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
                        <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                        <CardDescription>Gestiona los tramos y montos para el cálculo de la asignación familiar.</CardDescription>
                    </div>
                    {tramosAsignacion?.length === 0 && !loading && (
                        <Button size="sm" onClick={handleSeedData}>Poblar Datos Iniciales</Button>
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
                                    No se encontraron parámetros. Puedes poblarlos con datos iniciales.
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
