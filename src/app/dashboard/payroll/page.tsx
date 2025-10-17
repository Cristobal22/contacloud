
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
import { useToast } from '@/hooks/use-toast';

  type SimulatedPayroll = {
      id: string;
      employeeName: string;
      period: string;
      baseSalary: number;
      discounts: number;
      netSalary: number;
  }

export default function PayrollPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const { toast } = useToast();

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
        const healthMap = new Map(healthEntities.map(h => [h.name, h.mandatoryContribution]));

        return employees.filter(emp => emp.status === 'Active' && emp.baseSalary).map(emp => {
            const baseSalary = emp.baseSalary || 0;
            
            const afpPercentage = emp.afp ? (afpMap.get(emp.afp) || 10) / 100 : 0; // Default to 10% if not found
            const healthPercentage = (emp.healthSystem === 'Fonasa' ? 7 : (healthMap.get(emp.healthSystem || '') || 7)) / 100; // 7% for Fonasa or Isapre

            const afpDiscount = baseSalary * afpPercentage;
            const healthDiscount = baseSalary * healthPercentage;
            // Simplified: does not include unemployment insurance or other taxes yet
            const totalDiscounts = afpDiscount + healthDiscount;

            const netSalary = baseSalary - totalDiscounts;

            return {
                id: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                period: currentPeriod,
                baseSalary: baseSalary,
                discounts: totalDiscounts,
                netSalary: netSalary,
            };
        });
    }, [employees, afpEntities, healthEntities]);
    
    const handleViewDetails = () => {
        toast({
            title: "Función en desarrollo",
            description: "La vista detallada de la liquidación aún no está implementada.",
        });
    }


    return (
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
                    <TableCell className="text-right text-destructive">-${Math.round(payroll.discounts).toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-right font-bold">${Math.round(payroll.netSalary).toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={handleViewDetails}>
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
    )
}
