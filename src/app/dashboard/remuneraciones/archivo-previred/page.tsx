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
import type { Payroll, Employee, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { validatePreviredData, generatePreviredFileContent, PreviredValidationError, PreviredRow } from '@/lib/previred-generator';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Main Component
export default function ArchivoPreviredPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isLoading, setIsLoading] = React.useState(false);
    
    const [processedData, setProcessedData] = React.useState<{ validRows: PreviredRow[], errors: PreviredValidationError[], validPayrolls: Payroll[] } | null>(null);

    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
        path: companyId ? `companies/${companyId}/employees` : undefined,
        companyId
    });

    const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>({
        path: companyId ? `companies/${companyId}/payrolls` : undefined,
        companyId, 
        queryConstraints: [
            ['year', '==', parseInt(year)],
            ['month', '==', parseInt(month)]
        ]
    });
    
    // --- THE TRUST FILTER: Ensures we only use payrolls for the *selected* period ---
    const payrollsForPeriod = React.useMemo(() => {
        if (!payrolls) {
            return [];
        }
        const selectedYear = parseInt(year);
        const selectedMonth = parseInt(month);
        // This filter is the definitive source of truth for the UI.
        return payrolls.filter(p => p.year === selectedYear && p.month === selectedMonth);
    }, [payrolls, year, month]);

    React.useEffect(() => {
        setProcessedData(null);
    }, [year, month, companyId]);

    const handleGenerateAndDownload = async () => {
        setIsLoading(true);
        setProcessedData(null);

        // --- Check against the filtered, safe-to-use payrolls ---'''
        if (!payrollsForPeriod || payrollsForPeriod.length === 0) {
            toast({ variant: "destructive", title: "Proceso Detenido", description: "No hay liquidaciones para el período seleccionado." });
            setIsLoading(false);
            return;
        }

        if (!selectedCompany || !employees) {
            toast({ variant: "destructive", title: "Error de Carga", description: "Datos de empresa o empleados no disponibles." });
            setIsLoading(false);
            return;
        }
        
        // Pass the filtered, safe payrolls to the validation function
        const { validRows, errors } = validatePreviredData(
            selectedCompany, 
            employees, 
            payrollsForPeriod, // Use the safe variable
            parseInt(year), 
            parseInt(month)
        );
        
        const validRuts = new Set(validRows.map(row => `${row[0]}-${row[1]}`));
        const validPayrolls = payrollsForPeriod.filter(p => {
            const emp = employees.find(e => e.id === p.employeeId);
            return emp && validRuts.has(emp.rut);
        });

        setProcessedData({ validRows, errors, validPayrolls });

        if (errors.length > 0 && validRows.length === 0) {
            toast({ variant: "destructive", title: "Errores de Validación", description: "No se pudo generar el archivo. Revise los errores.", duration: 5000 });
            setIsLoading(false);
            return;
        }
        
        if (errors.length > 0 && validRows.length > 0) {
             toast({ variant: "default", title: "Archivo Generado con Advertencias", description: "Algunos empleados fueron omitidos. Revise los errores.", duration: 5000 });
        }

        if (validRows.length === 0) {
            // This toast is now implicitly correct because it followed the check on payrollsForPeriod
            setIsLoading(false);
            return;
        }
        
        try {
            const fileContent = generatePreviredFileContent(validRows);
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `previred_${year}_${month.padStart(2,'0')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (errors.length === 0) {
                toast({ title: "¡Archivo Generado y Descargado!", description: "El archivo Previred se ha creado correctamente." });
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            toast({ variant: 'destructive', title: 'Error al Descargar', description: 'Hubo un problema al generar el archivo.' });
        }

        setIsLoading(false);
    };
    
    const isLoadingData = employeesLoading || payrollsLoading;
    // --- The Generate button now depends on the safe, filtered variable ---
    const canGenerate = !isLoadingData && payrollsForPeriod.length > 0;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Archivo para Previred</CardTitle>
                    <CardDescription>Selecciona el período para generar el archivo. El botón solo se habilitará si existen liquidaciones procesadas para ese mes.</CardDescription>
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
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className='w-full sm:w-auto'>
                                        <Button 
                                            size="lg" 
                                            disabled={!canGenerate || isLoading} 
                                            onClick={handleGenerateAndDownload}
                                            className='w-full'
                                        >
                                            {isLoading ? <><Loader2 className='mr-2 h-4 w-4 animate-spin'/> Procesando...</> : <><FileCheck className='mr-2 h-4 w-4'/> Generar y Descargar</>}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {/* This tooltip now correctly reflects the state of the safe variable */}
                                {!canGenerate && !isLoadingData && (
                                    <TooltipContent>
                                        <p>No hay liquidaciones procesadas para este período.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {/* This warning now correctly reflects the state of the safe variable */}
                    {!isLoadingData && !canGenerate && (
                        <div className='flex items-center text-sm text-red-600 font-semibold p-3 rounded-md bg-red-50 border border-red-200 mt-2 max-w-lg'>
                            <XCircle className='h-5 w-5 mr-2 flex-shrink-0' />
                            No se puede generar el archivo porque no existen liquidaciones procesadas para el período seleccionado.
                        </div>
                    )}
                </CardContent>
            </Card>

            {processedData && (
                <Tabs defaultValue={processedData.validRows.length > 0 ? "data" : "errors"} className="w-full">
                    <TabsList className='mb-4'>
                        <TabsTrigger value="data"><FileText className='w-4 h-4 mr-2' /> Datos Válidos ({processedData.validRows.length})</TabsTrigger>
                        <TabsTrigger value="errors" className={processedData.errors.length > 0 ? 'text-red-500' : ''}>
                            <AlertCircle className='w-4 h-4 mr-2' /> Errores ({processedData.errors.length})
                        </TabsTrigger>
                        <TabsTrigger value="totals">Totales</TabsTrigger>
                        <TabsTrigger value="info">Ayuda</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="data">
                       <PreviredDataTab validRows={processedData.validRows} />
                    </TabsContent>
                    <TabsContent value="errors">
                        <ErrorsTab errors={processedData.errors} />
                    </TabsContent>
                    <TabsContent value="totals">
                        <TotalsTab validPayrolls={processedData.validPayrolls} />
                    </TabsContent>
                    <TabsContent value="info">
                        <InfoTab />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

// --- Tab Components (No changes needed here) ---

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

function TotalsTab({ validPayrolls }: { validPayrolls: Payroll[]}) {
    if (validPayrolls.length === 0) {
        return <Card><CardContent><p className='py-6 text-center text-gray-500'>No hay liquidaciones válidas para calcular totales.</p></CardContent></Card>;
    }

    const totals = validPayrolls.reduce((acc, p) => {
        acc.afpTotal += (p.afpDiscount || 0);
        acc.sisTotal += (p.sisDiscount || 0);
        acc.healthTotal += (p.healthDiscount || 0) + (p.additionalHealthDiscount || 0);
        acc.unemploymentTotal += (p.employerUnemploymentInsurance || 0) + (p.unemploymentInsuranceDiscount || 0);
        acc.ccafTotal += (p.ccafDiscount || 0);
        return acc;
    }, { afpTotal: 0, sisTotal: 0, healthTotal: 0, unemploymentTotal: 0, ccafTotal: 0 });

    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);
    const formatCLP = (val:number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(val));

    return (
        <Card>
            <CardHeader>
                 <CardTitle>Desglose de Totales (Estimado)</CardTitle>
                 <CardDescription>Este resumen se calcula <span className="font-bold">únicamente</span> a partir de los trabajadores incluidos en el archivo.</CardDescription>
            </CardHeader>
            <CardContent className='max-w-2xl mx-auto space-y-4'>
                <div className='text-center p-6 bg-gray-50 rounded-lg border'>
                    <p className="text-sm text-gray-600">Total Estimado a Pagar</p>
                    <h3 className='text-3xl font-bold'>{formatCLP(grandTotal)}</h3>
                </div>
                 <TotalCategory title="AFP + SIS" amount={totals.afpTotal + totals.sisTotal} />
                 <TotalCategory title="Salud (Fonasa/Isapre)" amount={totals.healthTotal} />
                 <TotalCategory title="Seguro de Cesantía (AFC)" amount={totals.unemploymentTotal} />
                 <TotalCategory title="Asignación Familiar (CCAF)" amount={totals.ccafTotal} />
            </CardContent>
        </Card>
    );
}

const TotalCategory = ({ title, amount }: { title: string, amount: number }) => {
    const formatCLP = (val:number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(val));
    return (
        <div className='border rounded-lg p-4 flex justify-between items-center'>
            <h4 className='font-semibold text-gray-700'>{title}</h4>
            <span className='font-bold text-lg text-gray-900'>{formatCLP(amount)}</span>
        </div>
    );
};

function InfoTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2"/>Guía Rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
                 <ol className="list-decimal list-inside space-y-3">
                    <li><strong>Selecciona el Período</strong>: Elige el mes y año que quieres declarar.</li>
                    <li><strong>Verifica el Botón</strong>: Si está deshabilitado, no hay liquidaciones para ese mes.</li>
                    <li><strong>Genera el Archivo</strong>: Al hacer clic, el sistema validará los datos contra el período que seleccionaste.</li>
                    <li><strong>Revisa Errores</strong>: Si la pestaña "Errores" muestra algún problema (ej. contratos inactivos), debes corregirlo para poder incluir a esos trabajadores.</li>
                    <li><strong>Descarga y Sube</strong>: Si no hay errores graves, el archivo <code>.txt</code> se descargará. Súbelo a Previred.com.</li>
                </ol>
            </CardContent>
        </Card>
    );
}
