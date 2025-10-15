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

const tramosAsignacion = [
    { tramo: 'A', desde: 0, hasta: 429899, monto: 20328 },
    { tramo: 'B', desde: 429900, hasta: 627913, monto: 12475 },
    { tramo: 'C', desde: 627914, hasta: 979330, monto: 3942 },
    { tramo: 'D', desde: 979331, hasta: Infinity, monto: 0 },
];

export default function ParametrosAsigFamiliarPage() {
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
                        {tramosAsignacion.map((tramo) => (
                            <TableRow key={tramo.tramo}>
                                <TableCell className="font-medium">{tramo.tramo}</TableCell>
                                <TableCell className="text-right">${tramo.desde.toLocaleString('es-CL')}</TableCell>
                                <TableCell className="text-right">{tramo.hasta === Infinity ? 'Y más' : `$${tramo.hasta.toLocaleString('es-CL')}`}</TableCell>
                                <TableCell className="text-right font-medium">${tramo.monto.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual.</p>
            </CardContent>
        </Card>
    )
}
