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
import { collection } from "firebase/firestore";

export default function AfpEntitiesPage() {
    const firestore = useFirestore();
    const afpEntitiesCollection = firestore ? collection(firestore, 'afp-entities') : null;
    const { data: afpEntities, loading } = useCollection<AfpEntity>({ query: afpEntitiesCollection });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Entidades AFP</CardTitle>
                        <CardDescription>Gestiona las AFP para el cálculo de remuneraciones.</CardDescription>
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
                                    No se encontraron entidades de AFP.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
