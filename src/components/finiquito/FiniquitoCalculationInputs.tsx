'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"; // <-- IMPORTACIÓN AÑADIDA
import { CalendarIcon, HelpCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FiniquitoFormData } from '@/lib/settlement-generator';

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

interface FiniquitoCalculationInputsProps {
    formData: Partial<FiniquitoFormData>;
    handleInputChange: (field: keyof FiniquitoFormData, value: any, isManual?: boolean) => void;
}

export function FiniquitoCalculationInputs({ formData, handleInputChange }: FiniquitoCalculationInputsProps) {
    return (
        <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaInicio && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.fechaInicio ? format(formData.fechaInicio, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaInicio} onSelect={date => handleInputChange('fechaInicio', date, true)} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Término</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaTermino && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.fechaTermino ? format(formData.fechaTermino, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaTermino} onSelect={date => handleInputChange('fechaTermino', date, true)} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Causal de Término</Label>
                    <Select value={formData.causalTermino || ''} onValueChange={value => handleInputChange('causalTermino', value, true)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Artículo 159, n° 1: Mutuo acuerdo de las partes.">Art. 159, N°1: Mutuo acuerdo</SelectItem>
                            <SelectItem value="Artículo 159, n° 2: Renuncia del trabajador.">Art. 159, N°2: Renuncia</SelectItem>
                            <SelectItem value="Artículo 159, n° 4: Vencimiento del plazo convenido.">Art. 159, N°4: Vencimiento de plazo</SelectItem>
                            <SelectItem value="Artículo 159, n° 5: Conclusión del trabajo o servicio.">Art. 159, N°5: Conclusión de servicio</SelectItem>
                            <SelectItem value="Artículo 160, n° 1, letra a: Falta de probidad.">Art. 160, N°1a: Falta de probidad</SelectItem>
                            <SelectItem value="Artículo 160, n° 7: Incumplimiento grave de las obligaciones.">Art. 160, N°7: Incumplimiento grave</SelectItem>
                            <SelectItem value="Artículo 161, inciso primero: Necesidades de la empresa.">Art. 161: Necesidades de la empresa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label>Hechos que Fundamentan la Causal</Label>
                    <Textarea value={formData.causalHechos || ''} onChange={e => handleInputChange('causalHechos', e.target.value, true)} placeholder="Describe los hechos que justifican la causal de término de contrato..." />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center"><Label htmlFor="baseIndemnizacion">Sueldo Base para Indemnización</Label><InfoTooltip>Corresponde a la última remuneración mensual devengada (sueldo, comisiones, bonos, etc.). Tiene un tope legal de 90 UF. El sistema sugiere este valor desde la última liquidación, pero puede ser ajustado.</InfoTooltip></div>
                    <Input id="baseIndemnizacion" type="number" value={formData.baseIndemnizacion || 0} onChange={e => handleInputChange('baseIndemnizacion', parseFloat(e.target.value), true)} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center"><Label htmlFor="anosServicio">Años de Servicio a Indemnizar</Label><InfoTooltip>El sistema calcula los años de servicio desde la fecha de inicio. Se cuenta un año completo si la fracción es de 6 meses o más. El tope legal es de 11 años.</InfoTooltip></div>
                    <Input id="anosServicio" type="number" value={formData.anosServicio || 0} onChange={e => handleInputChange('anosServicio', parseInt(e.target.value), true)} placeholder="0" />
                </div>
                <div className="space-y-2">
                     <div className="flex items-center"><Label htmlFor="diasFeriado">Días de Feriado Proporcional</Label><InfoTooltip>Días de vacaciones acumulados y no tomados, incluyendo los días proporcionales del último período. El sistema lo calcula automáticamente, pero puedes ajustarlo si es necesario.</InfoTooltip></div>
                    <Input id="diasFeriado" type="number" value={formData.diasFeriado || 0} onChange={e => handleInputChange('diasFeriado', parseFloat(e.target.value), true)} placeholder="0" />
                </div>
                 <div className="flex items-center space-x-2 md:col-span-3">
                    <Checkbox id="incluyeMesAviso" checked={formData.incluyeMesAviso} onCheckedChange={checked => handleInputChange('incluyeMesAviso', checked, true)} />
                     <div className="flex items-center"><Label htmlFor="incluyeMesAviso">Incluir Indemnización Sustitutiva del Aviso Previo (Mes de Aviso)</Label><InfoTooltip>Aplica principalmente para la causal de Necesidades de la Empresa (Art. 161) si el despido no se avisó con 30 días de anticipación. Equivale a un mes de la base de indemnización.</InfoTooltip></div>
                </div>
            </div>
        </TooltipProvider>
    );
}
