'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { SelectedCompanyContext } from '../../layout';
import { useCollection } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import type { Payroll, Employee, Company, PayrollDraft } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { es } from 'date-fns/locale';
import { validatePreviredData, generatePreviredFileContent, PreviredValidationError, PreviredRow } from '@/lib/previred-generator-corrected';
import { PREVIRED_FIELDS } from '@/lib/previred-fields';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, FileCheck, FileText, Info, Loader2, TriangleAlert, XCircle } from 'lucide-react';

// Main Component
export default function ArchivoPreviredPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const { user } = useUser();
    const { toast } = useToast();

    const currentYear = new Date().getFullYear();
    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState((new Date().getMonth() + 1).toString());
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [statusMessage, setStatusMessage] = React.useState('');
    const [validRowsState, setValidRowsState] = React.useState<PreviredRow[]>([]);
    const [errorsState, setErrorsState] = React.useState<PreviredValidationError[]>([]);
    const [calculatedPayrolls, setCalculatedPayrolls] = React.useState<PayrollDraft[]>([]);

    // Fetch employees
    const { data: employees, loading: employeesLoading } = useCollection<Employee>({
        path: companyId ? `companies/${companyId}/employees` : undefined,
        queryConstraints: [['status', '==', 'Active']],
        companyId,
        fetchFull: true,
    });

    React.useEffect(() => {
        // Reset results when period or company changes
        setValidRowsState([]); 
        setErrorsState([]);
        setCalculatedPayrolls([]);
    }, [year, month, companyId]);

    const handleGenerateAndDownload = async () => {
        setIsLoading(true);
        setStatusMessage('Iniciando proceso...');
        setValidRowsState([]);
        setErrorsState([]);
        setCalculatedPayrolls([]);
        
        if (!employees || employees.length === 0) {
            toast({ variant: "destructive", title: "No se encontraron empleados activos." });
            setIsLoading(false);
            return;
        }

        if (!user || !selectedCompany) {
            toast({ variant: "destructive", title: "Error de sesión", description: "No se pudo verificar la sesión de usuario o la empresa seleccionada." });
            setIsLoading(false);
            return;
        }

        setStatusMessage('Calculando liquidaciones...');
        toast({ description: "Obteniendo los borradores de liquidación más actualizados..." });

        const token = await user.getIdToken();
        const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const periodEnd = new Date(parseInt(year), parseInt(month), 0);

        const activeEmployeesForPeriod = employees.filter(emp => {
            if (!emp.contractStartDate) return false;
            const startDate = emp.contractStartDate instanceof Timestamp ? emp.contractStartDate.toDate() : new Date(emp.contractStartDate);
            if (startDate > periodEnd) return false;
            if (emp.contractEndDate) {
                const endDate = emp.contractEndDate instanceof Timestamp ? emp.contractEndDate.toDate() : new Date(emp.contractEndDate);
                if (endDate < periodStart) return false;
            }
            return true;
        });

        if (activeEmployeesForPeriod.length === 0) {
            toast({ variant: "destructive", title: "Sin Empleados Activos", description: "No se encontraron empleados con contrato vigente para el período seleccionado." });
            setIsLoading(false);
            return;
        }
        
        const draftPromises = activeEmployeesForPeriod.map(async (emp) => {
            try {
                const response = await fetch(`/api/payroll/calculate-preview?companyId=${selectedCompany.id}&year=${year}&month=${month}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(emp),
                    signal: AbortSignal.timeout(15000)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Error calculando para ${emp.rut}: ${errorData.error}`);
                    errorsState.push({ rut: emp.rut, fieldNumber: 0, fieldName: 'Cálculo', error: errorData.error || 'Error desconocido' });
                    return null;
                }
                return await response.json() as PayrollDraft;
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.error(`Fallo en la llamada de cálculo para ${emp.rut}:`, e);
                errorsState.push({ rut: emp.rut, fieldNumber: 0, fieldName: 'Cálculo', error: errorMessage });
                return null;
            }
        });

        const results = await Promise.all(draftPromises);
        const successfulDrafts = results.filter((d): d is PayrollDraft => d !== null);
        setCalculatedPayrolls(successfulDrafts);

        if (successfulDrafts.length === 0) {
            toast({ variant: "destructive", title: "Cálculo Fallido", description: "No se pudo calcular ninguna liquidación. Revise la pestaña de errores para más detalles." });
            setIsLoading(false);
            return;
        }

        setStatusMessage(`Validando ${successfulDrafts.length} liquidaciones para Previred...`);
        toast({ description: `Se calcularon ${successfulDrafts.length} liquidaciones. Validando para Previred...` });

        const { validRows, errors: validationErrors } = validatePreviredData(
            selectedCompany,
            activeEmployeesForPeriod,
            successfulDrafts as Payroll[],
            parseInt(year),
            parseInt(month)
        );
        
        setValidRowsState(validRows);
        setErrorsState(prev => [...prev, ...validationErrors]); // Combine fetch errors with validation errors

        if (validationErrors.length > 0) {
            toast({ variant: "default", title: validationErrors.length === successfulDrafts.length ? "Errores de Validación" : "Archivo Generado con Advertencias", description: "Algunos empleados fueron omitidos. Revise la pestaña de errores.", duration: 5000 });
        }

        if (validRows.length === 0) {
            setIsLoading(false);
            return;
        }
        
        setStatusMessage('Generando archivo de descarga...');
        try {
            const fileContent = generatePreviredFileContent(validRows);
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `previred_${year}_${month.padStart(2,'0')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (errorsState.length === 0 && validationErrors.length === 0) {
                toast({ title: "¡Archivo Generado y Descargado!", description: "El archivo Previred se ha creado correctamente." });
            }
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
            toast({ variant: 'destructive', title: 'Error al Descargar', description: 'Hubo un problema al generar el archivo .txt.' });
        }

        setIsLoading(false);
        setStatusMessage('');
    };
    
    const isLoadingData = employeesLoading;
    const canGenerate = !isLoadingData && employees && employees.length > 0;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Archivo para Previred</CardTitle>
                    <CardDescription>Selecciona un período para generar el archivo a partir de los borradores de liquidación más recientes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                         <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month} onValueChange={setMonth} disabled={!companyId || isLoading || isLoadingData}>
                                    <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(currentYear, i), 'MMMM', { locale: es })}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year} onValueChange={setYear} disabled={!companyId || isLoading || isLoadingData}>
                                    <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>{currentYear-i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className='w-full sm:w-auto'>
                            <Button 
                                size="lg" 
                                disabled={!canGenerate || isLoading}
                                onClick={handleGenerateAndDownload}
                                className='w-full'
                            >
                                {isLoading ? <><Loader2 className='mr-2 h-4 w-4 animate-spin'/> {statusMessage || 'Procesando...'}</> : <><FileCheck className='mr-2 h-4 w-4'/> Generar y Descargar</>}
                            </Button>
                        </div>
                    </div>
                    {isLoadingData && (
                        <div className='flex items-center text-sm text-gray-500 p-3 rounded-md bg-gray-50 border mt-2 max-w-lg'>
                            <Loader2 className='h-4 w-4 mr-2 flex-shrink-0 animate-spin' />
                            Cargando empleados...
                        </div>
                    )}
                    {!isLoadingData && (!employees || employees.length === 0) && (
                        <div className='flex items-center text-sm text-red-600 font-semibold p-3 rounded-md bg-red-50 border border-red-200 mt-2 max-w-lg'>
                            <XCircle className='h-5 w-5 mr-2 flex-shrink-0' />
                            No se puede generar el archivo porque no hay empleados activos en esta empresa.
                        </div>
                    )}
                </CardContent>
            </Card>

            {(validRowsState.length > 0 || errorsState.length > 0 || calculatedPayrolls.length > 0) && (
                 <Tabs defaultValue="data" className="w-full">
                    <TabsList className='mb-4'>
                        <TabsTrigger value="data"><FileText className='w-4 h-4 mr-2' /> Datos Válidos ({validRowsState.length})</TabsTrigger>
                        <TabsTrigger value="errors" className={errorsState.length > 0 ? 'text-red-500' : ''}>
                            <AlertCircle className='w-4 h-4 mr-2' /> Errores ({errorsState.length})
                        </TabsTrigger>
                        <TabsTrigger value="info">Ayuda</TabsTrigger>
                    </TabsList>
                    <TabsContent value="data">
                       <PreviredDataTab validRows={validRowsState} />
                    </TabsContent>
                    <TabsContent value="errors">
                        <ErrorsTab errors={errorsState} />
                    </TabsContent>
                    <TabsContent value="info">
                        <InfoTab />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

function PreviredDataTab({ validRows }: { validRows: PreviredRow[] }) {
    if (validRows.length === 0) {
        return <Card><CardContent><p className='py-6 text-center text-gray-500'>No hay datos válidos para incluir en el archivo.</p></CardContent></Card>;
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos del Archivo de Carga Masiva</CardTitle>
                <CardDescription>Esta tabla es un reflejo de los datos que se incluirán en el archivo <code>.txt</code>.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {PREVIRED_FIELDS.map(field => (
                                <TableHead key={field.id} className='whitespace-nowrap'>
                                    {`#${field.id} ${field.name}`}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {validRows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap font-mono text-xs">
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ErrorsTab({ errors }: { errors: PreviredValidationError[] }) {
     if (errors.length === 0) {
        return (
            <Card>
                <CardContent className='py-6 text-center text-green-600 font-medium'>
                    <FileCheck className="mx-auto h-12 w-12 mb-4"/>
                    <p>¡Excelente! No se encontraron errores de validación.</p>
                </CardContent>
            </Card>
        );
     }
    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-destructive flex items-center'><TriangleAlert className='mr-2' />Errores de Validación</CardTitle>
                <CardDescription>Los siguientes problemas deben ser corregidos para poder incluir a estos trabajadores en el archivo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>RUT Trabajador</TableHead>
                            <TableHead>Error Detectado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {errors.map((error, index) => (
                            <TableRow key={index} className="text-sm">
                                <TableCell className="font-mono">{error.rut}</TableCell>
                                <TableCell className="font-medium text-red-600">{error.error}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function InfoTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2"/>Guía Rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
                 <ol className="list-decimal list-inside space-y-3">
                    <li><strong>Fuente de Datos</strong>: Esta herramienta utiliza los <strong>borradores de liquidación</strong> más recientes, los mismos que ves en la pantalla de gestión de liquidaciones.</li>
                    <li><strong>Proceso</strong>: Al hacer clic en "Generar", el sistema recalcula todas las liquidaciones para el período seleccionado, las valida y luego genera el archivo.</li>
                     <li><strong>Parámetros</strong>: La generación del archivo depende de los <strong>parámetros económicos mensuales</strong> (valor UF, topes imponibles). Si ves un error sobre esto, significa que no están configurados para el período que seleccionaste.</li>
                    <li><strong>Revisión</strong>: Si la pestaña "Errores" muestra algún problema, significa que el borrador de ese empleado tiene datos incompatibles con Previred. Debes corregir los datos del empleado y volver a intentarlo.</li>
                    <li><strong>Descarga y Sube</strong>: El archivo <code>.txt</code> descargado está listo para ser subido a Previred.com.</li>
                </ol>
            </CardContent>
        </Card>
    );
}
