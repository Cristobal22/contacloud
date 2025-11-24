
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
import { AlertCircle, FileCheck, FileText, IndianRupee, Info, TriangleAlert } from 'lucide-react';

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
    const [validationData, setValidationData] = React.useState<{ rows: PreviredRow[], errors: PreviredValidationError[] } | null>(null);

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

    const handleValidateData = async () => {
        setIsLoading(true);
        setValidationData(null);

        if (!selectedCompany || !employees || !payrolls) {
            toast({ variant: "destructive", title: "Error de Carga", description: "No se pudieron cargar los datos necesarios." });
            setIsLoading(false);
            return;
        }

        const { validRows, errors } = validatePreviredData(selectedCompany, employees, payrolls);
        
        setValidationData({ rows: validRows, errors });

        if (errors.length > 0) {
            toast({ variant: "destructive", title: "Errores de Validación", description: "Se encontraron problemas. Revisa la pestaña de errores." });
        } else if (validRows.length === 0) {
            toast({ variant: "default", title: "Sin Datos", description: "No se encontraron registros válidos para el período." });
        } else {
            toast({ title: "Validación Completa", description: "Se han procesado los datos. Revisa las pestañas para ver los resultados." });
        }

        setIsLoading(false);
    };
    
    const handleDownloadFile = () => {
        if (!validationData || validationData.rows.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos válidos', description: 'No se puede generar un archivo sin filas válidas.' });
            return;
        }
        try {
            const fileContent = generatePreviredFileContent(validationData.rows);
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `previred_${year}_${month}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Archivo Generado", description: "El archivo de Previred ha sido descargado." });
        } catch (error) {
            console.error("Error downloading file:", error);
            toast({ variant: 'destructive', title: 'Error al Descargar', description: 'Hubo un problema al generar el archivo.' });
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Archivo para Previred</CardTitle>
                    <CardDescription>Selecciona el período para validar los datos y generar el archivo de importación para Previred.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                         <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month} onValueChange={setMonth} disabled={!companyId || isLoading}>
                                    <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(0, i), 'MMMM', { locale: es })}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year} onValueChange={setYear} disabled={!companyId || isLoading}>
                                    <SelectTrigger id="year"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>{currentYear-i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button disabled={!companyId || employeesLoading || payrollsLoading || isLoading} onClick={handleValidateData}>
                            {isLoading ? "Validando..." : "Validar Datos"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {validationData && (
                <Tabs defaultValue="data" className="w-full">
                    <div className='flex justify-between items-center mb-4 flex-wrap gap-4'>
                        <TabsList>
                            <TabsTrigger value="data"><FileText className='w-4 h-4 mr-2' /> Datos del archivo</TabsTrigger>
                            <TabsTrigger value="errors" className={validationData.errors.length > 0 ? 'text-red-500' : ''}>
                                <AlertCircle className='w-4 h-4 mr-2' /> Errores {validationData.errors.length > 0 && `(${validationData.errors.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="totals"><IndianRupee className='w-4 h-4 mr-2' /> Total a pagar</TabsTrigger>
                             <TabsTrigger value="info"><Info className='w-4 h-4 mr-2' /> Ayuda</TabsTrigger>
                        </TabsList>
                        {validationData.rows.length > 0 && (
                            <Button onClick={handleDownloadFile}><FileCheck className='w-4 h-4 mr-2'/> Descargar Archivo Previred</Button>
                        )}
                    </div>
                    
                    <TabsContent value="data">
                       <PreviredDataTab validRows={validationData.rows} />
                    </TabsContent>
                    <TabsContent value="errors">
                        <ErrorsTab errors={validationData.errors} />
                    </TabsContent>
                    <TabsContent value="totals">
                        <TotalsTab 
                            payrolls={payrolls || []} 
                            employees={employees || []}
                            company={selectedCompany || null}
                        />
                    </TabsContent>
                    <TabsContent value="info">
                        <InfoTab />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

// --- Tab Components ---

function PreviredDataTab({ validRows }: { validRows: PreviredRow[] }) {
    if (validRows.length === 0) return <Card><CardContent><p className='py-6 text-center'>No hay datos válidos para mostrar.</p></CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos para el Archivo de Carga Masiva</CardTitle>
                <CardDescription>Esta tabla muestra los datos que se incluirán en el archivo. Utiliza la barra de desplazamiento horizontal para ver todas las columnas.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                 <div style={{ maxWidth: '100%' }}>
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow className='bg-gray-800 hover:bg-gray-700'>
                                {PREVIRED_FIELDS.map(field => (
                                    <TableHead key={field.id} className='text-white whitespace-nowrap px-3 py-2 text-xs'>
                                        {`N°${field.id} ${field.name}`}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {validRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-3 py-2 text-xs font-mono">
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function ErrorsTab({ errors }: { errors: PreviredValidationError[] }) {
     if (errors.length === 0) return <Card><CardContent><p className='py-6 text-center text-green-600 font-medium'>¡Excelente! No se encontraron errores de validación.</p></CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-destructive flex items-center'><TriangleAlert className='mr-2' /> ¡{errors.length} {errors.length === 1 ? 'Error Encontrado' : 'Errores Encontrados'}!</CardTitle>
                <CardDescription>Corrige estos datos en las fichas de los trabajadores o en las liquidaciones antes de volver a generar el archivo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campo N°</TableHead>
                             <TableHead>Nombre Campo</TableHead>
                            <TableHead>RUT Trabajador</TableHead>
                            <TableHead>Motivo del Error</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {errors.map((error, index) => (
                            <TableRow key={index} className="text-sm">
                                <TableCell className="font-mono">{error.fieldNumber}</TableCell>
                                <TableCell>{error.fieldName}</TableCell>
                                <TableCell>{error.rut}</TableCell>
                                <TableCell className="text-red-600">{error.error}</TableCell>
                            </TableRow>
                        ))
                        }
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function TotalsTab({ payrolls, employees, company }: { payrolls: Payroll[], employees: Employee[], company: Company | null }) {
    const totals = {
        afp: {} as Record<string, number>,
        sis: 0,
        health: {} as Record<string, number>,
        unemployment: 0,
        unemployment_afc: 0,
        ccaf: 0,
        mutual: 0,
        total: 0
    };

    payrolls.forEach(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        
        totals.sis += p.sisDiscount || 0;
        totals.unemployment += p.employerUnemploymentInsurance || 0;
        totals.unemployment_afc += p.unemploymentInsuranceDiscount || 0;
        totals.ccaf += p.ccafDiscount || 0;
        // The mutual amount is often a fixed percentage on the company level, not on the payroll.
        // This should be calculated based on company settings if available. For now, it's 0.
        
        if (employee) {
            const afpEntity = employee.afpEntity || 'No Informada';
            const healthEntity = employee.healthEntity || 'No Informada';
            
            totals.afp[afpEntity] = (totals.afp[afpEntity] || 0) + (p.afpDiscount || 0);
            const healthTotal = (p.healthDiscount || 0) + (p.additionalHealthDiscount || 0);
            totals.health[healthEntity] = (totals.health[healthEntity] || 0) + healthTotal;
        }
    });

    const totalAfp = Object.values(totals.afp).reduce((sum, val) => sum + val, 0);
    const totalHealth = Object.values(totals.health).reduce((sum, val) => sum + val, 0);
    
    totals.total = totalAfp + totalHealth + totals.unemployment + totals.unemployment_afc + totals.ccaf + totals.sis;

    const formatCLP = (val:number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(val));
    
    const companyMutual = company?.mutual || 'Mutual no especificada';
    const companyCCAF = company?.ccaf || 'CCAF no especificada';

    return (
         <Card>
            <CardHeader>
                <CardTitle>Desglose de Totales a Pagar</CardTitle>
                <CardDescription>Este es un resumen de los montos totales que se pagarán a las distintas instituciones. Verifica siempre con los montos finales en Previred.</CardDescription>
            </CardHeader>
            <CardContent className='max-w-4xl mx-auto space-y-6'>
                 <div className='border-2 border-gray-200 rounded-lg p-6 text-center bg-gray-50'>
                    <h3 className='font-bold text-3xl text-gray-800'>Total a Pagar: {formatCLP(totals.total)}</h3>
                </div>

                <div className='space-y-4'>
                    <TotalCategory 
                        title="AFP" 
                        amount={totalAfp} 
                        items={Object.entries(totals.afp).map(([label, value]) => ({ label, value: formatCLP(value) }))} 
                    />
                    <TotalCategory 
                        title="Salud (Fonasa e Isapres)" 
                        amount={totalHealth} 
                        items={Object.entries(totals.health).map(([label, value]) => ({ label, value: formatCLP(value) }))}
                    />
                     <TotalCategory 
                        title="Seguro de Cesantía" 
                        amount={totals.unemployment + totals.unemployment_afc + totals.sis} 
                        items={[
                            { label: 'Aporte Empleador', value: formatCLP(totals.unemployment) },
                            { label: 'Aporte Trabajadores (AFC)', value: formatCLP(totals.unemployment_afc) },
                            { label: 'SIS (Invalidez y Sobrevivencia)', value: formatCLP(totals.sis) }
                        ]}
                    />
                     <TotalCategory 
                        title={companyCCAF}
                        amount={totals.ccaf} 
                        items={[{ label: `Créditos y otros descuentos`, value: formatCLP(totals.ccaf) }]}
                    />
                     <TotalCategory 
                        title={companyMutual}
                        amount={totals.mutual}
                        items={[]}
                    />
                </div>

                 <div className='border-t-2 border-black mt-8 pt-4 flex justify-between font-extrabold text-2xl'>
                    <span>TOTAL:</span>
                    <span>{formatCLP(totals.total)}</span>
                </div>
                 <div className='mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md text-sm' role='alert'>
                    <p><strong>Información importante:</strong> Los montos aquí presentados son una estimación. Debido a redondeos y topes imponibles, los valores finales en Previred pueden tener pequeñas diferencias. Utiliza este desglose como una guía de referencia.</p>
                </div>
            </CardContent>
        </Card>
    );
}

const TotalCategory = ({ title, amount, items }: { title: string, amount: number, items: {label: string, value: string}[] }) => {
    const formatCLP = (val:number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(val));

    return (
        <div className='border rounded-lg p-4 transition-all hover:shadow-md'>
            <div className='flex justify-between items-center mb-2'>
                <h4 className='font-semibold text-lg text-gray-700'>{title}</h4>
                <span className='font-bold text-xl text-gray-900'>{formatCLP(amount)}</span>
            </div>
            {items.length > 0 && (
                <div className='space-y-1 pl-4 text-gray-600 border-t pt-2 mt-2'>
                    {items.map((item, i) => (
                        <div key={i} className='flex justify-between text-sm'>
                            <span>{item.label}</span>
                            <span className='font-medium'>{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function InfoTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2"/>Guía Rápida para Usar el Archivo Previred</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed">
                <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                     <h3 className="font-semibold text-lg mb-2 text-blue-800">1. ¿Qué es este archivo?</h3>
                    <p className="text-blue-900">
                        Este es un archivo de texto plano (<code>.txt</code>) diseñado para ser cargado directamente en la plataforma de Previred. Contiene toda la información de las cotizaciones previsionales de tus trabajadores para un período específico, en el formato exacto que Previred requiere. Automatiza el ingreso de datos, ahorrándote horas de trabajo manual.
                    </p>
                </div>
                <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                    <h3 className="font-semibold text-lg mb-2">2. ¿Cómo se usa? (Paso a Paso)</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li><strong>Valida los Datos</strong>: Antes de descargar, presiona siempre el botón "Validar Datos" para el período que deseas pagar.</li>
                        <li><strong>Revisa Errores</strong>: Ve a la pestaña "Errores". Si aparece algún problema, debes corregirlo en la ficha del trabajador o en su liquidación de sueldo antes de continuar. La validación no te dejará descargar un archivo con errores críticos.</li>
                        <li><strong>Descarga el Archivo</strong>: Si no hay errores, haz clic en "Descargar Archivo Previred". Guárdalo en un lugar fácil de encontrar.</li>
                        <li><strong>Sube a Previred.com</strong>: Ingresa a tu cuenta de Previred, ve a la sección de pago de remuneraciones y busca la opción "Carga de Nómina" o "Importar Archivo". Selecciona el archivo <code>.txt</code> que acabas de descargar.</li>
                        <li><strong>Verifica y Paga</strong>: La plataforma de Previred procesará el archivo y te mostrará un resumen de los montos a pagar por institución. Revisa que los totales coincidan (pueden haber pequeñas diferencias por redondeo) y procede con el pago.</li>
                    </ol>
                </div>
                 <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                    <h3 className="font-semibold text-lg mb-2">3. Entendiendo la Pestaña "Datos del archivo"</h3>
                    <p className="text-gray-700">
                        Esta tabla es una representación visual del archivo de texto. Cada fila corresponde a un trabajador y cada columna (de la 1 a la 105) es un dato específico que Previred solicita. Por ejemplo, la columna 1 es el RUT (sin dígito verificador) y la columna 27 es el monto de la cotización de AFP. Es útil para verificar datos visualmente antes de descargar.
                    </p>
                </div>
                 <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <h3 className="font-semibold text-lg mb-2 text-yellow-800">4. ¿Qué hacer si los totales no coinciden?</h3>
                    <p className="text-yellow-900">
                        Es normal que existan diferencias de algunos pesos entre el "Total a pagar" de esta aplicación y el total final en Previred. Esto ocurre porque Previred aplica sus propias reglas de redondeo y ajuste de topes imponibles al momento del pago. <strong>El monto final y correcto siempre será el que indique la plataforma de Previred.</strong>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
