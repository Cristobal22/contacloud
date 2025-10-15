
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

const tablaIUT = [
    { tramo: 'Exento', desde: 0, hasta: 13.5, factor: 0, rebaja: 0 },
    { tramo: '4%', desde: 13.5, hasta: 30, factor: 0.04, rebaja: 0.54 },
    { tramo: '8%', desde: 30, hasta: 50, factor: 0.08, rebaja: 1.74 },
    { tramo: '13.5%', desde: 50, hasta: 70, factor: 0.135, rebaja: 4.49 },
    { tramo: '23%', desde: 70, hasta: 90, factor: 0.23, rebaja: 11.14 },
    { tramo: '30.4%', desde: 90, hasta: 120, factor: 0.304, rebaja: 17.8 },
    { tramo: '35%', desde: 120, hasta: 310, factor: 0.35, rebaja: 23.32 },
    { tramo: '40%', desde: 310, hasta: Infinity, factor: 0.4, rebaja: 38.82 },
];

export default function ParametrosIUTPage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                        <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
                    </div>
                     <Button size="sm">Actualizar Tabla</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Renta (UTM)</TableHead>
                            <TableHead>Tasa de Impuesto</TableHead>
                            <TableHead className="text-right">Cantidad a Rebajar (UTM)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tablaIUT.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{`Más de ${item.desde.toLocaleString('es-CL')} ${item.hasta !== Infinity ? `hasta ${item.hasta.toLocaleString('es-CL')}`: ''}`}</TableCell>
                                <TableCell>{`${item.factor * 100}%`}</TableCell>
                                <TableCell className="text-right font-medium">{item.rebaja.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">Valores en Unidades Tributarias Mensuales (UTM).</p>
            </CardContent>
        </Card>
    )
}
