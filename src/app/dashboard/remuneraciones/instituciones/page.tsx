
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
import { Badge } from "@/components/ui/badge"
import { useCollection } from "@/firebase"
import type { AfpEntity, HealthEntity } from "@/lib/types"

export default function InstitucionesPage() {
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });

    const loading = afpLoading || healthLoading;
    const institutions = [...(afpEntities || []), ...(healthEntities || [])];

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                            <CardDescription>Visualiza las instituciones cargadas en el sistema.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Período</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && institutions?.map((inst) => (
                                <TableRow key={inst.id}>
                                    <TableCell className="font-medium">{inst.name}</TableCell>
                                    <TableCell><Badge variant="secondary">{'mandatoryContribution' in inst ? (inst.name === 'FONASA' ? 'Salud' : 'AFP') : 'Salud'}</Badge></TableCell>
                                    <TableCell>{inst.year}-{inst.month}</TableCell>
                                </TableRow>
                            ))}
                             {!loading && institutions?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No se encontraron instituciones. Un administrador debe poblarlas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
