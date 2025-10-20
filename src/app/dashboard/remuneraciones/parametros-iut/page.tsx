
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
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { TaxParameter } from "@/lib/types"
import React from "react";
import { collection, query, where, writeBatch, getDocs, doc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { initialTaxParameters } from "@/lib/seed-data";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Trash2, UploadCloud, Eye } from "lucide-react";

export default function ParametrosIUTPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(2025);
    const [month, setMonth] = React.useState(1);

    const [displayYear, setDisplayYear] = React.useState(year);
    const [displayMonth, setDisplayMonth] = React.useState(month);

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState<{type: 'load' | 'delete', open: boolean}>({type: 'load', open: false});
    
    const taxParamsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'tax-parameters'),
            where('year', '==', displayYear),
            where('month', '==', displayMonth)
        );
    }, [firestore, displayYear, displayMonth]);

    const { data: tablaIUT, loading } = useCollection<TaxParameter>({ 
      query: taxParamsQuery,
    });

    const handleViewPeriod = () => {
        setDisplayYear(year);
        setDisplayMonth(month);
    };

    const calculateEffectiveRate = (desde: number, hasta: number, factor: number, rebaja: number) => {
        if (hasta === Infinity || hasta === 0 || factor === 0) return 'Exento';
        const effectiveRate = (((hasta * factor) - rebaja) / hasta) * 100;
        return `${effectiveRate.toFixed(2).replace('.', ',')}%`;
    }

    const handleLoadDefaults = async () => {
        if (!firestore) return;

        setIsSubmitting(true);
        
        // Try to find params for the selected period
        let paramsForPeriod = initialTaxParameters.filter(p => p.year === year && p.month === month);

        // If not found, fall back to the most recent available year (2024 in this case) for that month
        if (paramsForPeriod.length === 0) {
            const fallbackYear = 2024;
            paramsForPeriod = initialTaxParameters
                .filter(p => p.year === fallbackYear && p.month === month)
                .map(p => ({ ...p, year: year })); // Remap the year to the selected year
        }

        if (paramsForPeriod.length === 0) {
            toast({
                variant: "destructive",
                title: "Sin Datos",
                description: `No hay parámetros predefinidos en el código para el mes seleccionado en ningún año.`,
            });
            setIsSubmitting(false);
            setIsDialogOpen({type: 'load', open: false});
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const collectionRef = collection(firestore, 'tax-parameters');
            
            // First, delete existing params for the period
            const existingQuery = query(collectionRef, where('year', '==', year), where('month', '==', month));
            const existingSnapshot = await getDocs(existingQuery);
            existingSnapshot.forEach(doc => batch.delete(doc.ref));

            // Then, add the new ones
            paramsForPeriod.forEach(param => {
                const newDocRef = doc(collectionRef);
                batch.set(newDocRef, param);
            });

            await batch.commit();
            toast({
                title: "Parámetros Cargados",
                description: `Se han cargado los parámetros para el período ${month}/${year}.`,
            });
            // Refresh view
            handleViewPeriod();
        } catch (error) {
            console.error("Error loading tax parameters:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'tax-parameters',
                operation: 'create',
            }));
        } finally {
            setIsSubmitting(false);
            setIsDialogOpen({type: 'load', open: false});
        }
    };

    const handleDeletePeriod = async () => {
        if (!firestore) return;
        
        setIsSubmitting(true);
        try {
            const collectionRef = collection(firestore, 'tax-parameters');
            const q = query(collectionRef, where('year', '==', year), where('month', '==', month));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay parámetros que eliminar para este período.' });
                return;
            }

            const batch = writeBatch(firestore);
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast({
                title: "Parámetros Eliminados",
                description: `Se han eliminado los parámetros para el período ${month}/${year}.`,
                variant: 'destructive'
            });
             // Refresh view
            handleViewPeriod();
        } catch (error) {
            console.error("Error deleting tax parameters:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'tax-parameters',
                operation: 'delete',
            }));
        } finally {
             setIsSubmitting(false);
             setIsDialogOpen({type: 'delete', open: false});
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                            <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente. Estos son los valores globales.</CardDescription>
                        </div>
                        {userProfile?.role === 'Admin' && (
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => setIsDialogOpen({type: 'delete', open: true})} disabled={isSubmitting}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Eliminar del Período
                                </Button>
                                <Button size="sm" onClick={() => setIsDialogOpen({type: 'load', open: true})} disabled={isSubmitting}>
                                    <UploadCloud className="mr-2 h-4 w-4"/> Cargar Predeterminados
                                </Button>
                            </div>
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
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <SelectItem key={currentYear + 5 - i} value={(currentYear + 5 - i).toString()}>
                                            {currentYear + 5 - i}
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
                                tablaIUT.sort((a, b) => a.desde - b.desde).map((item) => (
                                    <TableRow key={item.id}>
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

            <AlertDialog open={isDialogOpen.open && isDialogOpen.type === 'load'} onOpenChange={(open) => setIsDialogOpen({type: 'load', open})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la carga de parámetros?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cargará los parámetros predefinidos para el período {month}/{year}. Si ya existen datos para este período, serán reemplazados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLoadDefaults} disabled={isSubmitting}>
                            {isSubmitting ? 'Cargando...' : 'Sí, Cargar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDialogOpen.open && isDialogOpen.type === 'delete'} onOpenChange={(open) => setIsDialogOpen({type: 'delete', open})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente todos los parámetros de IUT para el período {month}/{year}. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDeletePeriod} disabled={isSubmitting}>
                            {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
