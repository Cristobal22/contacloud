
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
import { collection, doc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import React from "react";
import { initialInstitutions } from "@/lib/seed-data";


export default function InstitucionesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const institutionsCollection = React.useMemo(() => 
        firestore ? collection(firestore, `institutions`) : null, 
    [firestore]);

    const { data: institutions, loading } = useCollection<Institution>({ query: institutionsCollection as any });

    const handleSeedData = async () => {
        if (!firestore) return;
        const collectionPath = `institutions`;
        const batch = writeBatch(firestore);
        
        initialInstitutions.forEach(instData => {
            const docRef = doc(collection(firestore, collectionPath));
            batch.set(docRef, instData);
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Las instituciones han sido pobladas exitosamente.",
            });
        } catch (error) {
            console.error("Error seeding institutions: ", error);
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
                        <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                        <CardDescription>Gestiona las instituciones para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {institutions?.length === 0 && !loading && (
                            <Button size="sm" className="gap-1" onClick={handleSeedData}>
                                Poblar Datos Iniciales
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
                                    No se encontraron instituciones. Puedes poblarlas con datos iniciales.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
