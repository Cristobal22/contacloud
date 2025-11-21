'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PayrollDraft, Employee } from '@/lib/types';
import { VariableBonosManager } from './VariableBonosManager';

// El estado de un empleado, incluyendo su borrador y si se está recalculando.
interface EmployeeStatus {
    employee: Employee;
    draft: PayrollDraft | null;
    error: string | null;
    isRecalculating?: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface PayrollDraftsTableProps {
    statuses: EmployeeStatus[];
    year: number; // Año para calcular los días del mes
    month: number; // Mes para calcular los días del mes
    onDraftChange: (employeeId: string, field: keyof PayrollDraft, value: any) => void;
    onPreview: (draft: PayrollDraft) => void;
    onRecalculate: (employeeId: string) => void; 
}

export function PayrollDraftsTable({ statuses, year, month, onDraftChange, onPreview, onRecalculate }: PayrollDraftsTableProps) {
    if (!statuses || statuses.length === 0) {
        return null;
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    const handleNumericChange = (
        employeeId: string, 
        field: keyof PayrollDraft, 
        value: string,
        isDaysField: boolean = false,
        otherDaysValue: number = 0
    ) => {
        let numericValue = parseInt(value, 10);

        if (isNaN(numericValue) || numericValue < 0) {
            numericValue = 0;
        }

        if (isDaysField) {
            if (numericValue + otherDaysValue > daysInMonth) {
                numericValue = daysInMonth - otherDaysValue;
            }
        }

        onDraftChange(employeeId, field, numericValue);
    };


    return (
        <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">Novedades del Mes</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Sueldo Base</TableHead>
                        <TableHead className="w-[120px] text-right">Días Trab.</TableHead>
                        <TableHead className="w-[120px] text-right">Días Ausencia</TableHead>
                        <TableHead className="w-[150px] text-center">Bonos Variables</TableHead>
                        <TableHead className="w-[140px] text-right">H. Extra (50%)</TableHead>
                        <TableHead className="w-[140px] text-right">H. Extra (100%)</TableHead>
                        <TableHead className="w-[120px] text-right">Anticipos</TableHead>
                        <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {statuses.map(status => {
                        const draft = status.draft;
                        if (!draft) return null;

                        return (
                            <TableRow key={status.employee.id}>
                                <TableCell>{draft.employeeName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(draft.baseSalary)}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="text-right" 
                                        value={draft.workedDays || ''} 
                                        onChange={e => handleNumericChange(draft.employeeId, 'workedDays', e.target.value, true, draft.absentDays || 0)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="text-right" 
                                        value={draft.absentDays || ''} 
                                        onChange={e => handleNumericChange(draft.employeeId, 'absentDays', e.target.value, true, draft.workedDays || 0)} 
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <VariableBonosManager draft={draft} onUpdate={(b) => onDraftChange(draft.employeeId, 'variableBonos', b)}>
                                        <Button variant="outline" size="sm">{(draft.variableBonos?.reduce((s, b) => s + b.monto, 0) || 0) > 0 ? formatCurrency(draft.variableBonos.reduce((s, b) => s + b.monto, 0)) : 'Agregar'}</Button>
                                    </VariableBonosManager>
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="text-right" 
                                        value={draft.overtimeHours50 || ''} 
                                        onChange={e => handleNumericChange(draft.employeeId, 'overtimeHours50', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="text-right" 
                                        value={draft.overtimeHours100 || ''} 
                                        onChange={e => handleNumericChange(draft.employeeId, 'overtimeHours100', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        className="text-right" 
                                        value={draft.advances || ''} 
                                        onChange={e => handleNumericChange(draft.employeeId, 'advances', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(draft.netSalary || 0)}</TableCell>
                                <TableCell className="text-right space-x-2 whitespace-nowrap">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => onRecalculate(status.employee.id)}
                                        disabled={status.isRecalculating}
                                    >
                                        {status.isRecalculating ? 'Calculando...' : 'Recalcular'}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => onPreview(draft)}>Vista Previa</Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
