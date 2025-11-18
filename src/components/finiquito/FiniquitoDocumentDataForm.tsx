'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react"; // Import Loader2
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FiniquitoFormData } from '@/lib/settlement-generator';

// Update props interface
interface FiniquitoDocumentDataFormProps {
    formData: Partial<FiniquitoFormData>;
    handleInputChange: (field: keyof FiniquitoFormData, value: any, isManual?: boolean) => void;
    isFormComplete: boolean;
    onGeneratePDF: () => void;
    onPreview: () => void; // Add onPreview
    isGenerating: boolean; // Add isGenerating
}

export function FiniquitoDocumentDataForm({ 
    formData, 
    handleInputChange, 
    isFormComplete, 
    onGeneratePDF, 
    onPreview, 
    isGenerating 
}: FiniquitoDocumentDataFormProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... all the input fields remain the same ... */}
                 <div className="space-y-2">
                    <Label htmlFor="domicilioTrabajador">Domicilio del Trabajador</Label>
                    <Input id="domicilioTrabajador" value={formData.domicilioTrabajador || ''} onChange={e => handleInputChange('domicilioTrabajador', e.target.value, true)} placeholder="Ej: Av. Siempreviva 742, Springfield" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="domicilioEmpleador">Domicilio del Empleador</Label>
                    <Input id="domicilioEmpleador" value={formData.domicilioEmpleador || ''} onChange={e => handleInputChange('domicilioEmpleador', e.target.value, true)} placeholder="Ej: Av. Providencia 123, Santiago" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cargoTrabajador">Cargo del Trabajador</Label>
                    <Input id="cargoTrabajador" value={formData.cargoTrabajador || ''} onChange={e => handleInputChange('cargoTrabajador', e.target.value, true)} placeholder="Ej: Analista Contable" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="oficioTrabajador">Profesión u Oficio del Trabajador</Label>
                    <Input id="oficioTrabajador" value={formData.oficioTrabajador || ''} onChange={e => handleInputChange('oficioTrabajador', e.target.value, true)} placeholder="Ej: Contador Auditor" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="formaPago">Forma de Pago</Label>
                    <Input id="formaPago" value={formData.formaPago || ''} onChange={e => handleInputChange('formaPago', e.target.value, true)} />
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Pago</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaPago && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.fechaPago ? format(formData.fechaPago, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaPago} onSelect={date => handleInputChange('fechaPago', date, true)} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ciudadFirma">Ciudad de la Firma del Documento</Label>
                    <Input id="ciudadFirma" value={formData.ciudadFirma || ''} onChange={e => handleInputChange('ciudadFirma', e.target.value, true)} placeholder="Ej: Santiago" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ministroDeFe">Ratificado ante (Ministro de Fe)</Label>
                    <Input id="ministroDeFe" value={formData.ministroDeFe || ''} onChange={e => handleInputChange('ministroDeFe', e.target.value, true)} />
                </div>
            </div>
            {/* Updated buttons section */}
            <div className="flex justify-end items-center gap-4 pt-4">
                <Button variant="outline" size="lg" onClick={onPreview} disabled={!isFormComplete || isGenerating}>
                    Vista Previa
                </Button>
                <Button size="lg" onClick={onGeneratePDF} disabled={!isFormComplete || isGenerating}>
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                        </>
                    ) : (
                        'Generar Documento PDF'
                    )}
                </Button>
            </div>
        </div>
    );
}
