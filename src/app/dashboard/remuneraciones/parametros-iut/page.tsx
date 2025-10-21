

'use client';

import React from 'react';
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
import type { EconomicIndicator, TaxParameter } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCollection } from '@/firebase';
import { initialTaxParameters } from '@/lib/seed-data';

export default function ParametrosIUTPage() {
    const { data: economicIndicators, loading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    
    const utmForPeriod = React.useMemo(() => {
        return economicIndicators?.find(i => i.year === year && i.month === month)?.utm || 0;
    }, [economicIndicators, year, month]);

    const calculateEffectiveRate = (desdeUTM: number, hastaUTM: number, factor: number, rebajaUTM: number) => {
        if (hastaUTM === Infinity || hastaUTM === 0 || factor === 0) return 'Exento';
        if (utmForPeriod === 0) return 'N/A';
        const hastaCLP = hastaUTM * utmForPeriod;
        const rebajaCLP = rebajaUTM * utmForPeriod;
        const effectiveRate = (((hastaCLP * factor) - rebajaCLP) / hastaCLP) * 100;
        return `${effectiveRate.toFixed(2).replace('.', ',')}%`;
    }
    
    const availableYears = React.useMemo(() => {
        const yearsFromData = [...new Set(economicIndicators?.map(p => p.year) || [])];
        const futureYears = Array.from({length: 3}, (_, i) => currentYear + 1 + i);
        return [...new Set([...yearsFromData, ...futureYears])].sort((a,b) => b - a);
    }, [currentYear, economicIndicators]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                            <CardDescription>
                                Tabla base en UTM para el cálculo del impuesto. La tabla en CLP se calcula usando la UTM del período seleccionado.
                            </CardDescription>
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
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="p-2 rounded-md border bg-muted">
                            <p className="text-sm font-medium text-muted-foreground">UTM del Período</p>
                            <p className="text-lg font-bold">{loading ? 'Cargando...' : `$${utmForPeriod.toLocaleString('es-CL')}`}</p>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                             <h3 className="text-lg font-semibold mb-2">Tabla Base en UTM</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={2} className="text-center border-r">Rango RLI (UTM)</TableHead>
                                        <TableHead className="text-center">Factor</TableHead>
                                        <TableHead className="text-center">Rebaja (UTM)</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center">Desde</TableHead>
                                        <TableHead className="text-center border-r">Hasta</TableHead>
                                        <TableHead></TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialTaxParameters.map((item, index) => (
                                        <TableRow key={`base-${index}`}>
                                            <TableCell className="text-right">{item.desdeUTM.toLocaleString('es-CL')}</TableCell>
                                            <TableCell className="text-right border-r">
                                                {item.hastaUTM === Infinity ? 'Y más' : item.hastaUTM.toLocaleString('es-CL')}
                                            </TableCell>
                                            <TableCell className="text-center">{item.factor === 0 ? 'Exento' : item.factor.toString().replace('.',',')}</TableCell>
                                            <TableCell className="text-right">{item.rebajaUTM.toLocaleString('es-CL')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold mb-2">Tabla Calculada en CLP (Referencial)</h3>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={2} className="text-center border-r">Rango RLI (CLP)</TableHead>
                                        <TableHead className="text-center">Factor</TableHead>
                                        <TableHead className="text-center">Rebaja (CLP)</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center">Desde</TableHead>
                                        <TableHead className="text-center border-r">Hasta</TableHead>
                                        <TableHead></TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center">Cargando UTM...</TableCell></TableRow>
                                    ) : utmForPeriod === 0 ? (
                                         <TableRow><TableCell colSpan={4} className="text-center">No hay UTM para este período.</TableCell></TableRow>
                                    ) : (
                                        initialTaxParameters.map((item, index) => (
                                            <TableRow key={`clp-${index}`}>
                                                <TableCell className="text-right">${Math.round(item.desdeUTM * utmForPeriod).toLocaleString('es-CL')}</TableCell>
                                                <TableCell className="text-right border-r">
                                                    {item.hastaUTM === Infinity ? 'Y más' : `$${Math.round(item.hastaUTM * utmForPeriod).toLocaleString('es-CL')}`}
                                                </TableCell>
                                                <TableCell className="text-center">{item.factor === 0 ? 'Exento' : item.factor.toString().replace('.',',')}</TableCell>
                                                <TableCell className="text-right">${Math.round(item.rebajaUTM * utmForPeriod).toLocaleString('es-CL')}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </>
    )
}
