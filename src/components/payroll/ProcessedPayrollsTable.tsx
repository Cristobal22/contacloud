'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Payroll } from '@/lib/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface ProcessedPayrollsTableProps {
    payrolls: Payroll[];
    onPreview: (payroll: Payroll) => void;
}

export function ProcessedPayrollsTable({ payrolls, onPreview }: ProcessedPayrollsTableProps) {
    if (!payrolls || payrolls.length === 0) {
        return <div className="text-center text-gray-500 py-4">No se encontraron liquidaciones procesadas para este período.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Sueldo Base</TableHead>
                        <TableHead className="text-right">Haberes</TableHead>
                        <TableHead className="text-right">Descuentos</TableHead>
                        <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payrolls.map(payroll => (
                        <TableRow key={payroll.id}>
                            <TableCell>{payroll.employeeName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payroll.totalEarnings)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payroll.totalDiscounts)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(payroll.netSalary)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => onPreview(payroll)}>Vista Previa</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
