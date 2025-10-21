
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
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { FamilyAllowanceParameter } from "@/lib/types"
import { useToast } from '@/hooks/use-toast';
import { initialFamilyAllowanceParameters } from '@/lib/seed-data';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ParametrosAsigFamiliarPage() {
    const { data: tramosAsignacion, loading } = useCollection<FamilyAllowanceParameter>({ path: 'family-allowance-parameters' });
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const firestore = useFirestore();
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleLoadDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, 'family-allowance-parameters');
        
        const paramsToLoad = initialFamilyAllowanceParameters.filter(p => p.year === year && p.month === month);

        if (paramsToLoad.length === 0) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay parámetros predeterminados para este período.' });
            setIsProcessing(false);
            return;
        }

        paramsToLoad.forEach(paramData => {
            const id = `${paramData.year}-${paramData.month}-${paramData.tramo}`;
            const docRef = doc(collectionRef, id);
            batch.set(docRef, { ...paramData, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Parámetros Cargados', description: `Se cargaron ${paramsToLoad.length} tramos para ${month}/${year}.`});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'family-allowance-parameters',
                operation: 'create',
            }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const filteredTramos = React.useMemo(() => {
        return tramosAsignacion?.filter(t => t.year === year && t.month === month) || [];
    }, [tramosAsignacion, year, month]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Parámetros de Asignación Familiar</CardTitle>
                            <CardDescription>Tramos y montos para el cálculo de la asignación familiar.</CardDescription>
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
                                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
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
                            {!loading && filteredTramos.map((tramo) => (
                                <TableRow key={tramo.id}>
                                    <TableCell className="font-medium">{tramo.tramo}</TableCell>
                                    <TableCell className="text-right">${tramo.desde.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">{tramo.hasta === Infinity || tramo.hasta >= 999999999 ? 'Y más' : `$${tramo.hasta.toLocaleString('es-CL')}`}</TableCell>
                                    <TableCell className="text-right font-medium">${tramo.monto.toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                             {!loading && filteredTramos.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No se encontraron parámetros para el período seleccionado.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación actual para el período seleccionado.</p>
                </CardContent>
            </Card>
        </>
    )
}
