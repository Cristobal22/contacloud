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
  import { Button } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";
  import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
  import type { EconomicIndicator, TaxableCap } from "@/lib/types";
  import { doc, setDoc, writeBatch, collection } from "firebase/firestore";
  import { useToast } from "@/hooks/use-toast";
  import { errorEmitter } from "@/firebase/error-emitter";
  import { FirestorePermissionError } from "@/firebase/errors";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { SelectedCompanyContext } from "../../layout";
  import { cn } from "@/lib/utils";
  import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { initialEconomicIndicators, initialTaxableCaps } from "@/lib/seed-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
    }, [year, month, allGlobalIndicators, companyIndicator, indicatorId, allGlobalsLoading, companyLoading, companyId]);

    const handleLoadDefaults = async () => {
        if (!firestore || !userProfile || userProfile.role !== 'Admin') return;
        setIsLoading(true);

        const batch = writeBatch(firestore);
        
        // Load Economic Indicators
        const indicatorsCollectionRef = collection(firestore, 'economic-indicators');
        initialEconomicIndicators.forEach(indicatorData => {
            const id = `${indicatorData.year}-${indicatorData.month.toString().padStart(2, '0')}`;
            const uta = (indicatorData.utm || 0) * 12;
            const gratificationCap = indicatorData.minWage ? Math.round((4.75 * indicatorData.minWage)/12) : 0;
            const docRef = doc(indicatorsCollectionRef, id);
            batch.set(docRef, { ...indicatorData, id, uta, gratificationCap }, { merge: true });
        });

        // Load Taxable Caps
        const capsCollectionRef = collection(firestore, 'taxable-caps');
        initialTaxableCaps.forEach(capData => {
            const id = capData.year.toString();
            const docRef = doc(capsCollectionRef, id);
            batch.set(docRef, { ...capData, id }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Datos Cargados', description: 'El historial de indicadores económicos y topes imponibles ha sido cargado/actualizado.'});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'economic-indicators or taxable-caps',
                operation: 'create',
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCompanySpecific = async () => {
        if (!firestore || !user || !indicator.id || !companyId) return;
        
        setIsLoading(true);
        const path = `companies/${companyId}/economic-indicators`;
        const docRef = doc(firestore, path, indicator.id);
        
        const dataToSave: Partial<EconomicIndicator> = {
            ...indicator,
            year: Number(year),
            month: Number(month),
            uf: Number(indicator.uf) || 0,
            utm: Number(indicator.utm) || 0,
        };
        dataToSave.uta = dataToSave.utm ? Number(dataToSave.utm) * 12 : 0;
        dataToSave.minWage = Number(indicator.minWage) || 0;
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
        setIndicator(prev => ({ ...prev, [field]: value }));
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
                            <Button onClick={handleLoadDefaults} disabled={isLoading}>
                                {isLoading ? 'Cargando...' : 'Cargar Todos los Indicadores Predeterminados'}
                            </Button>
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
                                        <TableCell className="text-right">${ind.uf?.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right">${ind.utm?.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right">${ind.minWage?.toLocaleString('es-CL')}</TableCell>
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
                                    <Input id="uf" type="number" placeholder="Ingresa el valor de la UF" value={indicator.uf || ''} onChange={e => handleFieldChange('uf', e.target.value)} disabled={!companyId || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="utm">Valor UTM (Personalizado)</Label>
                                    <Input id="utm" type="number" placeholder="Ingresa el valor de la UTM" value={indicator.utm || ''} onChange={e => handleFieldChange('utm', e.target.value)} disabled={!companyId || isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sueldo-minimo">Sueldo Mínimo (Personalizado)</Label>
                                    <Input id="sueldo-minimo" type="number" placeholder="Ingresa el sueldo mínimo" value={indicator.minWage || ''} onChange={e => handleFieldChange('minWage', e.target.value)} disabled={!companyId || isLoading} />
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
        </div>
  )