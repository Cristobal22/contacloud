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
import { useCollection, useFirestore } from "@/firebase"
import type { HealthEntity } from "@/lib/types"
import { collection, writeBatch, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";

const initialHealthEntities: Omit<HealthEntity, 'id'>[] = [
    { code: "001", name: "FONASA", mandatoryContribution: 7.00, previredCode: "01", dtCode: "01" },
    { code: "067", name: "CONSALUD", mandatoryContribution: 7.00, previredCode: "18", dtCode: "02" },
    { code: "099", name: "CRUZBLANCA", mandatoryContribution: 7.00, previredCode: "07", dtCode: "03" },
    { code: "081", name: "NUEVA MASVIDA", mandatoryContribution: 7.00, previredCode: "31", dtCode: "04" },
    { code: "078", name: "BANMEDICA", mandatoryContribution: 7.00, previredCode: "04", dtCode: "05" },
    { code: "080", name: "VIDA TRES", mandatoryContribution: 7.00, previredCode: "17", dtCode: "06" },
    { code: "076", name: "COLMENA", mandatoryContribution: 7.00, previredCode: "02", dtCode: "07" },
];

export default function HealthEntitiesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const healthEntitiesCollection = React.useMemo(() => 
        firestore ? collection(firestore, 'health-entities') : null, 
    [firestore]);
    
    const { data: healthEntities, loading, refetch } = useCollection<HealthEntity>({ query: healthEntitiesCollection });

    const handleSeedData = async () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        initialHealthEntities.forEach(entityData => {
            const docRef = doc(collection(firestore, 'health-entities'));
            batch.set(docRef, entityData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Las entidades de salud han sido pobladas exitosamente.",
            });
            refetch(); // Refetch the data to update the table
        } catch (error) {
            console.error("Error seeding health entities: ", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'health-entities',
                operation: 'create',
            }));
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Entidades de Salud</CardTitle>
                        <CardDescription>Gestiona las Isapres y Fonasa para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {healthEntities?.length === 0 && !loading && (
                             <Button size="sm" className="gap-1" onClick={handleSeedData}>
                                Poblar Datos Iniciales
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre Isapre</TableHead>
                            <TableHead className="text-right">Cotización Obligatoria</TableHead>
                            <TableHead>Código Previred</TableHead>
                            <TableHead>Código Dirección del Trabajo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && healthEntities?.map((entity) => (
                            <TableRow key={entity.id}>
                                <TableCell className="font-medium">{entity.code}</TableCell>
                                <TableCell>{entity.name}</TableCell>
                                <TableCell className="text-right">{entity.mandatoryContribution.toFixed(2)}%</TableCell>
                                <TableCell>{entity.previredCode}</TableCell>
                                <TableCell>{entity.dtCode}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && healthEntities?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No se encontraron entidades de salud. Puedes poblarlas con datos iniciales.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
