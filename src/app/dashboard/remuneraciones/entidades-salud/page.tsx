
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
import { useCollection } from "@/firebase"
import type { HealthEntity } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area"

export default function HealthEntitiesPage() {
    const { toast } = useToast();
    const { data: healthEntities, loading } = useCollection<HealthEntity>({ path: 'health-entities' });

    const handleUpdateParameters = () => {
        toast({
            title: "Actualización de Parámetros",
            description: "Para actualizar estos valores, modifica el archivo 'src/lib/seed-data.ts' en el código fuente.",
            duration: 5000,
        });
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
                        <Button size="sm" className="gap-1" onClick={handleUpdateParameters}>
                            Actualizar Parámetros
                        </Button>
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
                                        No se encontraron entidades de salud. Contacta al administrador para poblarlas.
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
