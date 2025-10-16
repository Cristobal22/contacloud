
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SelectedCompanyContext } from "../../layout";
import { useCollection, useFirestore } from "@/firebase";
import { AfpEntity, Company, Employee, HealthEntity, type Account } from "@/lib/types";
import { addDoc, collection } from "firebase/firestore";
import { centralizeRemunerations } from "@/ai/flows/centralize-remunerations-flow";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useRouter } from 'next/navigation';

export default function CentralizationRemunerationsPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();

    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    
    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isCentralizing, setIsCentralizing] = React.useState(false);

    const { data: accounts, loading: accountsLoading } = useCollection<Account>({
        path: selectedCompany ? `companies/${selectedCompany.id}/accounts` : undefined,
    });
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({
        path: selectedCompany ? `companies/${selectedCompany.id}/employees` : undefined,
    });
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });
    
    const loading = accountsLoading || employeesLoading || afpLoading || healthLoading;

    const handleCentralize = async () => {
        if (!selectedCompany || !employees || !accounts || !afpEntities || !healthEntities) {
            toast({
                variant: "destructive",
                title: "Faltan datos",
                description: "No se puede procesar sin una empresa, empleados o cuentas.",
            });
            return;
        }

        setIsCentralizing(true);
        
        try {
            const afpMap = new Map(afpEntities.map(afp => [afp.name, afp.mandatoryContribution]));
            const healthMap = new Map(healthEntities.map(h => [h.name, h.mandatoryContribution]));

            const activeEmployees = employees.filter(emp => emp.status === 'Active' && emp.baseSalary);
            
            let totalBaseSalary = 0;
            let totalAfpDiscount = 0;
            let totalHealthDiscount = 0;
            let totalNetSalary = 0;

            activeEmployees.forEach(emp => {
                const baseSalary = emp.baseSalary || 0;
                totalBaseSalary += baseSalary;

                const afpPercentage = emp.afp ? (afpMap.get(emp.afp) || 10) / 100 : 0;
                const healthPercentage = (emp.healthSystem === 'Fonasa' ? 7 : (healthMap.get(emp.healthSystem || '') || 7)) / 100;
                
                const afpDiscount = baseSalary * afpPercentage;
                const healthDiscount = baseSalary * healthPercentage;
                const net = baseSalary - afpDiscount - healthDiscount;

                totalAfpDiscount += afpDiscount;
                totalHealthDiscount += healthDiscount;
                totalNetSalary += net;
            });
            
            if (totalBaseSalary === 0) {
                 toast({
                    variant: "destructive",
                    title: "Sin Datos",
                    description: "No hay empleados activos con sueldo para procesar en este período.",
                });
                setIsCentralizing(false);
                return;
            }

            const companyConfig: Partial<Company> = {
                id: selectedCompany.id,
                name: selectedCompany.name,
                remunerationExpenseAccount: selectedCompany.remunerationExpenseAccount,
                salariesPayableAccount: selectedCompany.salariesPayableAccount,
                afpPayableAccount: selectedCompany.afpPayableAccount,
                healthPayableAccount: selectedCompany.healthPayableAccount,
                unemploymentInsurancePayableAccount: selectedCompany.unemploymentInsurancePayableAccount,
            };

            const voucher = await centralizeRemunerations({
                payrollSummary: {
                    totalBaseSalary: Math.round(totalBaseSalary),
                    totalAfpDiscount: Math.round(totalAfpDiscount),
                    totalHealthDiscount: Math.round(totalHealthDiscount),
                    totalNetSalary: Math.round(totalNetSalary),
                },
                accounts,
                companyConfig,
                period: { month: parseInt(month), year: parseInt(year) },
            });
            
             if (firestore) {
                const collectionPath = `companies/${selectedCompany.id}/vouchers`;
                await addDoc(collection(firestore, collectionPath), voucher);
                toast({
                    title: "Centralización Exitosa",
                    description: "Se ha creado el comprobante de remuneraciones en estado borrador.",
                    action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/vouchers')}>Ver Comprobantes</Button>
                });
            }

        } catch (error: any) {
            console.error("Error during centralization:", error);
            toast({
                variant: "destructive",
                title: "Error de IA",
                description: "El asistente de IA no pudo generar el comprobante: " + error.message,
            });
        } finally {
            setIsCentralizing(false);
        }
    };


    return (
      <Card>
        <CardHeader>
          <CardTitle>Centralización de Remuneraciones</CardTitle>
          <CardDescription>Genera el asiento contable a partir de las liquidaciones de sueldo procesadas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-lg mx-auto">
                <h3 className="text-lg font-semibold">Generar Asiento de Centralización</h3>
                <div className="w-full space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="month">Mes</Label>
                            <Select value={month} onValueChange={setMonth} disabled={isCentralizing || loading}>
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
                         <div className="space-y-2 text-left">
                            <Label htmlFor="year">Año</Label>
                            <Select value={year} onValueChange={setYear} disabled={isCentralizing || loading}>
                                <SelectTrigger id="year">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                            {currentYear-i}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                        Esta acción creará un comprobante de traspaso con el resumen de las remuneraciones del período seleccionado.
                    </p>
                </div>
                <Button className="w-full" onClick={handleCentralize} disabled={!selectedCompany || loading || isCentralizing}>
                    {loading ? "Cargando datos..." : (isCentralizing ? "Centralizando..." : "Centralizar Remuneraciones")}
                </Button>
            </div>
        </CardContent>
      </Card>
    )
  }
