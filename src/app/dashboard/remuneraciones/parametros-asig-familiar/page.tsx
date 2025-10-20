
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
import { useCollection } from "@/firebase"
import type { FamilyAllowanceParameter } from "@/lib/types"

export default function ParametrosAsigFamiliarPage() {
    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ path: 'family-allowance-parameters' });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                            <CardDescription>Tramos y montos para el cálculo de la asignación familiar.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tramo</TableHead>
                                <TableHead className="text-right">Renta Desde</TableHead>
                                <TableHead className="text-right">Renta Hasta</TableHead>
                                <TableHead className="text-right">Monto del Beneficio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && tramosAsignacion?.map((tramo) => (
                                <TableRow key={tramo.id}>
                                    <TableCell className="font-medium">{tramo.tramo}</TableCell>
                                    <TableCell className="text-right">${tramo.desde.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">{tramo.hasta === Infinity || tramo.hasta >= 999999999 ? 'Y más' : `$${tramo.hasta.toLocaleString('es-CL')}`}</TableCell>
                                    <TableCell className="text-right font-medium">${tramo.monto.toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                             {!loading && tramosAsignacion?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No se encontraron parámetros. Un administrador debe poblarlos.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual.</p>
                </CardContent>
            </Card>
        </>
    )
}
