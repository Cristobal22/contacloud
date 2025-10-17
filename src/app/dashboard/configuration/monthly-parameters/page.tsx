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
  import { Button } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";
  import { useCollection, useFirestore, useDoc, useUser } from "@/firebase";
  import type { EconomicIndicator } from "@/lib/types";
  import { doc, setDoc, writeBatch, collection } from "firebase/firestore";
  import { useToast } from "@/hooks/use-toast";
  import { errorEmitter } from "@/firebase/error-emitter";
  import { FirestorePermissionError } from "@/firebase/errors";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { SelectedCompanyContext } from "../../layout";
  import { cn } from "@/lib/utils";
  import { initialEconomicIndicators } from "@/lib/seed-data";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
  import { ChevronDown } from "lucide-react";

  export default function MonthlyParametersPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [indicator, setIndicator] = React.useState<Partial<EconomicIndicator>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCompanySpecific, setIsCompanySpecific] = React.useState(false);
    
    const indicatorId = `${year}-${month.toString().padStart(2, '0')}`;

    // Reference to the global (system) parameter
    const globalIndicatorRef = React.useMemo(() => 
        firestore ? doc(firestore, `economic-indicators/${indicatorId}`) : null,
    [firestore, indicatorId]);
    const { data: globalIndicator, loading: globalLoading } = useDoc<EconomicIndicator>(globalIndicatorRef);

    const { data: allGlobalIndicators, loading: allGlobalsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });


    // Reference to the company-specific override
    const companyIndicatorRef = React.useMemo(() =>
        firestore && companyId ? doc(firestore, `companies/${companyId}/economic-indicators/${indicatorId}`) : null,
    [firestore, companyId, indicatorId]);
    const { data: companyIndicator, loading: companyLoading } = useDoc<EconomicIndicator>(companyIndicatorRef);

    // List all company-specific indicators for the history table
    const { data: companyOverrides } = useCollection<EconomicIndicator>({
        path: `companies/${companyId}/economic-indicators`,
        companyId: companyId
    });

    React.useEffect(() => {
      const loading = globalLoading || companyLoading;
      setIsLoading(loading);
      if (loading) return;

      // Prioritize company-specific indicator
      if (companyIndicator) {
          setIndicator(companyIndicator);
          setIsCompanySpecific(true);
      } 
      // Fallback to global indicator
      else if (globalIndicator) {
          setIndicator(globalIndicator);
          setIsCompanySpecific(false);
      } 
      // If neither exists, reset to a blank state for the selected period
      else {
          setIndicator({ id: indicatorId, year, month });
          setIsCompanySpecific(false);
      }
    }, [year, month, globalIndicator, companyIndicator, indicatorId, globalLoading, companyLoading]);


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

    const handleSeedData = async () => {
        if (!firestore) return;
        const collectionPath = `economic-indicators`;
        const batch = writeBatch(firestore);
        
        initialEconomicIndicators.forEach(indicatorData => {
            const id = `${indicatorData.year}-${indicatorData.month.toString().padStart(2, '0')}`;
            const docRef = doc(firestore, collectionPath, id);
            batch.set(docRef, { ...indicatorData, id });
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Cargados",
                description: "Los indicadores económicos han sido poblados exitosamente.",
            });
        } catch (error) {
            console.error("Error seeding economic indicators: ", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'create',
            }));
        }
    };

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Parámetros Económicos Mensuales</CardTitle>
                <CardDescription>
                    Gestiona los parámetros para los cálculos. Los valores guardados aquí pueden ser globales o específicos por empresa.
                </CardDescription>
              </div>
               {!allGlobalsLoading && allGlobalIndicators?.length === 0 && (
                  <Button size="sm" onClick={handleSeedData}>Poblar Datos Globales</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
              <form className="grid gap-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label htmlFor="month">Mes</Label>
                          <Select value={month.toString()} onValueChange={val => setMonth(Number(val))} disabled={!companyId}>
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
                          <Select value={year.toString()} onValueChange={val => setYear(Number(val))} disabled={!companyId}>
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
                      <p className="text-sm text-blue-600">Estás viendo valores personalizados para esta empresa. Los valores globales pueden ser diferentes.</p>
                  )}
                   <div className="flex justify-end">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button disabled={isLoading || !user} className="gap-1">
                              <span>Guardar Cambios</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleSave('company')} disabled={!companyId}>
                              Solo para {selectedCompany?.name || 'esta empresa'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSave('global')}>
                              Para Todas Mis Empresas (Global)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </div>
              </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>Historial de Parámetros Personalizados</CardTitle>
                    <CardDescription>Valores específicos guardados para la empresa <span className="font-bold">{selectedCompany?.name || ''}</span>.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
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
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Cargando historial...</TableCell></TableRow>
                        ) : companyOverrides && companyOverrides.length > 0 ? (
                           companyOverrides.sort((a,b) => b.id.localeCompare(a.id)).map(ind => (
                               <TableRow key={ind.id} className={cn(ind.id === indicatorId && "bg-blue-100 dark:bg-blue-900/50")}>
                                   <TableCell>{ind.year}-{ind.month.toString().padStart(2, '0')}</TableCell>
                                   <TableCell className="text-right">${ind.uf?.toLocaleString('es-CL', {minimumFractionDigits: 2})}</TableCell>
                                   <TableCell className="text-right">${ind.utm?.toLocaleString('es-CL')}</TableCell>
                                   <TableCell className="text-right">${ind.minWage?.toLocaleString('es-CL')}</TableCell>
                               </TableRow>
                           ))
                        ) : (
                             <TableRow><TableCell colSpan={4} className="text-center">No hay valores personalizados para esta empresa.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    )
  }
