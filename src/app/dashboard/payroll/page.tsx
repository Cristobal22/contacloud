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
  import { MoreHorizontal, PlusCircle } from "lucide-react"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { useCollection } from '@/firebase';
  import type { Employee, AfpEntity, HealthEntity } from '@/lib/types';

  type SimulatedPayroll = {
      id: string;
      employeeName: string;
      period: string;
      baseSalary: number;
      discounts: number;
      netSalary: number;
  }

export default function PayrollPage({ companyId }: { companyId?: string }) {
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
      path: `companies/${companyId}/employees`,
      companyId: companyId 
    });

    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });

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


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Liquidaciones de Sueldo</CardTitle>
                        <CardDescription>Consulta y gestiona las liquidaciones de sueldo de la empresa.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" disabled={!companyId}>
                        <PlusCircle className="h-4 w-4" />
                        Procesar Nuevas Liquidaciones
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Sueldo Base</TableHead>
                    <TableHead className="text-right">Descuentos</TableHead>
                    <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                    <TableHead>
                    <span className="sr-only">Acciones</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">Cargando liquidaciones...</TableCell>
                    </TableRow>
                )}
                {!loading && simulatedPayrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                    <TableCell>{payroll.period}</TableCell>
                    <TableCell className="text-right">${Math.round(payroll.baseSalary).toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-right text-destructive">-${Math.round(payroll.discounts).toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-right font-bold">${Math.round(payroll.netSalary).toLocaleString('es-CL')}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>Ver Detalle</DropdownMenuItem>
                            <DropdownMenuItem>Descargar Liquidación</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Anular</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
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
