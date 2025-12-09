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
import type { Employee } from '@/lib/types';

interface FamilyAllowanceSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
}

export function FamilyAllowanceSection({ employee, handleFieldChange }: FamilyAllowanceSectionProps) {
    const hasFamilyAllowance = employee.familyAllowanceBracket && employee.familyAllowanceBracket !== 'D';

    return (
        <section id="family-allowance" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">6. Asignación Familiar</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="space-y-2">
                    <Label>Tramo</Label>
                    <Select value={employee.familyAllowanceBracket || 'D'} onValueChange={v => handleFieldChange('familyAllowanceBracket', v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{['A','B','C','D'].map(t => <SelectItem key={t} value={t}>Tramo {t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Cargas Normales</Label>
                    <Input type="number" value={employee.normalFamilyDependents || ''} onChange={e => handleFieldChange('normalFamilyDependents', parseInt(e.target.value) || 0)} disabled={!hasFamilyAllowance} />
                </div>
                <div className="space-y-2">
                    <Label>Cargas por Invalidez</Label>
                    <Input type="number" value={employee.invalidityFamilyDependents || ''} onChange={e => handleFieldChange('invalidityFamilyDependents', parseInt(e.target.value) || 0)} disabled={!hasFamilyAllowance} />
                </div>
            </div>
        </section>
    );
}