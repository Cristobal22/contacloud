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
import type { Employee } from '@/lib/types';

interface ApvDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
}

export function ApvDataSection({ employee, handleFieldChange }: ApvDataSectionProps) {
    return (
        <section id="apv-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">7. Ahorro Previsional Voluntario (APV)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Institución</Label>
                    <Input value={employee.apvInstitution} onChange={e => handleFieldChange('apvInstitution', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input type="number" value={employee.apvAmount} onChange={e => handleFieldChange('apvAmount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Regimen APV</Label>
                    <Select value={employee.apvRegime} onValueChange={v => handleFieldChange('apvRegime', v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Regimen A">Regimen A</SelectItem>
                            <SelectItem value="Regimen B">Regimen B</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </section>
    );
}