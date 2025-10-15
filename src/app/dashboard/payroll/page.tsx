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
  import type { Employee } from '@/lib/types';

  type SimulatedPayroll = {
      id: string;
      employeeName: string;
      period: string;
      baseSalary: number;
      discounts: number;
      netSalary: number;
  }

export default function PayrollPage({ companyId }: { companyId?: string }) {
    const { data: employees, loading } = useCollection<Employee>({ 
      path: `companies/${companyId}/employees`,
      companyId: companyId 
    });

    const simulatedPayrolls = React.useMemo(() => {
        if (!employees) return [];
        const currentPeriod = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' });
        
        return employees.filter(emp => emp.status === 'Active' && emp.baseSalary).map(emp => {
            const baseSalary = emp.baseSalary || 0;
            const discounts = baseSalary * 0.20; // 20% mock discount
            const netSalary = baseSalary - discounts;
            return {
                id: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                period: currentPeriod,
                baseSalary: baseSalary,
                discounts: discounts,
                netSalary: netSalary,
            };
        });
    }, [employees]);


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
                    <TableCell className="text-right">${payroll.baseSalary.toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-right text-destructive">-${payroll.discounts.toLocaleString('es-CL')}</TableCell>
                    <TableCell className="text-right font-bold">${payroll.netSalary.toLocaleString('es-CL')}</TableCell>
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
