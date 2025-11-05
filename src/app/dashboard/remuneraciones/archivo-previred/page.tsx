
'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { SelectedCompanyContext } from '../../layout';
import { useCollection } from '@/firebase';
import type { Payroll, Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { validatePreviredData, generatePreviredFileContent, PreviredValidationError } from '@/lib/previred-generator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ArchivoPreviredPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [validationErrors, setValidationErrors] = React.useState<PreviredValidationError[]>([]);

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

    const loading = employeesLoading || payrollsLoading;

    const handleGenerateFile = async () => {
        setIsGenerating(true);
        setValidationErrors([]);

        if (!selectedCompany || !employees || !payrolls) {
            toast({
                variant: "destructive",
                title: "Error de Carga",
                description: "No se pudieron cargar los datos. Asegúrate de seleccionar una empresa y que existan liquidaciones para el período."
            });
            setIsGenerating(false);
            return;
        }

        const { validRows, errors } = validatePreviredData(selectedCompany, employees, payrolls);

        if (errors.length > 0) {
            setValidationErrors(errors);
            toast({
                variant: "destructive",
                title: "Errores de Validación",
                description: "Se encontraron problemas con los datos. Por favor, revisa la tabla de errores y corrige la información en el sistema."
            });
            setIsGenerating(false);
            return;
        }

        if (validRows.length === 0) {
            toast({
                variant: "default",
                title: "No Hay Datos Válidos",
                description: "No se encontraron registros válidos para generar el archivo después de las validaciones."
            });
            setIsGenerating(false);
            return;
        }

        try {
            const fileContent = generatePreviredFileContent(validRows);
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `previred_${year}_${month}.txt`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Archivo Generado con Éxito",
                description: "El archivo de Previred ha sido descargado.",
            });

        } catch (error) {
            console.error("Error generating file:", error);
            toast({
                variant: "destructive",
                title: "Error Inesperado",
                description: "Ocurrió un error al generar el archivo. Revisa la consola para más detalles."
            });
        }

        setIsGenerating(false);
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Archivo para Previred</CardTitle>
                    <CardDescription>Genera el archivo de nómina de trabajadores para importar en Previred según las especificaciones de la Dirección del Trabajo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month} onValueChange={setMonth} disabled={!companyId || loading || isGenerating}>
                                    <SelectTrigger id="month">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i+1} value={(i+1).toString()}>
                                                {format(new Date(0, i), 'MMMM', { locale: es })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year} onValueChange={setYear} disabled={!companyId || loading || isGenerating}>
                                    <SelectTrigger id="year">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                                {currentYear-i}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button disabled={!companyId || loading || isGenerating} onClick={handleGenerateFile}>
                            {loading ? "Cargando..." : (isGenerating ? "Generando..." : "Generar Archivo")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {validationErrors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className='text-destructive'>Reporte de Errores de Validación</CardTitle>
                        <CardDescription>Corrige estos datos en las fichas de los trabajadores o en las liquidaciones antes de volver a generar el archivo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trabajador (RUT)</TableHead>
                                    <TableHead>Campo N°</TableHead>
                                    <TableHead>Nombre del Campo</TableHead>
                                    <TableHead>Descripción del Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validationErrors.map((error, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{error.rut}</TableCell>
                                        <TableCell>{error.fieldNumber}</TableCell>
                                        <TableCell>{error.fieldName}</TableCell>
                                        <TableCell>{error.error}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
