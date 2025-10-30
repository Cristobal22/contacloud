'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCollection, useFirestore } from '@/firebase';
import type { Employee, Company } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateSettlementPDF, type FiniquitoFormData } from '@/lib/settlement-generator';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

export default function FiniquitoGeneratorPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: selectedCompany ? `companies/${selectedCompany.id}/employees` : undefined });
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
    const [isEmployeeSelectorOpen, setEmployeeSelectorOpen] = React.useState(false);

    const { toast } = useToast();

    const [formData, setFormData] = React.useState<Partial<FiniquitoFormData>>({
        nombreTrabajador: '',
        rutTrabajador: '',
        nombreEmpleador: selectedCompany?.name || '',
        rutEmpleador: selectedCompany?.rut || '',
        fechaInicio: undefined,
        fechaTermino: new Date(),
        causalTermino: 'Artículo 161, inciso primero: Necesidades de la empresa.',
        baseIndemnizacion: 0,
        anosServicio: 0,
        diasFeriado: 0,
        incluyeMesAviso: true,
        remuneracionesPendientes: 0,
        otrosHaberes: 0,
        descuentosPrevisionales: 0,
        otrosDescuentos: 0,
        causalHechos: '',
        formaPago: 'Transferencia Electrónica',
        fechaPago: new Date(),
        ciudadFirma: selectedCompany?.commune || '',
        ministroDeFe: 'Notario Público de [Ciudad del Notario]',
    });

    const [calculated, setCalculated] = React.useState({
        indemnizacionAnos: 0,
        indemnizacionSustitutiva: 0,
        feriadoLegal: 0,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalAPagar: 0,
    });

    React.useEffect(() => {
        if (selectedCompany) {
            setFormData(prev => ({
                ...prev,
                nombreEmpleador: selectedCompany.name,
                rutEmpleador: selectedCompany.rut,
                ciudadFirma: selectedCompany.commune || '',
            }));
        }
    }, [selectedCompany]);

    const selectedEmployee = React.useMemo(() => 
        employees?.find(e => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]);

    React.useEffect(() => {
        if (selectedEmployee) {
            setFormData(prev => ({
                ...prev,
                nombreTrabajador: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                rutTrabajador: selectedEmployee.rut,
                fechaInicio: selectedEmployee.startDate ? new Date(selectedEmployee.startDate) : undefined,
            }));
        }
    }, [selectedEmployee]);

    React.useEffect(() => {
        const base = formData.baseIndemnizacion || 0;
        const anos = formData.anosServicio || 0;
        const diasFeriado = formData.diasFeriado || 0;

        const indemnizacionAnos = base * anos;
        const indemnizacionSustitutiva = formData.incluyeMesAviso ? base : 0;
        const feriadoLegal = (base / 30) * diasFeriado;

        const totalHaberes = indemnizacionAnos + indemnizacionSustitutiva + feriadoLegal + (formData.remuneracionesPendientes || 0) + (formData.otrosHaberes || 0);
        const totalDescuentos = (formData.descuentosPrevisionales || 0) + (formData.otrosDescuentos || 0);
        const totalAPagar = totalHaberes - totalDescuentos;

        setCalculated({
            indemnizacionAnos,
            indemnizacionSustitutiva,
            feriadoLegal,
            totalHaberes,
            totalDescuentos,
            totalAPagar,
        });
    }, [formData]);

    const handleInputChange = (field: keyof FiniquitoFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleGeneratePDF = async () => {
        if (!selectedEmployee || !selectedCompany) {
            toast({ title: "Error", description: "Debes seleccionar una empresa y un empleado.", variant: "destructive" });
            return;
        }

        const finalFormData: FiniquitoFormData = {
            ...formData,
            ...calculated,
            // Ensure all fields have a default value to satisfy the type
            nombreTrabajador: formData.nombreTrabajador || '',
            rutTrabajador: formData.rutTrabajador || '',
            nombreEmpleador: formData.nombreEmpleador || '',
            rutEmpleador: formData.rutEmpleador || '',
            fechaInicio: formData.fechaInicio || new Date(),
            fechaTermino: formData.fechaTermino || new Date(),
            causalTermino: formData.causalTermino || '',
            baseIndemnizacion: formData.baseIndemnizacion || 0,
            anosServicio: formData.anosServicio || 0,
            diasFeriado: formData.diasFeriado || 0,
            incluyeMesAviso: formData.incluyeMesAviso || false,
            remuneracionesPendientes: formData.remuneracionesPendientes || 0,
            otrosHaberes: formData.otrosHaberes || 0,
            descuentosPrevisionales: formData.descuentosPrevisionales || 0,
            otrosDescuentos: formData.otrosDescuentos || 0,
            causalHechos: formData.causalHechos || '',
            formaPago: formData.formaPago || '',
            fechaPago: formData.fechaPago || new Date(),
            ciudadFirma: formData.ciudadFirma || '',
            ministroDeFe: formData.ministroDeFe || '',
        };

        try {
            const pdfBytes = await generateSettlementPDF(finalFormData, selectedEmployee, selectedCompany);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Finiquito - ${finalFormData.nombreTrabajador}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: "Éxito", description: "El PDF del finiquito ha sido generado." });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Error", description: "No se pudo generar el PDF. Revisa la consola para más detalles.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Generador de Finiquitos</CardTitle>
                    <CardDescription>Completa los datos para generar el documento de finiquito de un trabajador.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Employee Selector */}
                    <div className="space-y-2">
                         <Label>Seleccionar Persona</Label>
                         <Popover open={isEmployeeSelectorOpen} onOpenChange={setEmployeeSelectorOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isEmployeeSelectorOpen} className="w-full justify-between font-normal">
                                    {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.rut})` : "Seleccionar empleado..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar empleado..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                                        <CommandGroup>
                                            {employeesLoading && <CommandItem>Cargando...</CommandItem>}
                                            {employees?.map(employee => (
                                                <CommandItem key={employee.id} value={`${employee.firstName} ${employee.lastName} ${employee.rut}`}
                                                    onSelect={() => {
                                                        setSelectedEmployeeId(employee.id!);
                                                        setEmployeeSelectorOpen(false);
                                                    }}>
                                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0")} />
                                                    {employee.firstName} {employee.lastName} <span className='text-muted-foreground ml-2'>{employee.rut}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Main Form Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Filled by employee selection */}
                        <div className="space-y-2"><Label>Nombre del Trabajador</Label><Input value={formData.nombreTrabajador} disabled /></div>
                        <div className="space-y-2"><Label>RUT del Trabajador</Label><Input value={formData.rutTrabajador} disabled /></div>
                        <div className="space-y-2"><Label>Fecha de Inicio</Label><Input value={formData.fechaInicio ? format(formData.fechaInicio, 'PPP', { locale: es }) : ''} disabled /></div>
                        
                        {/* Termination data */}
                        <div className="space-y-2">
                            <Label>Fecha de Término</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaTermino && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.fechaTermino ? format(formData.fechaTermino, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaTermino} onSelect={date => handleInputChange('fechaTermino', date)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Causal de Término</Label>
                            <Select value={formData.causalTermino} onValueChange={value => handleInputChange('causalTermino', value)}>
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
                            <Textarea value={formData.causalHechos} onChange={e => handleInputChange('causalHechos', e.target.value)} placeholder="Describe los hechos que justifican la causal de término de contrato..." />
                        </div>

                         {/* Calculation base */}
                        <div className="space-y-2"><Label>Sueldo Base para Indemnización</Label><Input type="number" value={formData.baseIndemnizacion} onChange={e => handleInputChange('baseIndemnizacion', parseFloat(e.target.value))} placeholder="0" /></div>
                        <div className="space-y-2"><Label>Años de Servicio a Indemnizar</Label><Input type="number" value={formData.anosServicio} onChange={e => handleInputChange('anosServicio', parseInt(e.target.value))} placeholder="0" /></div>
                        <div className="space-y-2"><Label>Días de Feriado Proporcional</Label><Input type="number" value={formData.diasFeriado} onChange={e => handleInputChange('diasFeriado', parseFloat(e.target.value))} placeholder="0" /></div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox id="incluyeMesAviso" checked={formData.incluyeMesAviso} onCheckedChange={checked => handleInputChange('incluyeMesAviso', checked)} />
                        <Label htmlFor="incluyeMesAviso">Incluir Indemnización Sustitutiva del Aviso Previo (Mes de Aviso)</Label>
                    </div>

                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Haberes */}
                <Card>
                    <CardHeader><CardTitle>Haberes</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center"><p>Indemnización por Años de Servicio</p><p className="font-mono">{formatCurrency(calculated.indemnizacionAnos)}</p></div>
                        <div className="flex justify-between items-center"><p>Indemnización Sustitutiva (Aviso Previo)</p><p className="font-mono">{formatCurrency(calculated.indemnizacionSustitutiva)}</p></div>
                        <div className="flex justify-between items-center"><p>Feriado Legal y Proporcional</p><p className="font-mono">{formatCurrency(calculated.feriadoLegal)}</p></div>
                        <div className="flex justify-between items-center"><p>Remuneraciones Pendientes</p><Input type="number" value={formData.remuneracionesPendientes} onChange={e => handleInputChange('remuneracionesPendientes', parseFloat(e.target.value))} className="max-w-[150px] text-right font-mono" /></div>
                        <div className="flex justify-between items-center"><p>Otros Haberes</p><Input type="number" value={formData.otrosHaberes} onChange={e => handleInputChange('otrosHaberes', parseFloat(e.target.value))} className="max-w-[150px] text-right font-mono"/></div>
                    </CardContent>
                    <CardFooter className="font-bold text-lg flex justify-between items-center"><p>Total Haberes</p><p className="font-mono">{formatCurrency(calculated.totalHaberes)}</p></CardFooter>
                </Card>

                {/* Descuentos */}
                <Card>
                    <CardHeader><CardTitle>Descuentos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center"><p>Descuentos Previsionales</p><Input type="number" value={formData.descuentosPrevisionales} onChange={e => handleInputChange('descuentosPrevisionales', parseFloat(e.target.value))} className="max-w-[150px] text-right font-mono" /></div>
                        <div className="flex justify-between items-center"><p>Otros Descuentos</p><Input type="number" value={formData.otrosDescuentos} onChange={e => handleInputChange('otrosDescuentos', parseFloat(e.target.value))} className="max-w-[150px] text-right font-mono"/></div>
                    </CardContent>
                    <CardFooter className="font-bold text-lg flex justify-between items-center"><p>Total Descuentos</p><p className="font-mono">{formatCurrency(calculated.totalDescuentos)}</p></CardFooter>
                </Card>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Finalización y Pago</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label>Forma de Pago</Label>
                        <Select value={formData.formaPago} onValueChange={value => handleInputChange('formaPago', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Transferencia Electrónica">Transferencia Electrónica</SelectItem>
                                <SelectItem value="Vale Vista">Vale Vista</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha de Pago</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaPago && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.fechaPago ? format(formData.fechaPago, "PPP", { es }) : <span>Seleccionar fecha</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaPago} onSelect={date => handleInputChange('fechaPago', date)} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2"><Label>Ciudad de la Firma</Label><Input value={formData.ciudadFirma} onChange={e => handleInputChange('ciudadFirma', e.target.value)} /></div>
                     <div className="space-y-2 md:col-span-2">
                        <Label>Ratificado Ante (Ministro de Fe)</Label>
                        <Input value={formData.ministroDeFe} onChange={e => handleInputChange('ministroDeFe', e.target.value)} placeholder="Ej: Notario Público de [Ciudad]" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 dark:bg-green-950">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-2xl text-green-800 dark:text-green-200">Total a Pagar</CardTitle>
                    <p className="text-3xl font-bold font-mono text-green-700 dark:text-green-300">{formatCurrency(calculated.totalAPagar)}</p>
                </CardHeader>
                <CardFooter>
                    <Button size="lg" className="w-full gap-2" onClick={handleGeneratePDF} disabled={!selectedEmployee}>
                        Generar PDF del Finiquito
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
