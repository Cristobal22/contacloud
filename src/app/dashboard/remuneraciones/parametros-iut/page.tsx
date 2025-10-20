
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
import { Button, buttonVariants } from "@/components/ui/button"
import { useCollection, useFirestore, useUser } from "@/firebase"
import type { TaxParameter } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { initialTaxParameters } from "@/lib/seed-data";
import { writeBatch, collection, getDocs, doc, query, where, deleteDoc } from "firebase/firestore";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ParametrosIUTPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const taxParamsQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'tax-parameters'),
            where('year', '==', year),
            where('month', '==', month)
        );
    }, [firestore, year, month]);

    const { data: tablaIUT, loading } = useCollection<TaxParameter>({ query: taxParamsQuery });

    const handleLoadPredefined = async () => {
        if (!firestore) return;
        setIsUpdateDialogOpen(false);

        const collectionRef = collection(firestore, 'tax-parameters');
        const batch = writeBatch(firestore);

        try {
            // Add new documents from seed data for the selected period
            const newParamsForPeriod = initialTaxParameters.map(param => ({
                ...param,
                year,
                month,
            }));
            
            newParamsForPeriod.forEach(param => {
                const docRef = doc(collectionRef, `${year}-${month.toString().padStart(2, '0')}-${param.tramo.replace(/\s+/g, '-')}`);
                batch.set(docRef, param, { merge: true });
            });

            await batch.commit();
            toast({
                title: 'Parámetros Cargados',
                description: `Los parámetros de IUT para ${month}/${year} se han cargado correctamente.`,
            });
        } catch (error) {
            console.error('Error cargando parámetros IUT:', error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar',
                description: 'No se pudieron cargar los parámetros. Revisa los permisos de Firestore.',
            });
        }
    };

    const handleDeletePeriod = async () => {
         if (!firestore) return;
        setIsDeleteDialogOpen(false);

        const collectionRef = collection(firestore, 'tax-parameters');
        const q = query(collectionRef, where('year', '==', year), where('month', '==', month));
        const batch = writeBatch(firestore);
        
        try {
             const existingDocs = await getDocs(q);
             if (existingDocs.empty) {
                toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay parámetros para eliminar en este período.' });
                return;
             }
            existingDocs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            toast({
                title: 'Parámetros Eliminados',
                description: `Los parámetros de IUT para ${month}/${year} han sido eliminados.`,
                variant: 'destructive'
            });
        } catch (error) {
             console.error('Error eliminando parámetros IUT:', error);
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: 'No se pudieron eliminar los parámetros.',
            });
        }
    };
    
    const calculateEffectiveRate = (desde: number, hasta: number, factor: number, rebaja: number) => {
        if (hasta === Infinity || hasta === 0 || factor === 0) return 'Exento';
        const effectiveRate = (((hasta * factor) - rebaja) / hasta) * 100;
        return `${effectiveRate.toFixed(2).replace('.', ',')}%`;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Parámetros del Impuesto Único de Segunda Categoría (IUT)</CardTitle>
                            <CardDescription>Tabla para el cálculo del impuesto único al trabajo dependiente.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={!user}>Eliminar del Período</Button>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción borrará permanentemente los parámetros de IUT para el período seleccionado ({month}/{year}).
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeletePeriod} className={buttonVariants({ variant: "destructive" })}>Sí, eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                                <Button onClick={() => setIsUpdateDialogOpen(true)} disabled={!user}>Cargar Parámetros Predeterminados</Button>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmas la carga?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción cargará los parámetros predeterminados del sistema para el período seleccionado ({month}/{year}). Si ya existen datos, serán sobrescritos.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleLoadPredefined}>Sí, cargar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                            {currentYear-i}
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
                            {!loading && tablaIUT?.sort((a, b) => a.desde - b.desde).map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-right">${item.desde.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right border-r">
                                        {item.hasta === Infinity || item.hasta >= 999999999 ? 'Y más' : `$${item.hasta.toLocaleString('es-CL')}`}
                                    </TableCell>
                                    <TableCell className="text-center">{item.factor === 0 ? 'Exento' : item.factor.toString().replace('.',',')}</TableCell>
                                    <TableCell className="text-right">${item.rebaja.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-center">{calculateEffectiveRate(item.desde, item.hasta, item.factor, item.rebaja)}</TableCell>
                                </TableRow>
                            ))}
                             {!loading && tablaIUT?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No se encontraron parámetros de IUT para el período seleccionado.
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
