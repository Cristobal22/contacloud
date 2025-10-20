
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCollection } from "@/firebase"
import type { AfpEntity } from "@/lib/types"

export default function AfpEntitiesPage() {
    const { data: afpEntities, loading } = useCollection<AfpEntity>({ path: 'afp-entities' });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Entidades AFP</CardTitle>
                            <CardDescription>Gestiona las AFP para el cálculo de remuneraciones.</CardDescription>
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
        </>
    )
}
