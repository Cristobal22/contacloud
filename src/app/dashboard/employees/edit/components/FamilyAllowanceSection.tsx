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
    return (
        <section id="family-allowance" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">6. Asignación Familiar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center space-x-2">
                    <Checkbox id="hasFamilyAllowance" checked={employee.hasFamilyAllowance} onCheckedChange={c => handleFieldChange('hasFamilyAllowance', c)} />
                    <Label htmlFor="hasFamilyAllowance">Aplica Asignación Familiar</Label>
                </div>
                <div className="space-y-2">
                    <Label>Cargas</Label>
                    <Input type="number" value={employee.familyDependents} onChange={e => handleFieldChange('familyDependents', parseInt(e.target.value) || 0)} disabled={!employee.hasFamilyAllowance} />
                </div>
                <div className="space-y-2">
                    <Label>Tramo</Label>
                    <Select value={employee.familyAllowanceBracket} onValueChange={v => handleFieldChange('familyAllowanceBracket', v)} disabled={!employee.hasFamilyAllowance}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{['A','B','C','D'].map(t => <SelectItem key={t} value={t}>Tramo {t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
        </section>
    );
}