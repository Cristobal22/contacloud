'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Employee } from '@/lib/types';

interface SilDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
}

export function SilDataSection({ employee, handleFieldChange }: SilDataSectionProps) {
    return (
        <section id="sil-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">8. Licencia Médical (SIL)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="hasSubmittedSIL" 
                        checked={employee.hasSubmittedSIL || false} 
                        onCheckedChange={c => handleFieldChange('hasSubmittedSIL', c)}
                    />
                    <Label htmlFor="hasSubmittedSIL">¿Presentó Licencia Médica este mes?</Label>
                </div>
                
                {employee.hasSubmittedSIL && (
                    <div className="space-y-2">
                        <Label htmlFor="silFolio">Folio de la Licencia</Label>
                        <Input 
                            id="silFolio"
                            type="text" 
                            value={employee.silFolio || ''} 
                            onChange={e => handleFieldChange('silFolio', e.target.value)} 
                            placeholder="Ingrese el folio SIL"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}