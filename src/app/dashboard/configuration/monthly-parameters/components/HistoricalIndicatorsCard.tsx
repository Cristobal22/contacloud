'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreVertical, PlusCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, deleteDoc, writeBatch, getDocs, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { initialEconomicIndicators } from '@/lib/seed-data';
import type { EconomicIndicator, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EditIndicatorDialog } from '@/components/admin/edit-indicator-dialog';

interface HistoricalIndicatorsCardProps {
  userProfile: UserProfile | null;
  allGlobalIndicators: EconomicIndicator[] | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  year: number;
  setYear: (year: number) => void;
  month: number;
  setMonth: (month: number) => void;
}

export function HistoricalIndicatorsCard({
  userProfile,
  allGlobalIndicators,
  isLoading,
  setIsLoading,
  year,
  setYear,
  month,
  setMonth,
}: HistoricalIndicatorsCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = React.useState(false);
  const [isLoadAllDialogOpen, setIsLoadAllDialogOpen] = React.useState(false);
  const [isAddIndicatorDialogOpen, setIsAddIndicatorDialogOpen] = React.useState(false);
  const [isEditIndicatorDialogOpen, setIsEditIndicatorDialogOpen] = React.useState(false);
  const [indicatorToEdit, setIndicatorToEdit] = React.useState<Partial<EconomicIndicator> | null>(null);
  const [newIndicatorData, setNewIndicatorData] = React.useState<Partial<EconomicIndicator>>({
    year: currentYear,
    month: new Date().getMonth() + 1,
    uf: 0,
    utm: 0,
    minWage: 0,
  });

  const isGlobalDataForPeriod = !!allGlobalIndicators?.find(i => i.id === `${year}-${String(month).padStart(2, '0')}`);

  // All handler functions (handleLoadDefaults, handleAddIndicator, etc.) go here
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

    const id = `${indicatorData.year}-${String(indicatorData.month).padStart(2, '0')}`;
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
              const id = `${indicatorData.year}-${String(indicatorData.month).padStart(2, '0')}`;
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
    const indicatorId = `${year}-${String(month).padStart(2, '0')}`;
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

  const handleNewIndicatorFieldChange = (field: keyof EconomicIndicator, value: string | number) => {
    setNewIndicatorData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddIndicator = async () => {
    if (!firestore || !userProfile || userProfile.role !== 'Admin') {
      toast({ variant: 'destructive', title: 'Permiso denegado' });
      return;
    }

    const { year: newYear, month: newMonth, uf, utm, minWage } = newIndicatorData;

    if (!newYear || !newMonth || uf === undefined || utm === undefined || minWage === undefined) {
      toast({ variant: 'destructive', title: 'Datos Incompletos', description: 'Por favor, completa todos los campos del indicador.' });
      return;
    }

    setIsLoading(true);
    const id = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const uta = (Number(utm) || 0) * 12;
    const gratificationCap = Number(minWage) ? Math.round((4.75 * Number(minWage)) / 12) : 0;
    const docRef = doc(firestore, 'economic-indicators', id);

    try {
      await setDoc(docRef, { id, year: Number(newYear), month: Number(newMonth), uf: Number(uf), utm: Number(utm), minWage: Number(minWage), uta, gratificationCap }, { merge: true });
      toast({ title: 'Indicador Agregado', description: `El indicador para ${newMonth}/${newYear} ha sido guardado.` });
      setIsAddIndicatorDialogOpen(false);
      setNewIndicatorData({ year: currentYear, month: new Date().getMonth() + 1, uf: 0, utm: 0, minWage: 0 });
    } catch (error) {
      console.error("Error adding new indicator:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el indicador económico." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateIndicator = async (updatedIndicator: Partial<EconomicIndicator>) => {
    if (!firestore || !userProfile || userProfile.role !== 'Admin' || !updatedIndicator) {
      toast({ variant: 'destructive', title: 'Permiso denegado' });
      return;
    }
    const { year: updatedYear, month: updatedMonth, uf, utm, minWage } = updatedIndicator;
    if (!updatedYear || !updatedMonth || uf === undefined || utm === undefined || minWage === undefined) {
      toast({ variant: 'destructive', title: 'Datos Incompletos' });
      return;
    }
    setIsLoading(true);
    const id = `${updatedYear}-${String(updatedMonth).padStart(2, '0')}`;
    const uta = (Number(utm) || 0) * 12;
    const gratificationCap = Number(minWage) ? Math.round((4.75 * Number(minWage)) / 12) : 0;
    const docRef = doc(firestore, 'economic-indicators', id);
    try {
      await setDoc(docRef, { ...updatedIndicator, uta, gratificationCap }, { merge: true });
      toast({ title: 'Indicador Actualizado' });
      setIsEditIndicatorDialogOpen(false);
    } catch (error) {
      console.error("Error updating indicator:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el indicador." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditDialog = (indicatorData: EconomicIndicator) => {
      setIndicatorToEdit(indicatorData);
      setIsEditIndicatorDialogOpen(true);
  };

  return (
    <>
      <Card className="lg:col-span-3">
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle>Indicadores Económicos Históricos</CardTitle>
                    <CardDescription>
                        Consulta los valores globales de UF, UTM y Sueldo Mínimo para cualquier período.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <div className="space-y-2">
                        <Select value={String(month)} onValueChange={(val: string) => setMonth(Number(val))}>
                            <SelectTrigger id="month-selector"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (<SelectItem key={i+1} value={String(i+1)}>{format(new Date(0, i), 'MMMM', { locale: es })}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Select value={String(year)} onValueChange={(val: string) => setYear(Number(val))}>
                            <SelectTrigger id="year-selector"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => (<SelectItem key={currentYear-i} value={String(currentYear-i)}>{currentYear-i}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                 {userProfile?.role === 'Admin' && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /><span className="sr-only">Acciones de Administrador</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones de Admin</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsAddIndicatorDialogOpen(true)} disabled={isLoading}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Mes</DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleLoadDefaults} disabled={isLoading}>Cargar Predeterminados para {month}/{year}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsLoadAllDialogOpen(true)} disabled={isLoading}>Cargar Todos los Períodos</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} disabled={isLoading || !isGlobalDataForPeriod}>Eliminar para {month}/{year}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsDeleteAllDialogOpen(true)} disabled={isLoading} className="text-destructive">Eliminar Todos los Parámetros Globales</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                </div>
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
                            {userProfile?.role === 'Admin' && <TableHead className="text-right">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!allGlobalIndicators ? (
                            <TableRow><TableCell colSpan={userProfile?.role === 'Admin' ? 5 : 4} className="text-center">Cargando historial...</TableCell></TableRow>
                        ) : allGlobalIndicators.length > 0 ? (
                        allGlobalIndicators.sort((a,b) => b.id.localeCompare(a.id)).map(ind => (
                            <TableRow key={ind.id} className={cn(ind.year === year && ind.month === month && "bg-muted font-bold")}>
                                <TableCell>{format(new Date(ind.year, ind.month - 1), 'MMMM yyyy', { locale: es })}</TableCell>
                                <TableCell className="text-right">{ind.uf ? `$${ind.uf?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                <TableCell className="text-right">{ind.utm ? `$${ind.utm?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                <TableCell className="text-right">{ind.minWage ? `$${ind.minWage?.toLocaleString('es-CL')}` : 'N/A'}</TableCell>
                                {userProfile?.role === 'Admin' && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEditDialog(ind)}><Edit className="h-4 w-4" /></Button></TableCell>}
                            </TableRow>
                        ))
                        ) : (
                            <TableRow><TableCell colSpan={userProfile?.role === 'Admin' ? 5 : 4} className="text-center">No hay valores globales cargados.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
               Esta acción eliminará permanentemente los indicadores globales para el período de <span className='font-bold'>{format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGlobal} className={buttonVariants({ variant: "destructive" })}>Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación total?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción eliminará permanentemente **TODOS** los indicadores económicos globales. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllGlobals} disabled={isLoading} className={buttonVariants({ variant: "destructive" })}>{isLoading ? "Eliminando..." : "Sí, eliminar todo"}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isLoadAllDialogOpen} onOpenChange={setIsLoadAllDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la carga masiva?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Esta acción cargará o sobreescribirá **TODOS** los indicadores económicos predeterminados.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLoadAllDefaults} disabled={isLoading}>{isLoading ? "Cargando..." : "Sí, cargar todo"}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAddIndicatorDialogOpen} onOpenChange={setIsAddIndicatorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Añadir Nuevo Indicador Económico</AlertDialogTitle>
            <AlertDialogDescription>
              Introduce los valores para el nuevo período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-year" className="text-right">Año</Label>
              <Select value={String(newIndicatorData.year)} onValueChange={(val: string) => handleNewIndicatorFieldChange('year', Number(val))}>
                <SelectTrigger id="new-year" className="col-span-3"><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear + i - 2).map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-month" className="text-right">Mes</Label>
              <Select value={String(newIndicatorData.month)} onValueChange={(val: string) => handleNewIndicatorFieldChange('month', Number(val))}>
                <SelectTrigger id="new-month" className="col-span-3"><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<SelectItem key={m} value={String(m)}>{format(new Date(0, m - 1), 'MMMM', { locale: es })}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-uf" className="text-right">Valor UF</Label>
              <Input id="new-uf" type="number" value={newIndicatorData.uf ?? ''} onChange={e => handleNewIndicatorFieldChange('uf', parseFloat(e.target.value) || 0)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-utm" className="text-right">Valor UTM</Label>
              <Input id="new-utm" type="number" value={newIndicatorData.utm ?? ''} onChange={e => handleNewIndicatorFieldChange('utm', parseFloat(e.target.value) || 0)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-minWage" className="text-right">Sueldo Mínimo</Label>
              <Input id="new-minWage" type="number" value={newIndicatorData.minWage ?? ''} onChange={e => handleNewIndicatorFieldChange('minWage', parseFloat(e.target.value) || 0)} className="col-span-3" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddIndicator} disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar Indicador"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {indicatorToEdit && (
        <EditIndicatorDialog
          isOpen={isEditIndicatorDialogOpen}
          onOpenChange={setIsEditIndicatorDialogOpen}
          indicator={indicatorToEdit}
          onSave={handleUpdateIndicator}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
