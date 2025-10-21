
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
import type { TaxParameter } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { initialTaxParameters } from "@/lib/seed-data";
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ParametrosIUTPage() {
    const { data: taxParameters, loading } = useCollection<TaxParameter>({ path: 'tax-parameters' });
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const firestore = useFirestore();
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [isProcessing, setIsProcessing] = React.useState(false);
    
    const tablaIUT = React.useMemo(() => {
        return taxParameters?.filter(p => p.year === year && p.month === month) || [];
    }, [taxParameters, year, month]);

    const handleLoadDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, 'tax-parameters');
        
        const paramsToLoad = initialTaxParameters.filter(p => p.year === year && p.month === month);

        if (paramsToLoad.length === 0) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay parámetros predeterminados para este período.' });
            setIsProcessing(false);
            return;
        }

        paramsToLoad.forEach(paramData => {
            const id = `${paramData.year}-${paramData.month}-${paramData.desde}`;
            const docRef = doc(collectionRef, id);
            batch.set(docRef, { ...paramData, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Parámetros Cargados', description: `Se cargaron ${paramsToLoad.length} tramos de IUT para ${month}/${year}.`});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'tax-parameters',
                operation: 'create',
            }));
        } finally {
            setIsProcessing(false);
        }
    };


    const calculateEffectiveRate = (desde: number, hasta: number, factor: number, rebaja: number) => {
        if (hasta === Infinity || hasta === 0 || factor === 0) return 'Exento';
        const effectiveRate = (((hasta * factor) - rebaja) / hasta) * 100;
        return `${effectiveRate.toFixed(2).replace('.', ',')}%`;
    }
    
    const availableYears = React.useMemo(() => {
        const yearsFromData = [...new Set(initialTaxParameters.map(p => p.year))];
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
                            <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
                        </div>
                        {userProfile?.role === 'Admin' && (
                            <Button onClick={handleLoadDefaults} disabled={isProcessing}>
                                {isProcessing ? 'Cargando...' : 'Cargar Parámetros Predeterminados'}
                            </Button>
                        )}
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
