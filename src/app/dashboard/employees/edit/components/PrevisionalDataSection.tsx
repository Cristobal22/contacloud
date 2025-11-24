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
import { Checkbox } from '@/components/ui/checkbox';
import type { Employee, AfpEntity, HealthEntity } from '@/lib/types';

interface PrevisionalDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
    uniqueAfpEntities: AfpEntity[];
    uniqueHealthEntities: HealthEntity[];
}

export function PrevisionalDataSection({ employee, handleFieldChange, uniqueAfpEntities, uniqueHealthEntities }: PrevisionalDataSectionProps) {
    return (
        <section id="previsional-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">5. Datos Previsionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
               <div className="space-y-2 col-span-2">
                   <Label>Sistema de Salud</Label>
                   <Select value={employee.healthSystem || ''} onValueChange={v => handleFieldChange('healthSystem', v)}>
                       <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                       <SelectContent>{uniqueHealthEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                   </Select>
               </div>
                <div className="space-y-2">
                    <Label>Tipo Cotización</Label>
                    <Select value={employee.healthContributionType || ''} onValueChange={v => handleFieldChange('healthContributionType', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Porcentaje">%</SelectItem>
                            <SelectItem value="Monto Fijo">UF</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Valor Cotización</Label>
                    <Input type="number" value={employee.healthContributionValue || ''} onChange={e => handleFieldChange('healthContributionValue', parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="space-y-2 col-span-2">
                     <Label>AFP</Label>
                     <Select value={employee.afp || ''} onValueChange={v => handleFieldChange('afp', v)}>
                         <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                         <SelectContent>{uniqueAfpEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                     </Select>
                 </div>
                <div className="space-y-2">
                    <Label>Tipo Contrato (Seg. Cesantía)</Label>
                    <Select value={employee.unemploymentInsuranceType || ''} onValueChange={v => handleFieldChange('unemploymentInsuranceType', v)}>
                        <SelectTrigger><SelectValue placeholder="..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Indefinido">Indefinido</SelectItem>
                            <SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem>
                            <SelectItem value="No Aplica">No Aplica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                    <Checkbox id="hasUnemploymentInsurance" checked={!!employee.hasUnemploymentInsurance} onCheckedChange={c => handleFieldChange('hasUnemploymentInsurance', c)} />
                    <Label htmlFor="hasUnemploymentInsurance">Acogido a Seguro de Cesantía</Label>
                </div>
            </div>
        </section>
    );
}