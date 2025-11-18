'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { FiniquitoFormData } from '@/lib/settlement-generator';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

const InfoTooltip = ({ children }: { children: React.ReactNode }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help ml-1.5" />
        </TooltipTrigger>
        <TooltipContent>
            <p className="max-w-xs p-2">{children}</p>
        </TooltipContent>
    </Tooltip>
);

interface FiniquitoCalculationResultsProps {
    calculated: {
        indemnizacionAnos: number;
        indemnizacionSustitutiva: number;
        feriadoLegal: number;
        totalHaberes: number;
        totalDescuentos: number;
        totalAPagar: number;
    };
    formData: Partial<FiniquitoFormData>;
    handleInputChange: (field: keyof FiniquitoFormData, value: any, isManual?: boolean) => void;
}

export function FiniquitoCalculationResults({ calculated, formData, handleInputChange }: FiniquitoCalculationResultsProps) {
    return (
        <TooltipProvider>
            <div className="space-y-4 text-sm">
                <h4 className="font-semibold">HABERES</h4>
                <div className="pl-4 border-l-2 space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center"><p>Indemnización por Años de Servicio</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización) x (Años de Servicio).</InfoTooltip></div>
                        <p>{formatCurrency(calculated.indemnizacionAnos)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center"><p>Indemnización Sustitutiva (Mes de Aviso)</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización) x 1.</InfoTooltip></div>
                        <p>{formatCurrency(calculated.indemnizacionSustitutiva)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center"><p>Feriado Legal y Proporcional</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización / 30) x (Días de Feriado).</InfoTooltip></div>
                        <p>{formatCurrency(calculated.feriadoLegal)}</p>
                    </div>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center"><Label htmlFor="remuneracionesPendientes">Remuneraciones Pendientes</Label><InfoTooltip>Incluye días trabajados en el mes del despido, comisiones, bonos u otros pagos adeudados.</InfoTooltip></div>
                        <Input id="remuneracionesPendientes" className="h-8 max-w-[150px] text-right" type="number" value={formData.remuneracionesPendientes ?? 0} onChange={e => handleInputChange('remuneracionesPendientes', parseFloat(e.target.value), true)} />
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center"><Label htmlFor="otrosHaberes">Otros Haberes</Label><InfoTooltip>Cualquier otro monto a favor del trabajador no incluido en otras categorías.</InfoTooltip></div>
                        <Input id="otrosHaberes" className="h-8 max-w-[150px] text-right" type="number" value={formData.otrosHaberes ?? 0} onChange={e => handleInputChange('otrosHaberes', parseFloat(e.target.value), true)} />
                    </div>
                </div>
                <div className="flex justify-between items-center font-bold pt-2"><p>TOTAL HABERES</p><p>{formatCurrency(calculated.totalHaberes)}</p></div>
                
                <h4 className="font-semibold pt-4">DESCUENTOS LEGALES</h4>
                <div className="pl-4 border-l-2 space-y-3">
                     <div className="flex justify-between items-center">
                         <div className="flex items-center"><Label htmlFor="descuentosPrevisionales">Aporte Previsional sobre Indemnizaciones</Label><InfoTooltip>Descuento del saldo de la Cuenta Individual de Cesantía (CIC) del trabajador (Aplica para Art. 161).</InfoTooltip></div>
                        <Input id="descuentosPrevisionales" className="h-8 max-w-[150px] text-right" type="number" value={formData.descuentosPrevisionales ?? 0} onChange={e => handleInputChange('descuentosPrevisionales', parseFloat(e.target.value), true)} />
                    </div>
                    <div className="flex justify-between items-center">
                         <div className="flex items-center"><Label htmlFor="otrosDescuentos">Otros Descuentos</Label><InfoTooltip>Descuentos como préstamos del empleador, anticipos, etc. Deben estar justificados.</InfoTooltip></div>
                        <Input id="otrosDescuentos" className="h-8 max-w-[150px] text-right" type="number" value={formData.otrosDescuentos ?? 0} onChange={e => handleInputChange('otrosDescuentos', parseFloat(e.target.value), true)} />
                    </div>
                </div>
                <div className="flex justify-between items-center font-bold pt-2"><p>TOTAL DESCUENTOS</p><p>{formatCurrency(calculated.totalDescuentos)}</p></div>

                <div className="flex justify-between items-center font-bold text-xl pt-4 text-blue-600"><p>TOTAL A PAGAR</p><p>{formatCurrency(calculated.totalAPagar)}</p></div>
            </div>
        </TooltipProvider>
    );
}
