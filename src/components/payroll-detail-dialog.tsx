
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableRow, TableFooter as TableFooterOriginal } from "@/components/ui/table"
import type { Employee } from "@/lib/types"
import React from "react";

export type SimulatedPayroll = {
    id: string;
    employeeName: string;
    period: string;
    baseSalary: number;
    gratification: number;
    otherEarnings: number;
    totalEarnings: number;
    afpDiscount: number;
    healthDiscount: number;
    otherDiscounts: number;
    totalDiscounts: number;
    netSalary: number;
}

interface PayrollDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        payroll: SimulatedPayroll;
        employee: Employee;
    } | null;
}

const formatCurrency = (value: number) => {
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function PayrollDetailDialog({ isOpen, onClose, data }: PayrollDetailDialogProps) {
    if (!data) return null;

    const { payroll, employee } = data;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Liquidación de Sueldo (Simulación)</DialogTitle>
                    <DialogDescription>
                        Detalle para {employee.firstName} {employee.lastName} para el período de {payroll.period}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div><span className="font-medium">Nombre:</span> {employee.firstName} {employee.lastName}</div>
                        <div><span className="font-medium">RUT:</span> {employee.rut}</div>
                        <div><span className="font-medium">Cargo:</span> {employee.position}</div>
                        <div><span className="font-medium">Período:</span> {payroll.period}</div>
                    </div>
                    
                    <Separator />

                    <div className="grid grid-cols-2 gap-8">
                        {/* Haberes */}
                        <div>
                            <h4 className="font-semibold mb-2">HABERES</h4>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Sueldo Base</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell>Gratificación Legal</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.gratification)}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell>Otros Haberes</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.otherEarnings)}</TableCell>
                                    </TableRow>
                                </TableBody>
                                <TableFooterOriginal>
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell>Total Haberes</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.totalEarnings)}</TableCell>
                                    </TableRow>
                                </TableFooterOriginal>
                            </Table>
                        </div>
                        {/* Descuentos */}
                         <div>
                            <h4 className="font-semibold mb-2">DESCUENTOS</h4>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Cotización AFP ({employee.afp})</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.afpDiscount)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Cotización Salud ({employee.healthSystem})</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.healthDiscount)}</TableCell>
                                    </TableRow>
                                </TableBody>
                                <TableFooterOriginal>
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell>Total Descuentos</TableCell>
                                        <TableCell className="text-right">{formatCurrency(payroll.totalDiscounts)}</TableCell>
                                    </TableRow>
                                </TableFooterOriginal>
                            </Table>
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="flex justify-between items-center bg-primary text-primary-foreground p-3 rounded-md">
                        <span className="text-lg font-bold">ALCANCE LÍQUIDO</span>
                        <span className="text-lg font-bold">{formatCurrency(payroll.netSalary)}</span>
                    </div>

                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
