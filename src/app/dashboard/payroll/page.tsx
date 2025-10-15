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

  type MockPayroll = {
      id: string;
      employeeName: string;
      period: string;
      baseSalary: number;
      discounts: number;
      netSalary: number;
  }

export default function PayrollPage({ companyId }: { companyId?: string }) {
    const [mockPayrolls, setMockPayrolls] = React.useState<MockPayroll[]>([
        { id: '1', employeeName: 'Juan Pérez', period: 'Octubre 2023', baseSalary: 800000, discounts: 160000, netSalary: 640000 },
        { id: '2', employeeName: 'Ana Gómez', period: 'Octubre 2023', baseSalary: 1200000, discounts: 240000, netSalary: 960000 },
    ]);


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
                {mockPayrolls.map((payroll) => (
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
                {mockPayrolls.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            {!companyId ? "Selecciona una empresa para ver sus liquidaciones." : "No se encontraron liquidaciones para esta empresa."}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    )
}
