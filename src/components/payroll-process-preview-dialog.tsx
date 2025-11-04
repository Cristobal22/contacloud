'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface Totals {
    totalEarnings: number;
    afpDiscount: number;
    healthDiscount: number;
    unemploymentInsuranceDiscount: number;
    iut: number;
    advances: number;
    netSalary: number;
}

interface PayrollProcessPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing: boolean;
    totals: Totals | null;
    period: string;
}

export function PayrollProcessPreviewDialog({ 
    isOpen, 
    onClose, 
    onConfirm,
    isProcessing,
    totals,
    period
}: PayrollProcessPreviewDialogProps) {
    if (!totals) return null;

    const leyesSociales = totals.afpDiscount + totals.healthDiscount + totals.unemploymentInsuranceDiscount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Confirmar y Centralizar Remuneraciones</DialogTitle>
                    <DialogDescription>
                        Estás a punto de finalizar las liquidaciones para el período <span className="font-semibold">{period}</span>.
                        Se generará el siguiente comprobante contable. Revisa los montos antes de confirmar.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <h4 className="text-sm font-semibold mb-2">Asiento de Centralización (Vista Previa)</h4>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cuenta Contable</TableHead>
                                    <TableHead className="text-right">Debe</TableHead>
                                    <TableHead className="text-right">Haber</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Remuneraciones (Gasto)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.totalEarnings)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="pl-8 text-muted-foreground">Anticipo de Sueldo (Activo)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.advances)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="pl-8 text-muted-foreground">Leyes Sociales por Pagar (Pasivo)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(leyesSociales)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="pl-8 text-muted-foreground">Impuesto Único por Pagar (Pasivo)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.iut)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="pl-8 text-muted-foreground">Sueldos por Pagar (Pasivo)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.netSalary)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                    <Button onClick={onConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar y Centralizar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
