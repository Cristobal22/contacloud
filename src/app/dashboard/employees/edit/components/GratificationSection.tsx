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

interface GratificationSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
}

export function GratificationSection({ employee, handleFieldChange }: GratificationSectionProps) {
    return (
        <section id="gratification" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">4. Gratificación Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={employee.gratificationType} onValueChange={v => handleFieldChange('gratificationType', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sin Gratificación">Sin Gratificación</SelectItem>
                            <SelectItem value="Tope Legal">Tope Legal</SelectItem>
                            <SelectItem value="Automatico">Automático (25%)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Monto Calculado</Label>
                    <Input type="number" value={employee.gratification} disabled />
                </div>
            </div>
        </section>
    );
}