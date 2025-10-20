
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
import { useCollection } from "@/firebase"
import type { Institution } from "@/lib/types"

export default function InstitucionesPage() {
    const { data: institutions, loading } = useCollection<Institution>({ path: 'institutions' });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Instituciones Previsionales y de Salud</CardTitle>
                            <CardDescription>Gestiona las instituciones para el cálculo de remuneraciones.</CardDescription>
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
