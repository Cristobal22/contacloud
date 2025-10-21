
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
import { AfpEntity, Company, Employee, HealthEntity, type Account, type Payroll, type VoucherEntry } from "@/lib/types";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useRouter } from 'next/navigation';
import { es } from 'date-fns/locale';
import { format, lastDayOfMonth } from 'date-fns';

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
     const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>({ 
      path: selectedCompany ? `companies/${selectedCompany.id}/payrolls` : undefined,
      companyId: selectedCompany?.id 
    });
    
    const loading = accountsLoading || employeesLoading || payrollsLoading;

    const handleCentralize = async () => {
        if (!selectedCompany || !payrolls || !accounts) {
            toast({
                variant: "destructive",
                title: "Faltan datos",
                description: "No se puede procesar sin una empresa, liquidaciones o plan de cuentas.",
            });
            return;
        }

        setIsCentralizing(true);
        
        try {
            const periodPayrolls = payrolls.filter(p => p.year === parseInt(year) && p.month === parseInt(month));

            if (periodPayrolls.length === 0) {
                toast({
                    variant: "destructive",
                    title: "Sin Datos",
                    description: "No hay liquidaciones procesadas para el período seleccionado.",
                });
                setIsCentralizing(false);
                return;
            }

            const totalBaseSalary = periodPayrolls.reduce((sum, p) => sum + p.baseSalary, 0);
            const totalTaxable = periodPayrolls.reduce((sum, p) => sum + p.taxableEarnings, 0);
            const totalAfpDiscount = periodPayrolls.reduce((sum, p) => sum + p.afpDiscount, 0);
            const totalHealthDiscount = periodPayrolls.reduce((sum, p) => sum + p.healthDiscount, 0);
            const totalUnemploymentInsuranceDiscount = periodPayrolls.reduce((sum, p) => sum + (p.unemploymentInsuranceDiscount || 0), 0);
            const totalNetSalary = periodPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

            // Gasto = Total Haberes Imponibles
            const totalExpense = totalTaxable;

            const entries: VoucherEntry[] = [];
            
            // DEBE
            if (selectedCompany.remunerationExpenseAccount) {
                 entries.push({
                    id: `entry-${Date.now()}-1`,
                    account: selectedCompany.remunerationExpenseAccount,
                    description: 'Gasto por Remuneraciones',
                    debit: Math.round(totalExpense),
                    credit: 0
                });
            } else {
                throw new Error("La cuenta de gasto para remuneraciones no está configurada.");
            }

            // HABER
            if(selectedCompany.salariesPayableAccount) {
                 entries.push({
                    id: `entry-${Date.now()}-2`,
                    account: selectedCompany.salariesPayableAccount,
                    description: 'Sueldos por Pagar',
                    debit: 0,
                    credit: Math.round(totalNetSalary)
                });
            } else {
                 throw new Error("La cuenta de sueldos por pagar no está configurada.");
            }
             if(selectedCompany.afpPayableAccount && totalAfpDiscount > 0) {
                 entries.push({
                    id: `entry-${Date.now()}-3`,
                    account: selectedCompany.afpPayableAccount,
                    description: 'Leyes Sociales por Pagar (AFP)',
                    debit: 0,
                    credit: Math.round(totalAfpDiscount)
                });
            }
             if(selectedCompany.healthPayableAccount && totalHealthDiscount > 0) {
                 entries.push({
                    id: `entry-${Date.now()}-4`,
                    account: selectedCompany.healthPayableAccount,
                    description: 'Leyes Sociales por Pagar (Salud)',
                    debit: 0,
                    credit: Math.round(totalHealthDiscount)
                });
            }
            if(selectedCompany.unemploymentInsurancePayableAccount && totalUnemploymentInsuranceDiscount > 0) {
                 entries.push({
                    id: `entry-${Date.now()}-5`,
                    account: selectedCompany.unemploymentInsurancePayableAccount,
                    description: 'Leyes Sociales por Pagar (Seguro Cesantía)',
                    debit: 0,
                    credit: Math.round(totalUnemploymentInsuranceDiscount)
                });
            }

            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

            // Balanceo
            if (Math.round(totalDebit) !== Math.round(totalCredit)) {
                 const difference = totalDebit - totalCredit;
                 // Asume que el gasto es la diferencia. Esto puede ajustarse.
                 const expenseAccount = entries.find(e => e.account === selectedCompany.remunerationExpenseAccount);
                 if (expenseAccount) {
                     expenseAccount.debit -= difference;
                 }
            }
            
            const periodDate = new Date(parseInt(year), parseInt(month) - 1);
            const lastDay = lastDayOfMonth(periodDate);
            const monthName = format(periodDate, 'MMMM', { locale: es });

            const voucher = {
                date: format(lastDay, 'yyyy-MM-dd'),
                description: `Centralización Remuneraciones ${monthName} ${year}`,
                companyId: selectedCompany.id,
                status: 'Borrador' as const,
                type: 'Traspaso' as const,
                total: entries.reduce((sum, e) => sum + e.debit, 0),
                entries: entries
            };
            
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
                title: "Error en Centralización",
                description: "No se pudo generar el comprobante: " + error.message,
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
