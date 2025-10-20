
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
import type { TaxParameter } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";


export default function ParametrosIUTPage() {
    const { toast } = useToast();
    const { data: tablaIUT, loading } = useCollection<TaxParameter>({ path: 'tax-parameters' });

    const handleUpdateParameters = () => {
        toast({
            title: "Actualización de Parámetros",
            description: "Para actualizar estos valores, modifica el archivo 'src/lib/seed-data.ts' en el código fuente.",
            duration: 5000,
        });
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                        <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
                    </div>
                     <Button size="sm" onClick={handleUpdateParameters}>Actualizar Parámetros</Button>
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
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                            </TableRow>
                        )}
                        {!loading && tablaIUT?.sort((a, b) => a.desde - b.desde).map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{`Más de ${item.desde.toLocaleString('es-CL')} ${item.hasta !== Infinity && item.hasta < 999999999 ? `hasta ${item.hasta.toLocaleString('es-CL')}`: ''}`}</TableCell>
                                <TableCell>{`${(item.factor * 100).toFixed(1).replace('.',',')}%`}</TableCell>
                                <TableCell className="text-right font-medium">{item.rebaja.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        ))}
                         {!loading && tablaIUT?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    No se encontraron parámetros de IUT. Contacta al administrador para poblarlos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">Valores en Unidades Tributarias Mensuales (UTM).</p>
            </CardContent>
        </Card>
    )
}

