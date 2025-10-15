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
import { useCollection, useFirestore } from "@/firebase"
import type { FamilyAllowanceParameter } from "@/lib/types"
import { collection } from "firebase/firestore";

export default function ParametrosAsigFamiliarPage() {
    const firestore = useFirestore();
    const paramsCollection = firestore ? collection(firestore, 'family-allowance-parameters') : null;
    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ query: paramsCollection });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                        <CardDescription>Gestiona los tramos y montos para el cálculo de la asignación familiar.</CardDescription>
                    </div>
                    <Button size="sm">Actualizar Tramos</Button>
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
                                <TableCell className="text-right">{tramo.hasta === Infinity || tramo.hasta === 0 ? 'Y más' : `$${tramo.hasta.toLocaleString('es-CL')}`}</TableCell>
                                <TableCell className="text-right font-medium">${tramo.monto.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && tramosAsignacion?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    No se encontraron parámetros de asignación familiar.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
                 <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual.</p>
            </CardContent>
        </Card>
    )
}
