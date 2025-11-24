'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Employee, CostCenter } from '@/lib/types';

interface ContractDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
    costCenters: CostCenter[] | null | undefined;
}

export function ContractDataSection({ employee, handleFieldChange, costCenters }: ContractDataSectionProps) {
    return (
        <section id="contract-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">2. Datos Contractuales y de Remuneración</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input value={employee.position || ''} onChange={e => handleFieldChange('position', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Tipo Contrato</Label>
                    <Select value={employee.contractType || ''} onValueChange={v => handleFieldChange('contractType', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Indefinido">Indefinido</SelectItem>
                            <SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem>
                            <SelectItem value="Por Obra o Faena">Por Obra o Faena</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input type="date" value={employee.contractStartDate || ''} onChange={e => handleFieldChange('contractStartDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Fecha Término</Label>
                    <Input type="date" value={employee.contractEndDate || ''} onChange={e => handleFieldChange('contractEndDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Horas Semanales</Label>
                    <Input type="number" value={employee.weeklyHours || ''} onChange={e => handleFieldChange('weeklyHours', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Jornada</Label>
                    <Select value={employee.workday || ''} onValueChange={v => handleFieldChange('workday', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Completa">Completa</SelectItem>
                            <SelectItem value="Parcial">Parcial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Centro de Costo</Label>
                    <Select value={employee.costCenterId || ''} onValueChange={v => handleFieldChange('costCenterId', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>{costCenters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={employee.status || ''} onValueChange={v => handleFieldChange('status', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Activo</SelectItem>
                            <SelectItem value="Inactive">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Sueldo Base</Label>
                    <Input type="number" value={employee.baseSalary || ''} onChange={e => handleFieldChange('baseSalary', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Movilización</Label>
                    <Input type="number" value={employee.mobilization || ''} onChange={e => handleFieldChange('mobilization', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Colación</Label>
                    <Input type="number" value={employee.collation || ''} onChange={e => handleFieldChange('collation', parseFloat(e.target.value) || 0)} />
                </div>
            </div>
        </section>
    );
}