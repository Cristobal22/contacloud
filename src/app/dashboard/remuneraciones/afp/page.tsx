
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
import type { AfpEntity } from "@/lib/types"
import { collection, writeBatch, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";
import { initialAfpEntities } from "@/lib/seed-data";


export default function AfpEntitiesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const afpEntitiesCollection = React.useMemo(() => 
        firestore ? collection(firestore, `afp-entities`) : null, 
    [firestore]);

    const { data: afpEntities, loading } = useCollection<AfpEntity>({ query: afpEntitiesCollection as any });

    const handleSeedData = async () => {
        if (!firestore) return;
        const collectionPath = `afp-entities`;
        const batch = writeBatch(firestore);
        
        initialAfpEntities.forEach(entityData => {
            const docRef = doc(collection(firestore, collectionPath));
            batch.set(docRef, entityData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Las entidades de AFP han sido pobladas exitosamente.",
            });
        } catch (error) {
            console.error("Error seeding AFP entities: ", error);
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
                        <CardTitle>Entidades AFP</CardTitle>
                        <CardDescription>Gestiona las AFP para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {afpEntities?.length === 0 && !loading && (
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
                            <TableHead>Afp</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="text-right">Cotización Obligatoria</TableHead>
                            <TableHead>Código Previred</TableHead>
                            <TableHead>Régimen Previsional</TableHead>
                            <TableHead>Código Dirección del Trabajo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && afpEntities?.map((entity) => (
                            <TableRow key={entity.id}>
                                <TableCell className="font-medium">{entity.code}</TableCell>
                                <TableCell>{entity.name}</TableCell>
                                <TableCell className="text-right">{entity.mandatoryContribution.toFixed(2).replace('.',',')}%</TableCell>
                                <TableCell>{entity.previredCode}</TableCell>
                                <TableCell>{entity.provisionalRegime}</TableCell>
                                <TableCell>{entity.dtCode}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && afpEntities?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No se encontraron entidades de AFP. Puedes poblarlas con datos iniciales.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
