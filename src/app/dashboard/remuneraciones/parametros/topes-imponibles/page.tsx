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
import type { TaxableCap } from "@/lib/types"
import { useToast } from '@/hooks/use-toast';
import { initialTaxableCaps } from '@/lib/seed-data';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TopesImponiblesPage() {
    const { data: taxableCaps, loading } = useCollection<TaxableCap>({ path: 'taxable-caps' });
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const firestore = useFirestore();
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();

    const [year, setYear] = React.useState(currentYear);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleLoadDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, 'taxable-caps');
        
        const capsToLoad = initialTaxableCaps.filter(p => p.year === year);

        if (capsToLoad.length === 0) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay topes predeterminados para este año.' });
            setIsProcessing(false);
            return;
        }

        capsToLoad.forEach(capData => {
            const id = capData.year.toString();
            const docRef = doc(collectionRef, id);
            batch.set(docRef, { ...capData, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Parámetros Cargados', description: `Se cargaron los topes imponibles para el año ${year}.`});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'taxable-caps',
                operation: 'create',
            }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const filteredCaps = React.useMemo(() => {
        return taxableCaps?.filter(t => t.year === year) || [];
    }, [taxableCaps, year]);
    
    const allYears = Array.from(new Set(initialTaxableCaps.map(c => c.year))).sort((a,b) => b-a);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Topes Imponibles Anuales</CardTitle>
                            <CardDescription>Valores máximos en UF para el cálculo de cotizaciones previsionales.</CardDescription>
                        </div>
                        {userProfile?.role === 'Admin' && (
                            <Button onClick={handleLoadDefaults} disabled={isProcessing}>
                                {isProcessing ? 'Cargando...' : `Cargar Topes para ${year}`}
                            </Button>
                        )}
                    </div>
                     <div className="flex items-end gap-4 pt-4">
                        <div className="space-y-2">
                             <Label htmlFor="year">Año</Label>
                            <Select value={year.toString()} onValueChange={val => setYear(Number(val))}>
                                <SelectTrigger id="year" className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {allYears.map(y => (
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
                                <TableHead>Tope</TableHead>
                                <TableHead className="text-right">Valor en UF</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && filteredCaps.length > 0 ? (
                                <>
                                <TableRow>
                                    <TableCell className="font-medium">Tope AFP, Salud y SIS</TableCell>
                                    <TableCell className="text-right">{filteredCaps[0].afpCap.toLocaleString('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1})} UF</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell className="font-medium">Tope Seguro de Cesantía (AFC)</TableCell>
                                    <TableCell className="text-right">{filteredCaps[0].afcCap.toLocaleString('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1})} UF</TableCell>
                                </TableRow>
                                </>
                            ) : (
                                !loading && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">
                                        No se encontraron topes para el año seleccionado.
                                    </TableCell>
                                </TableRow>
                                )
                             )}
                        </TableBody>
                    </Table>
                     <p className="text-xs text-muted-foreground mt-4">Valores vigentes según la legislación para el año seleccionado.</p>
                </CardContent>
            </Card>
        </>
    )
}
