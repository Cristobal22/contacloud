'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead, TableFooter } from "@/components/ui/table"
import type { Employee, Payroll } from "@/lib/types"
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SelectedCompanyContext } from "@/app/dashboard/layout";
import { ScrollArea } from "./ui/scroll-area";

interface PayrollDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        payroll: Payroll;
        employee: Employee;
    } | null;
}

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '$0';
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

const formatDate = (date: any): string => {
    if (!date) return '';
    if (date.seconds && typeof date.nanoseconds === 'number') {
        const jsDate = new Date(date.seconds * 1000);
        const month = jsDate.getUTCMonth();
        const year = jsDate.getUTCFullYear();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${monthNames[month]} de ${year}`;
    }
    if (typeof date === 'string') {
        const parts = date.split(/[-/]/);
        if (parts.length === 2) {
            const yearPart = parts.find(p => p.length === 4);
            const monthPart = parts.find(p => p.length !== 4);
            if (yearPart && monthPart) {
                const monthIndex = parseInt(monthPart, 10) - 1;
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                if (monthIndex >= 0 && monthIndex < 12) {
                    return `${monthNames[monthIndex]} de ${yearPart}`;
                }
            }
        }
        return date;
    }
    try {
        return new Date(date).toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch {
        return 'Fecha inválida';
    }
};

export function PayrollDetailDialog({ isOpen, onClose, data }: PayrollDetailDialogProps) {
    const payrollContentRef = React.useRef<HTMLDivElement>(null);
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};

    const [pdfInstance, setPdfInstance] = React.useState<jsPDF | null>(null);
    const [isPreview, setIsPreview] = React.useState(false);
    
    const handleClose = () => {
        setPdfInstance(null);
        setIsPreview(false);
        onClose();
    }

    const generatePdf = async (): Promise<jsPDF | null> => {
        const input = payrollContentRef.current;
        if (!input) return null;
    
        try {
            const wasPreviewing = isPreview;
            if (wasPreviewing) input.style.opacity = '1';

            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            
            if (wasPreviewing) input.style.opacity = '0';
    
            const imgData = canvas.toDataURL('image/png');
            const pdfDoc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdfDoc.internal.pageSize.getWidth();
            const pdfHeight = pdfDoc.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            let finalImgWidth = pdfWidth - 20;
            let finalImgHeight = finalImgWidth / ratio;
    
            if (finalImgHeight > pdfHeight - 20) {
                finalImgHeight = pdfHeight - 20;
                finalImgWidth = finalImgHeight * ratio;
            }
            
            const xOffset = (pdfWidth - finalImgWidth) / 2;
            const yOffset = 10;
            
            pdfDoc.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
            return pdfDoc;
        } catch (error) {
            console.error("Error generating PDF:", error);
            return null;
        }
    };
    
    const togglePreview = async () => {
       if (isPreview) {
            setIsPreview(false);
            setPdfInstance(null);
        } else {
            const generatedPdf = await generatePdf();
            if (generatedPdf) {
                setPdfInstance(generatedPdf);
                setIsPreview(true);
            }
        }
    };

    const downloadPdf = async () => {
        const pdfToDownload = await generatePdf();
        if (pdfToDownload) {
            const safePeriod = formatDate(data?.payroll.period).replace(/\s+/g, '_');
            pdfToDownload.save(`liquidacion_${data?.employee.rut}_${safePeriod}.pdf`);
        }
    };

    if (!data) return null;

    const { payroll, employee } = data;
    
    const iutFactor = (payroll.taxableEarnings > 0) ? (payroll.iut / (payroll.taxableEarnings - (payroll.afpDiscount || 0) - (payroll.healthDiscount || 0))) : 0;
    const iutFactorDisplay = iutFactor > 0 ? (iutFactor * 100).toFixed(1) + '%' : '0%';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl grid-rows-[auto_1fr_auto] p-0 max-h-[90svh]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Liquidación de Sueldo</DialogTitle>
                    <DialogDescription>
                        {`Detalle para ${employee.firstName} para el período de ${formatDate(payroll.period)}.`}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-auto">
                    <div className="relative px-6 py-4">
                        <div 
                            className={cn(
                                "bg-white text-black transition-opacity duration-300", 
                                isPreview && "opacity-0 absolute -z-10 pointer-events-none"
                            )}
                            ref={payrollContentRef}
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">Liquidación de Sueldo</h1>
                                        <p className="text-gray-600">Período: {formatDate(payroll.period)}</p>
                                    </div>
                                    <div className="text-right">
                                        <Logo className="justify-end"/>
                                        <p className="text-sm text-gray-500 mt-1">{selectedCompany?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedCompany?.rut}</p>
                                    </div>
                                </div>
                                
                                <div className="border-t border-b border-gray-200 py-3 mb-6">
                                    <h3 className="text-base font-semibold mb-2 text-gray-700">Información del Trabajador</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                        <div><span className="font-medium text-gray-600">Nombre:</span> {employee.firstName} {employee.lastName}</div>
                                        <div><span className="font-medium text-gray-600">RUT:</span> {employee.rut}</div>
                                        <div><span className="font-medium text-gray-600">Cargo:</span> {employee.position}</div>
                                        <div><span className="font-medium text-gray-600">Días Trabajados:</span> {payroll.workedDays}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-8">
                                    <div>
                                        <h3 className="text-base font-semibold mb-2 text-gray-700">Haberes</h3>
                                        <Table>
                                            <TableBody>
                                                <TableRow><TableCell>Sueldo Base Proporcional</TableCell><TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell></TableRow>
                                                {payroll.gratification > 0 && <TableRow><TableCell>Gratificación Legal</TableCell><TableCell className="text-right">{formatCurrency(payroll.gratification)}</TableCell></TableRow>}
                                                {payroll.totalOvertimePay > 0 && <TableRow><TableCell>Horas Extra</TableCell><TableCell className="text-right">{formatCurrency(payroll.totalOvertimePay)}</TableCell></TableRow>}
                                                <TableRow className="font-medium bg-gray-50"><TableCell>Total Haberes Imponibles</TableCell><TableCell className="text-right">{formatCurrency(payroll.taxableEarnings)}</TableCell></TableRow>
                                                {payroll.nonTaxableEarnings > 0 && <TableRow><TableCell>Haberes no Imponibles</TableCell><TableCell className="text-right">{formatCurrency(payroll.nonTaxableEarnings)}</TableCell></TableRow>}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow className="bg-gray-100 font-bold text-base">
                                                    <TableCell>Total Haberes</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(payroll.totalEarnings)}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold mb-2 text-gray-700">Descuentos</h3>
                                        <Table>
                                            <TableBody>
                                                <TableRow><TableCell>Cotización AFP ({employee.afp})</TableCell><TableCell className="text-right">{formatCurrency(payroll.afpDiscount)}</TableCell></TableRow>
                                                <TableRow><TableCell>Cotización Salud ({employee.healthSystem})</TableCell><TableCell className="text-right">{formatCurrency(payroll.healthDiscount)}</TableCell></TableRow>
                                                {payroll.unemploymentInsuranceDiscount > 0 && <TableRow><TableCell>Seguro de Cesantía</TableCell><TableCell className="text-right">{formatCurrency(payroll.unemploymentInsuranceDiscount)}</TableCell></TableRow>}
                                                {payroll.iut > 0 && <TableRow className="font-medium"><TableCell>Impuesto Único</TableCell><TableCell className="text-right font-medium">{formatCurrency(payroll.iut)}</TableCell></TableRow>}
                                                {payroll.advances > 0 && <TableRow><TableCell>Anticipos</TableCell><TableCell className="text-right">{formatCurrency(payroll.advances)}</TableCell></TableRow>}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow className="bg-gray-100 font-bold text-base">
                                                    <TableCell>Total Descuentos</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(payroll.totalDiscounts)}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-8">
                                    <div className="w-full max-w-sm space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex justify-between text-xl font-bold text-blue-800">
                                            <span>SUELDO LÍQUIDO:</span>
                                            <span>{formatCurrency(payroll.netSalary)}</span>
                                        </div>
                                        <p className="text-xs text-center text-blue-600 pt-2">Son: {payroll.netSalaryInWords} pesos</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        {isPreview && (
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white">
                                <div className="h-full border rounded-md">
                                    {pdfInstance && <iframe src={pdfInstance.output('datauristring')} width="100%" height="100%" title="Vista previa de liquidación"/>}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <DialogFooter className="p-6 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cerrar</Button>
                    <Button type="button" variant="outline" onClick={togglePreview} disabled={!data}>
                        {isPreview ? "Ocultar Vista Previa" : "Vista Previa PDF"}
                    </Button>
                    <Button type="button" onClick={downloadPdf} disabled={!data}>Descargar PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
