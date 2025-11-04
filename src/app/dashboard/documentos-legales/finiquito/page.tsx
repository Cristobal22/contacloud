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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, ChevronsUpDown, Check, AlertTriangle, HelpCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCollection, useFirestore } from '@/firebase';
import { functions } from '@/firebase/config'; 
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { Employee, EconomicIndicator } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { cn } from '@/lib/utils';
import { format, differenceInMonths, addYears, differenceInDays, differenceInYears, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateSettlementPDF, type FiniquitoFormData } from '@/lib/settlement-generator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Define a default state object to ensure all fields are controlled from the start.
const defaultFormData: Partial<FiniquitoFormData> = {
    nombreTrabajador: '',
    rutTrabajador: '',
    nombreEmpleador: '',
    rutEmpleador: '',
    fechaInicio: undefined,
    fechaTermino: new Date(),
    causalTermino: 'Artículo 161, inciso primero: Necesidades de la empresa.', // Always initialized
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
    ciudadFirma: '',
    ministroDeFe: 'Notario Público de [Ciudad del Notario]',
};


export default function FiniquitoGeneratorPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const db = useFirestore();
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: selectedCompany ? `companies/${selectedCompany.id}/employees` : undefined });
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
    const [isEmployeeSelectorOpen, setEmployeeSelectorOpen] = React.useState(false);
    const { toast } = useToast();

    const [formErrors, setFormErrors] = React.useState<string[]>([]);
    const [userModifiedFields, setUserModifiedFields] = React.useState<Set<string>>(new Set());

    // Use the default state object for initialization.
    const [formData, setFormData] = React.useState<Partial<FiniquitoFormData>>(defaultFormData);

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
                ciudadFirma: selectedCompany.commune || '' 
            }));
        }
    }, [selectedCompany]);

    const selectedEmployee = React.useMemo(() => employees?.find(e => e.id === selectedEmployeeId) || null, [employees, selectedEmployeeId]);

    React.useEffect(() => {
        setUserModifiedFields(new Set()); 
        if (selectedEmployee) {
            let startDate: Date | undefined = undefined;
            if (selectedEmployee.contractStartDate && (selectedEmployee.contractStartDate as any) instanceof Timestamp) {
                startDate = (selectedEmployee.contractStartDate as any).toDate();
            }
            let endDate: Date = new Date();
            if (selectedEmployee.contractEndDate && (selectedEmployee.contractEndDate as any) instanceof Timestamp) {
                endDate = (selectedEmployee.contractEndDate as any).toDate();
            }
            // Reset to a known-good state when employee changes
            setFormData(prev => ({ 
                ...defaultFormData, // Start with defaults
                nombreEmpleador: selectedCompany?.name || '',
                rutEmpleador: selectedCompany?.rut || '',
                ciudadFirma: selectedCompany?.commune || '',
                nombreTrabajador: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 
                rutTrabajador: selectedEmployee.rut, 
                fechaInicio: startDate, 
                fechaTermino: endDate,
            }));
        } else {
             // When no employee is selected, reset to company defaults
             setFormData(prev => ({
                ...defaultFormData,
                nombreEmpleador: selectedCompany?.name || '',
                rutEmpleador: selectedCompany?.rut || '',
                ciudadFirma: selectedCompany?.commune || '',
             }));
        }
    }, [selectedEmployee, selectedCompany]);

    // --- SUGGEST BASE SALARY USING CLOUD FUNCTION ---
    React.useEffect(() => {
        const suggestBaseSalary = async () => {
            if (!db || !selectedCompany || !selectedEmployee || userModifiedFields.has('baseIndemnizacion')) {
                return;
            }

            try {
                const getLatestPayrollSalary = httpsCallable(functions, 'getLatestPayrollSalary');
                const result: any = await getLatestPayrollSalary({ companyId: selectedCompany.id, employeeId: selectedEmployee.id });
                
                const baseIndemnizacion = result?.data?.baseIndemnizacion ?? null;

                if (baseIndemnizacion === null) {
                    handleInputChange('baseIndemnizacion', 0); 
                    return; 
                }

                const terminationDate = formData.fechaTermino || new Date();
                const year = getYear(terminationDate);
                const month = getMonth(terminationDate) + 1;
                const indicatorId = `${year}-${String(month).padStart(2, '0')}`;
                const indicatorRef = doc(db, `economicIndicators`, indicatorId);
                const indicatorSnap = await getDoc(indicatorRef);

                let suggestedValue = baseIndemnizacion;
                if (indicatorSnap.exists()) {
                    const indicator = indicatorSnap.data() as EconomicIndicator;
                    if (indicator.uf) {
                        const cap = 90 * indicator.uf;
                        suggestedValue = Math.min(baseIndemnizacion, cap);
                    }
                }

                handleInputChange('baseIndemnizacion', Math.round(suggestedValue));
            } catch (error) {
                console.error('Error calling getLatestPayrollSalary function:', error);
                toast({
                    title: "Error de Sugerencia",
                    description: "No se pudo sugerir el sueldo base. Ingréselo manualmente.",
                    variant: "destructive"
                });
            }
        };

        suggestBaseSalary();
    }, [selectedEmployee, selectedCompany, db, userModifiedFields, formData.fechaTermino, toast]);

    // AUTOMATIC CALCULATION OF SERVICE YEARS AND VACATION DAYS
    React.useEffect(() => {
        if (!formData.fechaInicio || !formData.fechaTermino) return;
        const startDate = formData.fechaInicio;
        const endDate = formData.fechaTermino;
        if (!userModifiedFields.has('anosServicio')) {
            const totalMonths = differenceInMonths(endDate, startDate);
            let serviceYears = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            if (remainingMonths >= 6) {
                serviceYears += 1;
            }
            handleInputChange('anosServicio', serviceYears);
        }
        if (!userModifiedFields.has('diasFeriado')) {
            let lastAnniversary = addYears(startDate, differenceInYears(endDate, startDate));
            if (lastAnniversary > endDate) {
                lastAnniversary = addYears(lastAnniversary, -1);
            }
            const daysSinceAnniversary = differenceInDays(endDate, lastAnniversary);
            const proportionalVacationDays = (daysSinceAnniversary / 365) * 15;
            handleInputChange('diasFeriado', parseFloat(proportionalVacationDays.toFixed(2)));
        }
    }, [formData.fechaInicio, formData.fechaTermino, userModifiedFields]);

    React.useEffect(() => {
        const errors: string[] = [];
        if (!selectedEmployeeId) { errors.push("Debes seleccionar un empleado para iniciar el cálculo."); }
        if (!formData.fechaInicio) { errors.push("La fecha de inicio del contrato es necesaria."); }
        if (!formData.fechaTermino) { errors.push("La fecha de término del contrato es necesaria."); }
        if ((formData.baseIndemnizacion === undefined) || formData.baseIndemnizacion <= 0) { errors.push("El sueldo base para indemnización debe ser mayor a cero."); }

        setFormErrors(errors);

        if (errors.length > 0) {
            setCalculated({ indemnizacionAnos: 0, indemnizacionSustitutiva: 0, feriadoLegal: 0, totalHaberes: 0, totalDescuentos: 0, totalAPagar: 0 });
            return;
        }

        const base = formData.baseIndemnizacion || 0;
        const anos = formData.anosServicio || 0;
        const diasFeriado = formData.diasFeriado || 0;
        const indemnizacionAnos = base * anos;
        const indemnizacionSustitutiva = formData.incluyeMesAviso ? base : 0;
        const feriadoLegal = (base / 30) * diasFeriado;
        const totalHaberes = indemnizacionAnos + indemnizacionSustitutiva + feriadoLegal + (formData.remuneracionesPendientes || 0) + (formData.otrosHaberes || 0);
        const totalDescuentos = (formData.descuentosPrevisionales || 0) + (formData.otrosDescuentos || 0);
        const totalAPagar = totalHaberes - totalDescuentos;
        setCalculated({ indemnizacionAnos, indemnizacionSustitutiva, feriadoLegal, totalHaberes, totalDescuentos, totalAPagar });
    }, [formData, selectedEmployeeId]);

    const handleInputChange = (field: keyof FiniquitoFormData, value: any, isManual = false) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (isManual) {
            setUserModifiedFields(prev => new Set(prev).add(field));
        }
    };
    
    const handleGeneratePDF = async () => {
        // PDF generation logic remains the same
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Generador de Finiquitos</CardTitle>
                        <CardDescription>Completa los datos para generar el documento de finiquito de un trabajador.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {formErrors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Faltan Datos para el Cálculo</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-5">
                                        {formErrors.map((error, index) => <li key={index}>{error}</li>)}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
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
                                                        onSelect={() => { setSelectedEmployeeId(employee.id!); setEmployeeSelectorOpen(false); }}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2"><Label>Nombre del Trabajador</Label><Input value={formData.nombreTrabajador || ''} disabled /></div>
                            <div className="space-y-2"><Label>RUT del Trabajador</Label><Input value={formData.rutTrabajador || ''} disabled /></div>
                            <div className="space-y-2">
                                <Label>Fecha de Inicio</Label>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaInicio && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.fechaInicio ? format(formData.fechaInicio, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fechaInicio} onSelect={date => handleInputChange('fechaInicio', date, true)} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha de Término</Label>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.fechaTermino && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.fechaTermino ? format(formData.fechaTermino, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></PopoverTrigger>
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
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="incluyeMesAviso" checked={formData.incluyeMesAviso} onCheckedChange={checked => handleInputChange('incluyeMesAviso', checked, true)} />
                             <div className="flex items-center"><Label htmlFor="incluyeMesAviso">Incluir Indemnización Sustitutiva del Aviso Previo (Mes de Aviso)</Label><InfoTooltip>Aplica principalmente para la causal de Necesidades de la Empresa (Art. 161) si el despido no se avisó con 30 días de anticipación. Equivale a un mes de la base de indemnización.</InfoTooltip></div>
                        </div>
                    </CardContent>
                </Card>

                {formErrors.length === 0 && (
                    <Card>
                        <CardHeader><CardTitle>Resultados del Cálculo</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <h4 className="font-semibold">HABERES</h4>
                            <div className="pl-4 border-l-2 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center"><p>Indemnización por Años de Servicio</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización) x (Años de Servicio). Este monto indemniza los años trabajados.</InfoTooltip></div>
                                    <p>{formatCurrency(calculated.indemnizacionAnos)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center"><p>Indemnización Sustitutiva (Mes de Aviso)</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización) x 1. Se paga si el despido (Art. 161) no se notificó con 30 días de antelación.</InfoTooltip></div>
                                    <p>{formatCurrency(calculated.indemnizacionSustitutiva)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center"><p>Feriado Legal y Proporcional</p><InfoTooltip>Cálculo: (Sueldo Base para Indemnización / 30) x (Días de Feriado). Corresponde al pago de las vacaciones no utilizadas.</InfoTooltip></div>
                                    <p>{formatCurrency(calculated.feriadoLegal)}</p>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center"><Label htmlFor="remuneracionesPendientes">Remuneraciones Pendientes</Label><InfoTooltip>Incluye días trabajados en el mes del despido, comisiones, bonos u otros pagos adeudados.</InfoTooltip></div>
                                    <Input id="remuneracionesPendientes" className="h-8 max-w-[150px] text-right" type="number" value={formData.remuneracionesPendientes ?? 0} onChange={e => handleInputChange('remuneracionesPendientes', parseFloat(e.target.value), true)} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center"><Label htmlFor="otrosHaberes">Otros Haberes</Label><InfoTooltip>Utiliza este campo para añadir cualquier otro monto a favor del trabajador que no esté en las otras categorías.</InfoTooltip></div>
                                    <Input id="otrosHaberes" className="h-8 max-w-[150px] text-right" type="number" value={formData.otrosHaberes ?? 0} onChange={e => handleInputChange('otrosHaberes', parseFloat(e.target.value), true)} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center font-bold pt-2"><p>TOTAL HABERES</p><p>{formatCurrency(calculated.totalHaberes)}</p></div>
                            
                            <h4 className="font-semibold pt-4">DESCUENTOS LEGALES</h4>
                            <div className="pl-4 border-l-2 space-y-3">
                                 <div className="flex justify-between items-center">
                                     <div className="flex items-center"><Label htmlFor="descuentosPrevisionales">Aporte Previsional sobre Indemnizaciones</Label><InfoTooltip>Descuento que realiza la AFC del saldo de la Cuenta Individual de Cesantía (CIC) del trabajador, cuando la causal es Necesidades de la Empresa.</InfoTooltip></div>
                                    <Input id="descuentosPrevisionales" className="h-8 max-w-[150px] text-right" type="number" value={formData.descuentosPrevisionales ?? 0} onChange={e => handleInputChange('descuentosPrevisionales', parseFloat(e.target.value), true)} />
                                </div>
                                <div className="flex justify-between items-center">
                                     <div className="flex items-center"><Label htmlFor="otrosDescuentos">Otros Descuentos</Label><InfoTooltip>Utiliza este campo para descuentos como préstamos del empleador, anticipos no descontados, etc. Deben estar debidamente justificados.</InfoTooltip></div>
                                    <Input id="otrosDescuentos" className="h-8 max-w-[150px] text-right" type="number" value={formData.otrosDescuentos ?? 0} onChange={e => handleInputChange('otrosDescuentos', parseFloat(e.target.value), true)} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center font-bold pt-2"><p>TOTAL DESCUENTOS</p><p>{formatCurrency(calculated.totalDescuentos)}</p></div>

                            <div className="flex justify-between items-center font-bold text-xl pt-4 text-blue-600"><p>TOTAL A PAGAR</p><p>{formatCurrency(calculated.totalAPagar)}</p></div>
                        </CardContent>
                    </Card>
                )}

                 {/* ... Rest of the form for payment, etc. ... */}
            </div>
        </TooltipProvider>
    );
}
