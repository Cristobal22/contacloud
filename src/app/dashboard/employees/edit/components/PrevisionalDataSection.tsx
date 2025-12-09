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
import type { Employee, AfpEntity, HealthEntity, RegimenPrevisional } from '@/lib/types';

interface PrevisionalDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
    uniqueAfpEntities: AfpEntity[];
    uniqueHealthEntities: HealthEntity[];
}

export function PrevisionalDataSection({ employee, handleFieldChange, uniqueAfpEntities, uniqueHealthEntities }: PrevisionalDataSectionProps) {
    
    const isIsapre = employee.healthSystem && employee.healthSystem !== 'FONASA';
    const isAfpRegime = employee.regimenPrevisional === 'AFP';

    const handleRegimenChange = (value: RegimenPrevisional) => {
        handleFieldChange('regimenPrevisional', value);
        if (value === 'INP') {
            handleFieldChange('afp', null);
            handleFieldChange('hasUnemploymentInsurance', false);
        } else {
            handleFieldChange('hasUnemploymentInsurance', true);
        }
    };
    
    return (
        <section id="previsional-data" className="space-y-6">
            <h3 className="text-lg font-medium border-b pb-2">5. Datos Previsionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6 items-start">

                <div className="space-y-2 col-span-2">
                   <Label htmlFor="regimen">Régimen Previsional</Label>
                   <Select value={employee.regimenPrevisional || ''} onValueChange={(v: RegimenPrevisional) => handleRegimenChange(v)}>
                       <SelectTrigger id="regimen"><SelectValue placeholder="Selecciona un régimen..."/></SelectTrigger>
                       <SelectContent>
                           <SelectItem value="AFP">AFP (Capitalización Individual)</SelectItem>
                           <SelectItem value="INP">INP (Antiguo Sistema)</SelectItem>
                       </SelectContent>
                   </Select>
                </div>

                 <div className={`space-y-2 col-span-2 ${!isAfpRegime ? 'opacity-50' : ''}`}>
                     <Label htmlFor="afp">Institución AFP</Label>
                     <Select value={employee.afp || ''} onValueChange={v => handleFieldChange('afp', v)} disabled={!isAfpRegime}>
                         <SelectTrigger id="afp"><SelectValue placeholder={isAfpRegime ? "Selecciona una AFP..." : "No aplica"}/></SelectTrigger>
                         <SelectContent>{uniqueAfpEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                     </Select>
                 </div>

               <div className="space-y-2 col-span-2">
                   <Label htmlFor="health-system">Sistema de Salud</Label>
                   <Select value={employee.healthSystem || ''} onValueChange={v => handleFieldChange('healthSystem', v)}>
                       <SelectTrigger id="health-system"><SelectValue placeholder="Selecciona un sistema..."/></SelectTrigger>
                       <SelectContent>{uniqueHealthEntities.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                   </Select>
               </div>
               {/* Spacer to align the next block if isapre is not selected */}
               {!isIsapre && <div className="col-span-2 md:block hidden"/>}

                {isIsapre && (
                    <>
                        <div className="space-y-2 col-span-2">
                            <Label>Nº Contrato ISAPRE</Label>
                            <Input value={employee.healthContractNumber || ''} onChange={e => handleFieldChange('healthContractNumber', e.target.value)} placeholder="Nº de Contrato" />
                        </div>
                         <div className="col-span-2" /> {/* Spacer div */}
                        <div className="space-y-2">
                            <Label>Moneda del Plan</Label>
                            <Select value={employee.healthPlanType || ''} onValueChange={v => handleFieldChange('healthPlanType', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UF">UF</SelectItem>
                                    <SelectItem value="Pesos">$ (CLP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Monto del Plan</Label>
                            <Input type="number" value={employee.healthPlanAmount || ''} onChange={e => handleFieldChange('healthPlanAmount', parseFloat(e.target.value) || 0)} placeholder="Monto" />
                        </div>
                    </>
                )}
                
                <div className="col-span-4 border-t pt-6"/>

                 <div className="flex items-center space-x-2 col-span-2">
                    <Checkbox id="isPensioner" checked={!!employee.isPensioner} onCheckedChange={c => handleFieldChange('isPensioner', c)} />
                    <Label htmlFor="isPensioner" className="font-normal">Marcar si el empleado es pensionado</Label>
                </div>

                <div className={`flex items-center space-x-2 col-span-2 ${!isAfpRegime ? 'opacity-50' : ''}`}>
                    <Checkbox id="hasUnemploymentInsurance" checked={employee.hasUnemploymentInsurance === false ? false : true} onCheckedChange={c => handleFieldChange('hasUnemploymentInsurance', c)} disabled={!isAfpRegime} />
                    <Label htmlFor="hasUnemploymentInsurance" className="font-normal">Acogido a Seguro de Cesantía</Label>
                </div>
            </div>
        </section>
    );
}