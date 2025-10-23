
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Button, buttonVariants } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";
  import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
  import type { EconomicIndicator } from "@/lib/types";
  import { doc, setDoc, writeBatch, collection, deleteDoc, getDocs } from "firebase/firestore";
  import { useToast } from "@/hooks/use-toast";
  import { errorEmitter } from "@/firebase/error-emitter";
  import { FirestorePermissionError } from "@/firebase/errors";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { SelectedCompanyContext } from "../../layout";
  import { cn } from "@/lib/utils";
  import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { initialEconomicIndicators } from "@/lib/seed-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
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
import { MoreVertical } from "lucide-react";

  export default function MonthlyParametersPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { user } = useUser();
    const { userProfile } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [indicator, setIndicator] = React.useState<Partial<EconomicIndicator> | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCompanySpecific, setIsCompanySpecific] = React.useState(false);
    const [isGlobalDataForPeriod, setIsGlobalDataForPeriod] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = React.useState(false);
    const [isLoadAllDialogOpen, setIsLoadAllDialogOpen] = React.useState(false);


    const indicatorId = `${year}-${month.toString().padStart(2, '0')}`;

    // Fetch all global indicators for the history table
    const { data: allGlobalIndicators, loading: allGlobalsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });

    // Reference to the company-specific override for the selected period
    const companyIndicatorRef = React.useMemo(() =>
        firestore && companyId ? doc(firestore, `companies/${companyId}/economic-indicators/${indicatorId}`) : null,
    [firestore, companyId, indicatorId]);
    const { data: companyIndicator, loading: companyLoading } = useDoc<EconomicIndicator>(companyIndicatorRef as any);

    React.useEffect(() => {
      const loading = allGlobalsLoading || (companyId ? companyLoading : false);
      setIsLoading(loading);
      if (loading) return;
      
      const globalIndicatorForPeriod = allGlobalIndicators?.find(i => i.id === indicatorId);
      setIsGlobalDataForPeriod(!!globalIndicatorForPeriod);

      if (companyIndicator) {
          setIndicator(companyIndicator);
          setIsCompanySpecific(true);
      } else if (globalIndicatorForPeriod) {
          setIndicator(globalIndicatorForPeriod);
          setIsCompanySpecific(false);
      } else {
           setIndicator(null);
          setIsCompanySpecific(false);
      }
    }, [year, month, allGlobalIndicators, companyIndicator, indicatorId, allGlobalsLoading, companyLoading, companyId]);

    const handleLoadDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') return;
        setIsLoading(true);

        const indicatorData = initialEconomicIndicators.find(i => i.year === year && i.month === month);

        if (!indicatorData || indicatorData.uf === undefined || indicatorData.utm === undefined) {
            toast({
                variant: 'destructive',
                title: 'Sin Datos',
                description: `No hay indicadores predeterminados para ${month}/${year}.`
            });
            setIsLoading(false);
            return;
        }

        const id = `${indicatorData.year}-${indicatorData.month.toString().padStart(2, '0')}`;
        const uta = (indicatorData.utm || 0) * 12;
        const gratificationCap = indicatorData.minWage ? Math.round((4.75 * indicatorData.minWage) / 12) : 0;
        const docRef = doc(firestore, 'economic-indicators', id);
        
        try {
            await setDoc(docRef, { ...indicatorData, id, uta, gratificationCap }, { merge: true });
            toast({ title: 'Datos Cargados', description: `Los indicadores para ${month}/${year} han sido cargados/actualizados.`});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'economic-indicators',
                operation: 'create',
            }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLoadAllDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }

        setIsLoading(true);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, 'economic-indicators');
        let count = 0;

        initialEconomicIndicators.forEach(indicatorData => {
            if (indicatorData.uf !== undefined && indicatorData.utm !== undefined) {
                const id = `${indicatorData.year}-${indicatorData.month.toString().padStart(2, '0')}`;
                const uta = (indicatorData.utm || 0) * 12;
                const gratificationCap = indicatorData.minWage ? Math.round((4.75 * indicatorData.minWage) / 12) : 0;
                const docRef = doc(collectionRef, id);
                batch.set(docRef, { ...indicatorData, id, uta, gratificationCap }, { merge: true });
                count++;
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Carga Masiva Completa', description: `Se cargaron/actualizaron ${count} períodos de indicadores.`});
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'economic-indicators',
                operation: 'create',
            }));
        } finally {
            setIsLoading(false);
            setIsLoadAllDialogOpen(false);
        }
    };

    const handleDeleteGlobal = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin' || !isGlobalDataForPeriod) {
             toast({ variant: 'destructive', title: 'Acción no permitida' });
            return;
        }
        setIsLoading(true);
        const docRef = doc(firestore, 'economic-indicators', indicatorId);
        try {
            await deleteDoc(docRef);
            toast({ title: 'Parámetro Eliminado', description: `Los indicadores globales para ${month}/${year} han sido eliminados.` });
        } catch(error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'economic-indicators',
                operation: 'delete',
            }));
        } finally {
            setIsLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleDeleteAllGlobals = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Permiso denegado' });
            return;
        }
        setIsLoading(true);
        const collectionRef = collection(firestore, 'economic-indicators');
        try {
            const querySnapshot = await getDocs(collectionRef);
            if (querySnapshot.empty) {
                toast({ description: "No hay parámetros para eliminar." });
            } else {
                const batch = writeBatch(firestore);
                querySnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                toast({
                    title: "Parámetros Eliminados",
                    description: "Todos los indicadores económicos globales han sido eliminados."
                });
            }
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'economic-indicators',
                operation: 'delete',
            }));
        } finally {
            setIsLoading(false);
            setIsDeleteAllDialogOpen(false);
        }
    };


    const handleSaveCompanySpecific = async () => {
        if (!firestore || !user || !companyId) return;
        
        setIsLoading(true);
        const path = `companies/${companyId}/economic-indicators`;
        const docRef = doc(firestore, path, indicatorId);
        
        const dataToSave: Partial<EconomicIndicator> = {
            id: indicatorId,
            year: Number(year),
            month: Number(month),
            uf: Number(indicator?.uf) || 0,
            utm: Number(indicator?.utm) || 0,
            minWage: Number(indicator?.minWage) || 0,
        };
        dataToSave.uta = dataToSave.utm ? Number(dataToSave.utm) * 12 : 0;
        dataToSave.gratificationCap = dataToSave.minWage ? Math.round((4.75 * dataToSave.minWage)/12) : 0;

        try {
            await setDoc(docRef, dataToSave, { merge: true });
            toast({ title: 'Parámetros Guardados', description: `Los valores personalizados para ${selectedCompany?.name} han sido guardados.` });
        } catch (error) {
            console.error("Error saving indicators:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: dataToSave,
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (field: keyof EconomicIndicator, value: string) => {
        setIndicator(prev => ({ ...(prev || {id: indicatorId, year, month}), [field]: value }));
    };
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>Indicadores Económicos Históricos</CardTitle>
                            <CardDescription>
                                Consulta los valores globales de UF, UTM y Sueldo Mínimo para cualquier período.
                            </CardDescription>
                        </div>
                         {userProfile?.role === 'Admin' && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Acciones de Administrador</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones de Admin</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={handleLoadDefaults} disabled={isLoading}>
                                        Cargar Predeterminados para {month}/{year}
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => setIsLoadAllDialogOpen(true)} disabled={isLoading}>
                                        Cargar Todos los Períodos
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} disabled={isLoading || !isGlobalDataForPeriod}>
                                        Eliminar para {month}/{year}
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onSelect={() => setIsDeleteAllDialogOpen(true)} disabled={isLoading} className="text-destructive">
                                        Eliminar Todos los Parámetros Globales
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">UF</TableHead>
                                    <TableHead className="text-right">UTM</TableHead>
                                    <TableHead className="text-right">Sueldo Mínimo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allGlobalsLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center">Cargando historial...</TableCell></TableRow>
                                ) : allGlobalIndicators && allGlobalIndicators.length > 0 ? (
                                allGlobalIndicators.sort((a,b) => b.id.localeCompare(a.id)).map(ind => (
                                    <TableRow key={ind.id} className={cn(ind.year === year && ind.month === month && "bg-muted font-bold")}>
                                        <TableCell>
                                            {format(new Date(ind.year, ind.month - 1), 'MMMM yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">{ind.uf ? `$${ind.uf?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                        <TableCell className="text-right">{ind.utm ? `$${ind.utm?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                        <TableCell className="text-right">{ind.minWage ? `$${ind.minWage?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center">No hay valores globales cargados.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Valores Específicos por Empresa</CardTitle>
                    <CardDescription>
                        Opcionalmente, puedes definir valores específicos para una empresa en un período determinado. Esto sobreescribirá el valor global para los cálculos de esa empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month.toString()} onValueChange={val => setMonth(Number(val))}>
                                    <SelectTrigger id="month">
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
                                    <SelectTrigger id="year">
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
                        <div className={cn("rounded-md border p-4", isCompanySpecific ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-dashed")}>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="uf">Valor UF (Personalizado)</Label>
                                    <Input id="uf" type="number" placeholder={indicator?.uf === undefined ? "Sin datos" : "Ingresa el valor"} value={indicator?.uf ?? ''} onChange={e => handleFieldChange('uf', e.target.value)} disabled={!companyId || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="utm">Valor UTM (Personalizado)</Label>
                                    <Input id="utm" type="number" placeholder={indicator?.utm === undefined ? "Sin datos" : "Ingresa el valor"} value={indicator?.utm ?? ''} onChange={e => handleFieldChange('utm', e.target.value)} disabled={!companyId || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sueldo-minimo">Sueldo Mínimo (Personalizado)</Label>
                                    <Input id="sueldo-minimo" type="number" placeholder={indicator?.minWage === undefined ? "Sin datos" : "Ingresa el valor"} value={indicator?.minWage ?? ''} onChange={e => handleFieldChange('minWage', e.target.value)} disabled={!companyId || isLoading} />
                                </div>
                            </div>
                             {isCompanySpecific && (
                                <p className="text-sm text-blue-600 mt-3">Estás viendo valores personalizados para <span className="font-bold">{selectedCompany?.name}</span>.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end pt-4">
                    <Button disabled={isLoading || !companyId} onClick={handleSaveCompanySpecific}>
                        Guardar para {selectedCompany?.name || '...'}
                    </Button>
                </CardFooter>
            </Card>

             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción eliminará permanentemente los indicadores globales para el período de <span className='font-bold'>{format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}</span>. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDeleteGlobal}
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación total?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción eliminará permanentemente **TODOS** los indicadores económicos globales de la base de datos. Deberás volver a cargarlos manualmente período por período. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={handleDeleteAllGlobals}
                            disabled={isLoading}
                        >
                            {isLoading ? "Eliminando..." : "Sí, eliminar todo"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isLoadAllDialogOpen} onOpenChange={setIsLoadAllDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la carga masiva?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción cargará o sobreescribirá **TODOS** los indicadores económicos predeterminados (UF, UTM, Sueldo Mínimo) para todos los períodos disponibles en el código fuente. Esto puede tardar unos segundos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLoadAllDefaults}
                            disabled={isLoading}
                        >
                            {isLoading ? "Cargando..." : "Sí, cargar todo"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
      </div>
  )
}
