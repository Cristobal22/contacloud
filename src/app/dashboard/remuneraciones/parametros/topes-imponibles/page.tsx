
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
        
        const capToLoad = initialTaxableCaps.find(p => p.year === year);

        if (!capToLoad) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: `No hay topes predeterminados para el año ${year}.` });
            setIsProcessing(false);
            return;
        }

        const id = capToLoad.year.toString();
        const docRef = doc(collectionRef, id);
        batch.set(docRef, { ...capToLoad, id }, { merge: true });

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
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Topes Imponibles Anuales</CardTitle>
                            <CardDescription>Topes para el cálculo de cotizaciones previsionales (AFP, Salud, AFC).</CardDescription>
                        </div>
                        {userProfile?.role === 'Admin' && (
                            <div className="flex items-center gap-4">
                                <Select value={year.toString()} onValueChange={val => setYear(Number(val))}>
                                    <SelectTrigger id="year-select" className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 10 }, (_, i) => currentYear - i).map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleLoadDefaults} disabled={isProcessing}>
                                    {isProcessing ? 'Cargando...' : `Cargar para ${year}`}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Año</TableHead>
                                <TableHead className="text-right">Tope AFP y Salud (UF)</TableHead>
                                <TableHead className="text-right">Tope Seguro Cesantía (UF)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                                </TableRow>
                            )}
                            {!loading && taxableCaps?.sort((a,b) => b.year - a.year).map((cap) => (
                                <TableRow key={cap.id}>
                                    <TableCell className="font-medium">{cap.year}</TableCell>
                                    <TableCell className="text-right">{cap.afpCap.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right">{cap.afcCap.toLocaleString('es-CL')}</TableCell>
                                </TableRow>
                            ))}
                             {!loading && (!taxableCaps || taxableCaps.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No se encontraron topes imponibles. Un administrador debe cargarlos.
                                    </TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}

    