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
import { useUser } from "@/firebase"
import type { TaxParameter } from "@/lib/types"
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { initialTaxParameters } from "@/lib/seed-data";

export default function ParametrosIUTPage() {
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);

    const [tablaIUT, setTablaIUT] = React.useState<TaxParameter[]>([]);
    const [loading, setLoading] = React.useState(false);

    const handleViewPeriod = () => {
        setLoading(true);
        const filteredData = initialTaxParameters.filter(p => p.year === year && p.month === month) as TaxParameter[];
        setTablaIUT(filteredData);
        setLoading(false);
    };

    // Load initial data on first render
    React.useEffect(() => {
        handleViewPeriod();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const calculateEffectiveRate = (desde: number, hasta: number, factor: number, rebaja: number) => {
        if (hasta === Infinity || hasta === 0 || factor === 0) return 'Exento';
        const effectiveRate = (((hasta * factor) - rebaja) / hasta) * 100;
        return `${effectiveRate.toFixed(2).replace('.', ',')}%`;
    }
    
    const availableYears = React.useMemo(() => {
        const yearsFromData = [...new Set(initialTaxParameters.map(p => p.year))];
        // Add a few future years for selection flexibility
        const futureYears = Array.from({length: 3}, (_, i) => currentYear + 1 + i);
        return [...new Set([...yearsFromData, ...futureYears])].sort((a,b) => b - a);
    }, [currentYear]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                            <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente. Estos valores son globales y fijos.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-end gap-4 pt-4">
                        <div className="space-y-2">
                             <Label htmlFor="month">Mes</Label>
                            <Select value={month.toString()} onValueChange={val => setMonth(Number(val))}>
                                <SelectTrigger id="month" className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i+1} value={(i+1).toString()}>
                                            {format(new Date(0, i), 'MMMM', { locale: es })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="year">Año</Label>
                            <Select value={year.toString()} onValueChange={val => setYear(Number(val))}>
                                <SelectTrigger id="year" className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleViewPeriod}><Eye className="mr-2 h-4 w-4" /> Ver Período</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead colSpan={2} className="text-center border-r">Monto de la renta líquida imponible</TableHead>
                                <TableHead className="text-center">Factor</TableHead>
                                <TableHead className="text-center">Cantidad a rebajar</TableHead>
                                <TableHead className="text-center">Tasa de Impuesto Efectiva</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead className="text-center">Desde</TableHead>
                                <TableHead className="text-center border-r">Hasta</TableHead>
                                <TableHead></TableHead>
                                <TableHead></TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && tablaIUT && tablaIUT.length > 0 ? (
                                tablaIUT.sort((a, b) => a.desde - b.desde).map((item, index) => (
                                    <TableRow key={`${item.year}-${item.month}-${index}`}>
                                        <TableCell className="text-right">${item.desde.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right border-r">
                                            {item.hasta === Infinity || item.hasta >= 999999999 ? 'Y más' : `$${item.hasta.toLocaleString('es-CL')}`}
                                        </TableCell>
                                        <TableCell className="text-center">{item.factor === 0 ? 'Exento' : item.factor.toString().replace('.',',')}</TableCell>
                                        <TableCell className="text-right">${item.rebaja.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-center">{calculateEffectiveRate(item.desde, item.hasta, item.factor, item.rebaja)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No se encontraron parámetros de IUT para el período seleccionado.
                                    </TableCell>
                                </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
