
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { AfpEntity } from "@/lib/types"
import { useToast } from '@/hooks/use-toast';
import { initialAfpEntities } from '@/lib/seed-data';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { Eye } from 'lucide-react';

export default function AfpEntitiesPage() {
    const { data: afpEntities, loading } = useCollection<AfpEntity>({ path: 'afp-entities' });
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
        const collectionRef = collection(firestore, 'afp-entities');
        
        const entitiesToLoad = initialAfpEntities.filter(p => p.year === year && p.month === month);

        if (entitiesToLoad.length === 0) {
            toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay parámetros predeterminados para este período.' });
            setIsProcessing(false);
            return;
        }

        entitiesToLoad.forEach(entityData => {
            const id = `${entityData.year}-${entityData.month}-${entityData.previredCode}`;
            const docRef = doc(collectionRef, id);
            batch.set(docRef, { ...entityData, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Parámetros Cargados', description: `Se cargaron ${entitiesToLoad.length} entidades de AFP para ${month}/${year}.`});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'afp-entities',
                operation: 'create',
            }));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const filteredEntities = React.useMemo(() => {
        return afpEntities?.filter(e => e.year === year && e.month === month) || [];
    }, [afpEntities, year, month]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Entidades AFP</CardTitle>
                            <CardDescription>Gestiona las AFP para el cálculo de remuneraciones.</CardDescription>
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
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Cotización Obligatoria</TableHead>
                                    <TableHead>Código Previred</TableHead>
                                    <TableHead>Régimen Previsional</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                                    </TableRow>
                                )}
                                {!loading && filteredEntities.map((entity) => (
                                    <TableRow key={entity.id}>
                                        <TableCell className="font-medium">{entity.name}</TableCell>
                                        <TableCell className="text-right">{entity.mandatoryContribution.toFixed(2).replace('.',',')}%</TableCell>
                                        <TableCell>{entity.previredCode}</TableCell>
                                        <TableCell>{entity.provisionalRegime}</TableCell>
                                    </TableRow>
                                ))}
                                {!loading && filteredEntities.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No se encontraron entidades para el período seleccionado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </>
    )
}
