
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PayrollDraft } from '@/lib/types';
import { VariableBonosManager } from './VariableBonosManager'; // Assuming you extract this to its own file

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface PayrollDraftsTableProps {
    drafts: PayrollDraft[];
    onDraftChange: (employeeId: string, field: keyof PayrollDraft, value: any) => void;
    onPreview: (draft: PayrollDraft) => void;
}

export function PayrollDraftsTable({ drafts, onDraftChange, onPreview }: PayrollDraftsTableProps) {
    if (drafts.length === 0) {
        return <div className="text-center h-24 flex items-center justify-center">No hay empleados activos o el período ya fue procesado.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">Novedades del Mes</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Sueldo Base</TableHead>
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
                    {drafts.map(draft => (
                        <TableRow key={draft.employeeId}>
                            <TableCell>{draft.employeeName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(draft.baseSalary)}</TableCell>
                            <TableCell><Input type="number" className="text-right" value={draft.absentDays || ''} onChange={e => onDraftChange(draft.employeeId, 'absentDays', parseInt(e.target.value) || 0)} /></TableCell>
                            <TableCell className="text-center">
                                <VariableBonosManager draft={draft} onUpdate={(b) => onDraftChange(draft.employeeId, 'variableBonos', b)}>
                                    <Button variant="outline" size="sm">{(draft.variableBonos?.reduce((s, b) => s + b.monto, 0) || 0) > 0 ? formatCurrency(draft.variableBonos.reduce((s, b) => s + b.monto, 0)) : 'Agregar'}</Button>
                                </VariableBonosManager>
                            </TableCell>
                            <TableCell><Input type="number" className="text-right" value={draft.overtimeHours50 || ''} onChange={e => onDraftChange(draft.employeeId, 'overtimeHours50', parseInt(e.target.value) || 0)} /></TableCell>
                            <TableCell><Input type="number" className="text-right" value={draft.overtimeHours100 || ''} onChange={e => onDraftChange(draft.employeeId, 'overtimeHours100', parseInt(e.target.value) || 0)} /></TableCell>
                            <TableCell><Input type="number" className="text-right" value={draft.advances || ''} onChange={e => onDraftChange(draft.employeeId, 'advances', parseInt(e.target.value) || 0)} /></TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(draft.netSalary || 0)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => onPreview(draft)}>Vista Previa</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
