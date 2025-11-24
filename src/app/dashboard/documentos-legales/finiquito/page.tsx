'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Firebase and Data Hooks
import { useCollection } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';

// Date and Utility Libraries
import { differenceInMonths, addYears, differenceInDays, differenceInYears } from 'date-fns';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

// Sub-components
import { FiniquitoEmployeeSelector } from '@/components/finiquito/FiniquitoEmployeeSelector';
import { FiniquitoCalculationInputs } from '@/components/finiquito/FiniquitoCalculationInputs';
import { FiniquitoCalculationResults } from '@/components/finiquito/FiniquitoCalculationResults';
import { FiniquitoDocumentDataForm } from '@/components/finiquito/FiniquitoDocumentDataForm';
import { FiniquitoPreview } from '@/components/finiquito/FiniquitoPreview';

// PDF & Content Generation
import { generateSettlementPDF, type FiniquitoFormData } from '@/lib/settlement-generator';
import { generarContenidoFiniquito, type FiniquitoContent, type FiniquitoData } from '@/templates/finiquito';
import { numeroAFrase } from '@/lib/number-to-words';

// --- Helper Functions ---
const formatCurrency = (value: number = 0): string => new Intl.NumberFormat('es-CL').format(Math.round(value));
const formatDateToLongString = (date: Date | undefined): string => {
  if (!date) return '';
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adjustedDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
};

const defaultFormData: Partial<FiniquitoFormData> = {
    nombreTrabajador: '',
    rutTrabajador: '',
    domicilioTrabajador: '',
    cargoTrabajador: '',
    oficioTrabajador: '',
    nombreEmpleador: '',
    rutEmpleador: '',
    domicilioEmpleador: '',
    fechaInicio: undefined,
    fechaTermino: new Date(),
    causalTermino: 'Artículo 161, inciso primero: Necesidades de la empresa.',
    baseIndemnizacion: 0,
    anosServicio: 0,
    diasFeriado: 0,
    incluyeMesAviso: true,
    causalHechos: '',
    remuneracionesPendientes: 0,
    otrosHaberes: 0,
    descuentosPrevisionales: 0,
    otrosDescuentos: 0,
    formaPago: 'Transferencia Electrónica',
    fechaPago: new Date(),
    ciudadFirma: '',
    ministroDeFe: 'Notario Público de [Ciudad del Notario]',
};

export default function FiniquitoGeneratorPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ path: selectedCompany ? `companies/${selectedCompany.id}/employees` : undefined });
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
    const { toast } = useToast();

    const [formErrors, setFormErrors] = React.useState<string[]>([]);
    const [userModifiedFields, setUserModifiedFields] = React.useState<Set<string>>(new Set());
    const [formData, setFormData] = React.useState<Partial<FiniquitoFormData>>(defaultFormData);
    const [calculated, setCalculated] = React.useState({
        indemnizacionAnos: 0,
        indemnizacionSustitutiva: 0,
        feriadoLegal: 0,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalAPagar: 0,
    });
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [previewContent, setPreviewContent] = React.useState<FiniquitoContent | null>(null);


    React.useEffect(() => {
        if (selectedCompany) {
            setFormData(prev => ({ 
                ...prev, 
                nombreEmpleador: selectedCompany.name, 
                rutEmpleador: selectedCompany.rut, 
                domicilioEmpleador: selectedCompany.address || '',
                ciudadFirma: selectedCompany.commune || '' 
            }));
        }
    }, [selectedCompany]);

    const selectedEmployee = React.useMemo(() => employees?.find(e => e.id === selectedEmployeeId) || null, [employees, selectedEmployeeId]);

    React.useEffect(() => {
        setUserModifiedFields(new Set()); 
        if (selectedEmployee && selectedCompany) {
            const startDate = selectedEmployee.contractStartDate instanceof Timestamp ? selectedEmployee.contractStartDate.toDate() : undefined;
            const endDate = selectedEmployee.contractEndDate instanceof Timestamp ? selectedEmployee.contractEndDate.toDate() : new Date();
            
            setFormData(prev => ({ 
                ...defaultFormData, 
                nombreEmpleador: selectedCompany.name,
                rutEmpleador: selectedCompany.rut,
                domicilioEmpleador: selectedCompany.address || '',
                ciudadFirma: selectedCompany.commune || '',
                nombreTrabajador: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                rutTrabajador: selectedEmployee.rut,
                domicilioTrabajador: selectedEmployee.address || '',
                cargoTrabajador: selectedEmployee.position || '',
                oficioTrabajador: selectedEmployee.profession || '',
                fechaInicio: startDate, 
                fechaTermino: endDate,
            }));
        } else if (selectedCompany) {
             setFormData(prev => ({
                ...defaultFormData,
                nombreEmpleador: selectedCompany.name,
                rutEmpleador: selectedCompany.rut,
                domicilioEmpleador: selectedCompany.address || '',
                ciudadFirma: selectedCompany.commune || '',
             }));
        }
    }, [selectedEmployee, selectedCompany]);

    React.useEffect(() => {
        if (!formData.fechaInicio || !formData.fechaTermino) return;
        const startDate = formData.fechaInicio;
        const endDate = formData.fechaTermino;
        if (!userModifiedFields.has('anosServicio')) {
            const totalMonths = differenceInMonths(endDate, startDate);
            let serviceYears = Math.floor(totalMonths / 12);
            if (totalMonths % 12 >= 6) serviceYears += 1;
            handleInputChange('anosServicio', serviceYears);
        }
        if (!userModifiedFields.has('diasFeriado')) {
            const yearsDiff = differenceInYears(endDate, startDate);
            let lastAnniversary = addYears(startDate, yearsDiff);
            if (lastAnniversary > endDate) lastAnniversary = addYears(lastAnniversary, -1);
            const daysSinceAnniversary = differenceInDays(endDate, lastAnniversary);
            const proportionalVacationDays = (daysSinceAnniversary / 365) * 15;
            handleInputChange('diasFeriado', parseFloat(proportionalVacationDays.toFixed(2)));
        }
    }, [formData.fechaInicio, formData.fechaTermino, userModifiedFields]);

    React.useEffect(() => {
        const errors: string[] = [];
        if (!selectedEmployeeId) errors.push("Debes seleccionar un empleado.");
        if (!formData.fechaInicio) errors.push("La fecha de inicio es obligatoria.");
        if (!formData.fechaTermino) errors.push("La fecha de término es obligatoria.");
        if (!formData.baseIndemnizacion || formData.baseIndemnizacion <= 0) errors.push("El sueldo base para indemnización debe ser mayor a cero.");

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

    const isDocumentFormComplete = !!(
        formData.domicilioTrabajador && 
        formData.domicilioEmpleador &&
        formData.cargoTrabajador &&
        formData.oficioTrabajador &&
        formData.formaPago &&
        formData.fechaPago &&
        formData.ciudadFirma &&
        formData.ministroDeFe
    );
    
    // Combines all data for PDF generation or preview
    const getFullTemplateData = (): FiniquitoData => {
        return {
            empleador_nombre: formData.nombreEmpleador || '',
            empleador_rut: formData.rutEmpleador || '',
            empleador_domicilio: formData.domicilioEmpleador || '',
            trabajador_nombre: formData.nombreTrabajador || '',
            trabajador_rut: formData.rutTrabajador || '',
            trabajador_domicilio: formData.domicilioTrabajador || '',
            trabajador_oficio: formData.oficioTrabajador || '',
            trabajador_cargo: formData.cargoTrabajador || '',
            trabajador_fecha_inicio: formatDateToLongString(formData.fechaInicio),
            trabajador_fecha_termino: formatDateToLongString(formData.fechaTermino),
            causal_articulo_y_nombre: formData.causalTermino || '',
            causal_hechos_fundamento: formData.causalHechos || 'Hechos no especificados.',
            monto_indemnizacion_anios_servicio: formatCurrency(calculated.indemnizacionAnos),
            monto_indemnizacion_aviso_previo: formatCurrency(calculated.indemnizacionSustitutiva),
            dias_feriado_proporcional: (formData.diasFeriado || 0).toFixed(2),
            monto_feriado_proporcional: formatCurrency(calculated.feriadoLegal),
            monto_remuneraciones_pendientes: formatCurrency(formData.remuneracionesPendientes),
            monto_otros_haberes: formatCurrency(formData.otrosHaberes),
            monto_total_haberes: formatCurrency(calculated.totalHaberes),
            monto_descuento_previsional: formatCurrency(formData.descuentosPrevisionales),
            monto_otros_descuentos: formatCurrency(formData.otrosDescuentos),
            monto_total_descuentos: formatCurrency(calculated.totalDescuentos),
            monto_total_numerico: formatCurrency(calculated.totalAPagar),
            monto_total_en_palabras: numeroAFrase(calculated.totalAPagar),
            forma_pago: formData.formaPago || '',
            fecha_pago: formatDateToLongString(formData.fechaPago || new Date()),
            ciudadFirma: formData.ciudadFirma || '',
            ministro_de_fe: formData.ministroDeFe || '',
        };
    };

    const handlePreview = () => {
        if (!isDocumentFormComplete) {
            toast({ title: "Datos Faltantes", description: "Por favor completa todos los campos del formulario para ver la vista previa.", variant: "destructive" });
            return;
        }
        const templateData = getFullTemplateData();
        const content = generarContenidoFiniquito(templateData);
        setPreviewContent(content);
        setIsPreviewOpen(true);
    };

    const handleGeneratePDF = async () => {
        if (!isDocumentFormComplete) {
            toast({ title: "Datos Faltantes", description: "Por favor completa todos los campos del formulario para generar el documento.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const fullData: FiniquitoFormData = {
                ...defaultFormData,
                ...formData,
                ...calculated,
            } as FiniquitoFormData;

            const pdfBytes = await generateSettlementPDF(fullData);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, `Finiquito - ${formData.nombreTrabajador}.pdf`);

            toast({ title: "Éxito", description: "El documento PDF se ha generado y descargado." });

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Error", description: "Hubo un problema al generar el PDF. Revisa la consola para más detalles.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateDOCX = async () => {
        if (!isDocumentFormComplete) {
            toast({ title: "Datos Faltantes", description: "Por favor completa todos los campos del formulario para generar el documento.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const templateData = getFullTemplateData();
            const content = generarContenidoFiniquito(templateData);
            
            // Convert the structured content to a plain text string for the main body
            const mainContentString = [
                content.title,
                '\n',
                content.comparecencia.replace(/\*\*/g, ''), // Remove bold markers
                ...content.clausulas.map(c => `\n\n${c.titulo}\n${c.contenido.replace(/\*\*/g, '')}`),
            ].join('\n');

            const response = await fetch('/api/generate-docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mainContent: mainContentString,
                    signatures: content.firmas
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate DOCX');
            }

            const blob = await response.blob();
            saveAs(blob, `Finiquito - ${templateData.trabajador_nombre}.docx`);

            toast({ title: "Éxito", description: "El documento DOCX se ha generado y descargado." });

        } catch (error) {
            console.error("Error generating DOCX:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast({ title: "Error", description: `Hubo un problema al generar el DOCX: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsGenerating(false);
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
                    <FiniquitoEmployeeSelector 
                        employees={employees} 
                        loading={employeesLoading} 
                        selectedEmployeeId={selectedEmployeeId} 
                        onSelectEmployee={setSelectedEmployeeId} 
                    />
                    {selectedEmployeeId && (
                         <FiniquitoCalculationInputs formData={formData} handleInputChange={handleInputChange} />
                    )}
                </CardContent>
            </Card>

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

            {formErrors.length === 0 && selectedEmployeeId && (
                <>
                    <Card>
                        <CardHeader><CardTitle>Paso 2: Revisa los Resultados y Ajusta los Montos</CardTitle></CardHeader>
                        <CardContent>
                            <FiniquitoCalculationResults calculated={calculated} formData={formData} handleInputChange={handleInputChange} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Paso 3: Completa los Datos y Genera el Documento</CardTitle>
                            <CardDescription>Esta información es necesaria para generar el texto legal del finiquito.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FiniquitoDocumentDataForm 
                                formData={formData} 
                                handleInputChange={handleInputChange}
                                isFormComplete={isDocumentFormComplete}
                                onGeneratePDF={handleGeneratePDF}
                                onGenerateDOCX={handleGenerateDOCX} // Pass the new DOCX handler
                                onPreview={handlePreview}
                                isGenerating={isGenerating}
                            />
                        </CardContent>
                    </Card>
                </>
            )}
            
            <FiniquitoPreview 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                content={previewContent}
            />
        </div>
    );
}
