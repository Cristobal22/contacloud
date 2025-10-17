
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
import type { Employee } from "@/lib/types"
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SelectedCompanyContext } from "@/app/dashboard/layout";
import { ScrollArea } from "./ui/scroll-area";

export type SimulatedPayroll = {
    id: string;
    employeeName: string;
    period: string;
    baseSalary: number;
    gratification: number;
    otherEarnings: number;
    totalEarnings: number;
    afpDiscount: number;
    healthDiscount: number;
    otherDiscounts: number;
    totalDiscounts: number;
    netSalary: number;
}

interface PayrollDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        payroll: SimulatedPayroll;
        employee: Employee;
    } | null;
}

const formatCurrency = (value: number) => {
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function PayrollDetailDialog({ isOpen, onClose, data }: PayrollDetailDialogProps) {
    const payrollContentRef = React.useRef<HTMLDivElement>(null);
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};

    const [pdf, setPdf] = React.useState<jsPDF | null>(null);
    const [isPreview, setIsPreview] = React.useState(false);

    const handleClose = () => {
        setPdf(null);
        setIsPreview(false);
        onClose();
    }

    const generatePdf = async (): Promise<jsPDF | null> => {
        const input = payrollContentRef.current;
        if (!input) return null;
    
        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true, 
                backgroundColor: '#ffffff'
            });
    
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
        } else {
            const generatedPdf = await generatePdf();
            if (generatedPdf) {
                setPdf(generatedPdf);
                setIsPreview(true);
            }
        }
    };

    const downloadPdf = async () => {
        const pdfToDownload = await generatePdf();
        if (pdfToDownload) {
            pdfToDownload.save(`liquidacion_${data?.employee.rut}_${data?.payroll.period.replace(/\s+/g, '_')}.pdf`);
        }
    };

    if (!data) return null;

    const { payroll, employee } = data;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Liquidación de Sueldo (Simulación)</DialogTitle>
                    <DialogDescription>
                        {`Detalle para ${employee.firstName} para el período de ${payroll.period}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <ScrollArea className="h-[600px] w-full">
                        <div 
                            className={cn("bg-white text-black", isPreview && "opacity-0 absolute -z-10 pointer-events-none")}
                            ref={payrollContentRef}
                        >
                        <div className="p-8">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">Liquidación de Sueldo</h1>
                                        <p className="text-gray-600">Período: {payroll.period}</p>
                                    </div>
                                    <div className="text-right">
                                        <Logo className="justify-end"/>
                                        <p className="text-sm text-gray-500 mt-1">{selectedCompany?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedCompany?.rut}</p>
                                    </div>
                                </div>
                                
                                {/* Employee Details */}
                                <div className="border-t border-b border-gray-200 py-3 mb-6">
                                    <h3 className="text-base font-semibold mb-2 text-gray-700">Información del Trabajador</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                        <div><span className="font-medium text-gray-600">Nombre:</span> {employee.firstName} {employee.lastName}</div>
                                        <div><span className="font-medium text-gray-600">RUT:</span> {employee.rut}</div>
                                        <div><span className="font-medium text-gray-600">Cargo:</span> {employee.position}</div>
                                    </div>
                                </div>

                                {/* Main Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-bold text-gray-600">Concepto</TableHead>
                                            <TableHead className="text-right font-bold text-gray-600">Haberes</TableHead>
                                            <TableHead className="text-right font-bold text-gray-600">Descuentos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>Sueldo Base</TableCell><TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell><TableCell></TableCell></TableRow>
                                        <TableRow><TableCell>Gratificación Legal</TableCell><TableCell className="text-right">{formatCurrency(payroll.gratification)}</TableCell><TableCell></TableCell></TableRow>
                                        <TableRow><TableCell>Otros Haberes (Movilización, Colación, etc.)</TableCell><TableCell className="text-right">{formatCurrency(payroll.otherEarnings)}</TableCell><TableCell></TableCell></TableRow>
                                        <TableRow><TableCell>Cotización AFP ({employee.afp})</TableCell><TableCell></TableCell><TableCell className="text-right">{formatCurrency(payroll.afpDiscount)}</TableCell></TableRow>
                                        <TableRow><TableCell>Cotización Salud ({employee.healthSystem})</TableCell><TableCell></TableCell><TableCell className="text-right">{formatCurrency(payroll.healthDiscount)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-gray-100 font-bold">
                                            <TableCell>Totales</TableCell>
                                            <TableCell className="text-right">{formatCurrency(payroll.totalEarnings)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(payroll.totalDiscounts)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>

                                {/* Grand Total */}
                                <div className="flex justify-end mt-6">
                                    <div className="w-full max-w-sm space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-medium">Total Haberes:</span>
                                            <span>{formatCurrency(payroll.totalEarnings)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-medium">Total Descuentos:</span>
                                            <span>{formatCurrency(payroll.totalDiscounts)}</span>
                                        </div>
                                        <Separator className="my-2"/>
                                        <div className="flex justify-between text-lg font-bold text-gray-800">
                                            <span>Sueldo Líquido a Pagar:</span>
                                            <span>{formatCurrency(payroll.netSalary)}</span>
                                        </div>
                                    </div>
                                </div>
                        </div>
                        </div>
                    </ScrollArea>
                    
                    {/* PDF Preview Iframe */}
                    {isPreview && (
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white">
                             <div className="h-[600px] border rounded-md">
                                {pdf && <iframe src={pdf.output('datauristring')} width="100%" height="100%" title="Vista previa de liquidación"/>}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cerrar</Button>
                    <Button type="button" variant="outline" onClick={togglePreview}>
                        {isPreview ? "Ocultar Vista Previa" : "Vista Previa PDF"}
                    </Button>
                    <Button type="button" onClick={downloadPdf}>Descargar PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
