
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
import { initialHealthEntities } from "@/lib/seed-data";
import { ScrollArea } from "@/components/ui/scroll-area"

export default function HealthEntitiesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const { data: healthEntities, loading } = useCollection<HealthEntity>({ path: 'health-entities' });

    const handleSeedData = async () => {
        if (!firestore) return;
        const collectionPath = `health-entities`;
        const batch = writeBatch(firestore);
        
        initialHealthEntities.forEach(entityData => {
            const docRef = doc(collection(firestore, collectionPath));
            batch.set(docRef, entityData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Las entidades de salud han sido pobladas exitosamente.",
            });
        } catch (error) {
            console.error("Error seeding health entities: ", error);
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
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre Isapre</TableHead>
                                <TableHead className="text-right">Cotización Obligatoria</TableHead>
                                <TableHead>Código Previred</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && healthEntities?.map((entity) => (
                                <TableRow key={entity.id}>
                                    <TableCell className="font-medium">{entity.name}</TableCell>
                                    <TableCell className="text-right">{entity.mandatoryContribution.toFixed(2)}%</TableCell>
                                    <TableCell>{entity.previredCode}</TableCell>
                                </TableRow>
                            ))}
                            {!loading && healthEntities?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No se encontraron entidades de salud. Puedes poblarlas con datos iniciales.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
