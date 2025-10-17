'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
  } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Button } from "@/components/ui/button"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";
  import { useCollection, useFirestore } from "@/firebase";
  import type { EconomicIndicator } from "@/lib/types";
  import { doc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
  import { useToast } from "@/hooks/use-toast";
  import { errorEmitter } from "@/firebase/error-emitter";
  import { FirestorePermissionError } from "@/firebase/errors";
  import { initialEconomicIndicators } from "@/lib/seed-data";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

  export default function MonthlyParametersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear);
    const [month, setMonth] = React.useState(currentMonth);
    const [indicator, setIndicator] = React.useState<Partial<EconomicIndicator>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    
    const collectionRef = React.useMemo(() => firestore ? collection(firestore, 'system-parameters/economic-indicators') : null, [firestore]);
    const {data: allIndicators, loading: allIndicatorsLoading} = useCollection<EconomicIndicator>({ query: collectionRef as any });

    React.useEffect(() => {
      const fetchIndicator = async () => {
          if (!collectionRef) return;
          setIsLoading(true);
          const id = `${year}-${month.toString().padStart(2, '0')}`;
          
          const q = query(collectionRef, where('id', '==', id));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
              const docData = snapshot.docs[0].data() as EconomicIndicator;
              setIndicator(docData);
          } else {
              setIndicator({ id, year, month });
          }
          setIsLoading(false);
      }
      fetchIndicator();
    }, [year, month, collectionRef]);

    const handleSave = async () => {
        if (!firestore || !indicator.id) return;
        setIsLoading(true);
        const docRef = doc(firestore, 'system-parameters/economic-indicators', indicator.id);
        const dataToSave: Partial<EconomicIndicator> = {
            ...indicator,
            year: Number(year),
            month: Number(month),
            uf: Number(indicator.uf) || undefined,
            utm: Number(indicator.utm) || undefined,
            uta: indicator.utm ? Number(indicator.utm) * 12 : undefined,
            minWage: Number(indicator.minWage) || undefined,
            gratificationCap: indicator.minWage ? Math.round((4.75 * Number(indicator.minWage))/12) : undefined,
        };

        try {
            await setDoc(docRef, dataToSave, { merge: true });
            toast({ title: 'Parámetros Guardados', description: 'Los valores se han guardado exitosamente.' });
        } catch (error) {
            console.error("Error saving indicators", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: dataToSave,
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedData = async () => {
        if (!firestore) return;
        const collectionPath = `system-parameters/economic-indicators`;
        const batch = writeBatch(firestore);
        
        initialEconomicIndicators.forEach(indicatorData => {
            const docId = `${indicatorData.year}-${indicatorData.month.toString().padStart(2, '0')}`;
            const docRef = doc(firestore, collectionPath, docId);
            batch.set(docRef, { ...indicatorData, id: docId });
        });

        try {
            await batch.commit();
            toast({
                title: "Datos Históricos Cargados",
                description: "Los indicadores económicos desde 2020 han sido poblados.",
            });
        } catch (error) {
            console.error("Error seeding economic indicators: ", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: collectionPath,
                operation: 'create',
            }));
        }
    }

    const handleFieldChange = (field: keyof EconomicIndicator, value: string) => {
        setIndicator(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros Económicos Mensuales</CardTitle>
            <CardDescription>Gestiona los parámetros mensuales para los cálculos contables y de remuneraciones (ej. UTM, UF).</CardDescription>
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
                   <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                          <Label htmlFor="uf">Valor UF (último día del mes)</Label>
                          <Input id="uf" type="number" placeholder="Ingresa el valor de la UF" value={indicator.uf || ''} onChange={e => handleFieldChange('uf', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="utm">Valor UTM</Label>
                          <Input id="utm" type="number" placeholder="Ingresa el valor de la UTM" value={indicator.utm || ''} onChange={e => handleFieldChange('utm', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="sueldo-minimo">Sueldo Mínimo</Label>
                          <Input id="sueldo-minimo" type="number" placeholder="Ingresa el sueldo mínimo" value={indicator.minWage || ''} onChange={e => handleFieldChange('minWage', e.target.value)} />
                      </div>
                  </div>
                   <div className="flex justify-end">
                      <Button onClick={handleSave} disabled={isLoading}>
                          {isLoading ? 'Guardando...' : 'Guardar Parámetros'}
                      </Button>
                  </div>
              </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Historial de Indicadores</CardTitle>
                        <CardDescription>Valores guardados para referencia futura.</CardDescription>
                    </div>
                     {(!allIndicators || allIndicators.length === 0) && !allIndicatorsLoading && (
                        <Button size="sm" onClick={handleSeedData}>Poblar Datos Históricos (2020-hoy)</Button>
                    )}
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
                        {allIndicatorsLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Cargando historial...</TableCell></TableRow>
                        ) : allIndicators && allIndicators.length > 0 ? (
                           allIndicators.sort((a,b) => b.id.localeCompare(a.id)).map(ind => (
                               <TableRow key={ind.id}>
                                   <TableCell>{ind.year}-{ind.month}</TableCell>
                                   <TableCell className="text-right">${ind.uf?.toLocaleString('es-CL', {minimumFractionDigits: 2})}</TableCell>
                                   <TableCell className="text-right">${ind.utm?.toLocaleString('es-CL')}</TableCell>
                                   <TableCell className="text-right">${ind.minWage?.toLocaleString('es-CL')}</TableCell>
                               </TableRow>
                           ))
                        ) : (
                             <TableRow><TableCell colSpan={4} className="text-center">No hay datos históricos. Puedes poblarlos con el botón de arriba.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    )
  }
  
