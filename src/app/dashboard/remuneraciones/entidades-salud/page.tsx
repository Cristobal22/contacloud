
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCollection } from "@/firebase"
import type { HealthEntity } from "@/lib/types"

export default function HealthEntitiesPage() {
    const { data: healthEntities, loading } = useCollection<HealthEntity>({ path: 'health-entities' });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Entidades de Salud</CardTitle>
                            <CardDescription>Gestiona las Isapres y Fonasa para el cálculo de remuneraciones.</CardDescription>
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
                                            No se encontraron entidades de salud. Un administrador debe poblarlas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </>
    )
}
