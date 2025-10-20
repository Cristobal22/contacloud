
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Button, buttonVariants } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";
  import { useCollection, useFirestore, useUser } from "@/firebase";
  import type { EconomicIndicator } from "@/lib/types";
  import { doc, setDoc, writeBatch, collection, getDocs } from "firebase/firestore";
  import { useToast } from "@/hooks/use-toast";
  import { errorEmitter } from "@/firebase/error-emitter";
  import { FirestorePermissionError } from "@/firebase/errors";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { SelectedCompanyContext } from "../../layout";
  import { cn } from "@/lib/utils";
  import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { initialEconomicIndicators } from "@/lib/seed-data";

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
    const [indicator, setIndicator] = React.useState<Partial<EconomicIndicator>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCompanySpecific, setIsCompanySpecific] = React.useState(false);
    
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    
    const indicatorId = `${year}-${month.toString().padStart(2, '0')}`;

    // Fetch all global indicators for the history table
    const { data: allGlobalIndicators, loading: allGlobalsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });

    // Reference to the company-specific override for the selected period
    const companyIndicatorRef = React.useMemo(() =>
        firestore && companyId ? doc(firestore, `companies/${companyId}/economic-indicators/${indicatorId}`) : null,
    [firestore, companyId, indicatorId]);
    const { data: companyIndicator, loading: companyLoading } = useDoc<EconomicIndicator>(companyIndicatorRef);


    React.useEffect(() => {
      const loading = allGlobalsLoading || companyLoading;
      setIsLoading(loading);
      if (loading) return;
      
      const globalIndicatorForPeriod = allGlobalIndicators?.find(i => i.id === indicatorId);

      // Prioritize company-specific indicator
      if (companyIndicator) {
          setIndicator(companyIndicator);
          setIsCompanySpecific(true);
      } 
      // Fallback to global indicator
      else if (globalIndicatorForPeriod) {
          setIndicator(globalIndicatorForPeriod);
          setIsCompanySpecific(false);
      } 
      // If neither exists, reset to a blank state for the selected period
      else {
          setIndicator({ id: indicatorId, year, month });
          setIsCompanySpecific(false);
      }
    }, [year, month, allGlobalIndicators, companyIndicator, indicatorId, allGlobalsLoading, companyLoading]);


    const handleSave = async (scope: 'company' | 'global') => {
        if (!firestore || !user || !indicator.id) return;
        if (scope === 'company' && !companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selecciona una empresa para guardar parámetros específicos.'});
            return;
        }
        
        setIsLoading(true);
        
        const path = scope === 'company'
            ? `companies/${companyId}/economic-indicators`
            : 'economic-indicators';
        
        const docRef = doc(firestore, path, indicator.id);
        
        const dataToSave: Partial<EconomicIndicator> = {
            ...indicator,
            year: Number(year),
            month: Number(month),
            uf: Number(indicator.uf) || 0,
            utm: Number(indicator.utm) || 0,
            uta: indicator.utm ? Number(indicator.utm) * 12 : 0,
            minWage: Number(indicator.minWage) || 0,
        };
        dataToSave.gratificationCap = dataToSave.minWage ? Math.round((4.75 * dataToSave.minWage)/12) : 0;

        try {
            await setDoc(docRef, dataToSave, { merge: true });
            const description = scope === 'company'
                ? `Los valores personalizados para ${selectedCompany?.name} han sido guardados.`
                : 'Los valores globales han sido actualizados.';
            toast({ title: 'Parámetros Guardados', description });
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
        setIndicator(prev => ({ ...prev, [field]: value }));
    };
    
    const handleUpdateParameters = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        const collectionRef = collection(firestore, 'economic-indicators');
        try {
            const batch = writeBatch(firestore);
            const existingDocs = await getDocs(collectionRef);
            existingDocs.forEach(doc => batch.delete(doc.ref));

            initialEconomicIndicators.forEach(item => {
                const id = `${item.year}-${item.month.toString().padStart(2, '0')}`;
                const docRef = doc(collectionRef, id);
                batch.set(docRef, item);
            });

            await batch.commit();
            toast({
                title: "Parámetros Actualizados",
                description: "Los indicadores económicos han sido actualizados.",
            });
        } catch (error) {
            console.error("Error updating economic indicators: ", error);
            toast({
                variant: 'destructive',
                title: "Error de Permisos",
                description: "No se pudieron actualizar los indicadores."
            })
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
        }
    };

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Parámetros Económicos Mensuales</CardTitle>
                        <CardDescription>
                            Gestiona los parámetros para los cálculos.
                        </CardDescription>
                    </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-6">
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
                                                {new Date(0, i).toLocaleString('es-CL', { month: 'long' })}
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
                        <div className={cn("rounded-md border p-4", isCompanySpecific ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-transparent")}>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="uf">Valor UF (último día del mes)</Label>
                                    <Input id="uf" type="number" placeholder="Ingresa el valor de la UF" value={indicator.uf || ''} onChange={e => handleFieldChange('uf', e.target.value)} disabled={!user || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="utm">Valor UTM</Label>
                                    <Input id="utm" type="number" placeholder="Ingresa el valor de la UTM" value={indicator.utm || ''} onChange={e => handleFieldChange('utm', e.target.value)} disabled={!user || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sueldo-minimo">Sueldo Mínimo</Label>
                                    <Input id="sueldo-minimo" type="number" placeholder="Ingresa el sueldo mínimo" value={indicator.minWage || ''} onChange={e => handleFieldChange('minWage', e.target.value)} disabled={!user || isLoading} />
                                </div>
                            </div>
                             {isCompanySpecific && (
                                <p className="text-sm text-blue-600 mt-3">Estás viendo valores personalizados para <span className="font-bold">{selectedCompany?.name}</span>.</p>
                            )}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button disabled={isLoading || !user} onClick={() => handleSave('company')} className="gap-1">
                                <span>Guardar para {selectedCompany?.name || '...'}</span>
                            </Button>
                        </div>
                    </form>
                </CardContent>
                </Card>
            </div>

            <Card className="lg:col-span-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Historial Global</CardTitle>
                         {userProfile?.role === 'Admin' && (
                            <Button size="sm" onClick={() => setIsAlertOpen(true)} disabled={isSubmitting}>
                                {isSubmitting ? 'Actualizando...' : 'Actualizar Parámetros'}
                            </Button>
                        )}
                    </div>
                     <CardDescription>Valores de referencia para todos los usuarios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[450px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">UTM</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allGlobalsLoading ? (
                                    <TableRow><TableCell colSpan={2} className="text-center">Cargando historial...</TableCell></TableRow>
                                ) : allGlobalIndicators && allGlobalIndicators.length > 0 ? (
                                allGlobalIndicators.sort((a,b) => b.id.localeCompare(a.id)).map(ind => (
                                    <TableRow key={ind.id} className={cn(ind.id === indicatorId && "bg-muted font-bold")}>
                                        <TableCell>
                                            {ind.year}-{ind.month.toString().padStart(2, '0')}
                                            {isCompanySpecific && ind.id === indicatorId && 
                                                <span className="ml-2 text-xs text-blue-600">(Personalizado)</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">${ind.utm?.toLocaleString('es-CL')}</TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                    <TableRow><TableCell colSpan={2} className="text-center">No hay valores globales.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmas la actualización?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción borrará todos los indicadores económicos globales existentes y los reemplazará con los valores del sistema.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleUpdateParameters}
                        disabled={isSubmitting}
                    >
                        Sí, actualizar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
