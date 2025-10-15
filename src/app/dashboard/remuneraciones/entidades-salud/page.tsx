
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
import { collection } from "firebase/firestore";

export default function HealthEntitiesPage() {
    const firestore = useFirestore();
    const healthEntitiesCollection = firestore ? collection(firestore, 'health-entities') : null;
    const { data: healthEntities, loading } = useCollection<HealthEntity>({ query: healthEntitiesCollection });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Entidades de Salud</CardTitle>
                        <CardDescription>Gestiona las Isapres y Fonasa para el cálculo de remuneraciones.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Agregar Entidad
                    </Button>
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
                                    No se encontraron entidades de salud.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
