
'use client';

import React from 'react';
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
  import { Button } from "@/components/ui/button"
  import { Eye } from "lucide-react"
  import { useCollection } from '@/firebase';
  import type { Employee, AfpEntity, HealthEntity } from '@/lib/types';
import { SelectedCompanyContext } from '../layout';
import { PayrollDetailDialog, type SimulatedPayroll } from '@/components/payroll-detail-dialog';

const MINIMUM_WAGE = 500000; // As of July 2024, should be updated from monthly params
const GRATIFICATION_CAP_MONTHLY = Math.round((4.75 * MINIMUM_WAGE) / 12);


export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;

    const [selectedPayroll, setSelectedPayroll] = React.useState<{ payroll: SimulatedPayroll, employee: Employee } | null>(null);

    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
      path: companyId ? `companies/${companyId}/employees` : undefined,
      companyId: companyId 
    });

    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({
        path: 'afp-entities'
    });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({
        path: 'health-entities'
    });

    const loading = employeesLoading || afpLoading || healthLoading;

    const simulatedPayrolls = React.useMemo(() => {
        if (!employees || !afpEntities || !healthEntities) return [];
        
        const currentPeriod = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' });
        
        const afpMap = new Map(afpEntities.map(afp => [afp.name, afp.mandatoryContribution]));
        
        return employees.filter(emp => emp.status === 'Active' && emp.baseSalary).map(emp => {
            const baseSalary = emp.baseSalary || 0;
            
            let gratification = emp.gratification || 0;
            if (emp.gratificationType === 'Automatico') {
                const calculatedGratification = baseSalary * 0.25;
                gratification = Math.min(calculatedGratification, GRATIFICATION_CAP_MONTHLY);
            }

            const otherEarnings = (emp.mobilization || 0) + (emp.collation || 0);
            const totalEarnings = baseSalary + gratification + otherEarnings;

            const afpPercentage = emp.afp ? (afpMap.get(emp.afp) || 10) / 100 : 0;
            let healthDiscount = 0;
            if (emp.healthSystem === 'Fonasa') {
                healthDiscount = totalEarnings * 0.07;
            } else if (emp.healthContributionType === 'Porcentaje') {
                healthDiscount = totalEarnings * ((emp.healthContributionValue || 7) / 100);
            } else { // Monto Fijo en UF - Placeholder, needs UF value
                healthDiscount = (emp.healthContributionValue || 0) * 37000; // Placeholder UF value
            }
            
            const afpDiscount = totalEarnings * afpPercentage;
            
            const totalDiscounts = afpDiscount + healthDiscount;

            const netSalary = totalEarnings - totalDiscounts;

            return {
                id: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                period: currentPeriod,
                baseSalary: baseSalary,
                gratification: gratification,
                otherEarnings: otherEarnings,
                totalEarnings: totalEarnings,
                afpDiscount: afpDiscount,
                healthDiscount: healthDiscount,
                otherDiscounts: 0,
                totalDiscounts: totalDiscounts,
                netSalary: netSalary,
            };
        });
    }, [employees, afpEntities, healthEntities]);
    
    const handleViewDetails = (payroll: SimulatedPayroll) => {
        const employee = employees?.find(e => e.id === payroll.id);
        if (employee) {
            setSelectedPayroll({ payroll, employee });
        }
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Simulación de Liquidaciones</CardTitle>
                            <CardDescription>Visualiza una simulación de las liquidaciones de sueldo para el período actual.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Sueldo Base</TableHead>
                        <TableHead className="text-right">Descuentos Legales</TableHead>
                        <TableHead className="text-right font-bold">Sueldo Líquido (Estimado)</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">Cargando simulaciones...</TableCell>
                        </TableRow>
                    )}
                    {!loading && simulatedPayrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                        <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                        <TableCell>{payroll.period}</TableCell>
                        <TableCell className="text-right">${Math.round(payroll.baseSalary).toLocaleString('es-CL')}</TableCell>
                        <TableCell className="text-right text-destructive">-${Math.round(payroll.totalDiscounts).toLocaleString('es-CL')}</TableCell>
                        <TableCell className="text-right font-bold">${Math.round(payroll.netSalary).toLocaleString('es-CL')}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(payroll)}>
                                <Eye className="h-4 w-4 mr-2"/>
                                Ver Detalle
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    {!loading && simulatedPayrolls.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                {!companyId ? "Selecciona una empresa para ver sus liquidaciones." : "No se encontraron empleados activos con sueldo base para procesar."}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <PayrollDetailDialog 
                isOpen={!!selectedPayroll}
                onClose={() => setSelectedPayroll(null)}
                data={selectedPayroll}
            />
        </>
    )
}
