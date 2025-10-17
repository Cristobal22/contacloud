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
import { Table, TableBody, TableCell, TableRow, TableFooter as TableFooterOriginal } from "@/components/ui/table"
import type { Employee } from "@/lib/types"
import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

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
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [isPreview, setIsPreview] = React.useState(false);


    const handleClose = () => {
        setPdfUrl(null);
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
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            let finalImgWidth = pdfWidth - 20; // with margin
            let finalImgHeight = finalImgWidth / ratio;
    
            if (finalImgHeight > pdfHeight - 20) {
                finalImgHeight = pdfHeight - 20;
                finalImgWidth = finalImgHeight * ratio;
            }
            
            const xOffset = (pdfWidth - finalImgWidth) / 2;
            const yOffset = 10;
            
            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
            return pdf;
        } catch (error) {
            console.error("Error generating PDF:", error);
            return null;
        }
    };
    
    const togglePreview = async () => {
        if (isPreview) {
            setIsPreview(false);
            setPdfUrl(null);
            return;
        }

        const pdf = await generatePdf();
        if (pdf) {
            setPdfUrl(pdf.output('datauristring'));
            setIsPreview(true);
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Liquidación de Sueldo (Simulación)</DialogTitle>
                    <DialogDescription>
                        {`Detalle para ${employee.firstName} para el período de ${payroll.period}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                     {/* The content to be captured, always rendered but conditionally visible */}
                    <div ref={payrollContentRef} className={cn("p-4 bg-white text-black transition-opacity", isPreview && "opacity-0 absolute -z-10")}>
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold">Liquidación de Sueldo</h2>
                            <h3 className="text-lg">{payroll.period}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
                            <div><span className="font-medium">Nombre:</span> {employee.firstName} {employee.lastName}</div>
                            <div><span className="font-medium">RUT:</span> {employee.rut}</div>
                            <div><span className="font-medium">Cargo:</span> {employee.position}</div>
                        </div>
                        
                        <Separator className="my-4 bg-gray-300" />

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold mb-2 underline">HABERES</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell>Sueldo Base</TableCell><TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell></TableRow>
                                        <TableRow><TableCell>Gratificación Legal</TableCell><TableCell className="text-right">{formatCurrency(payroll.gratification)}</TableCell></TableRow>
                                        <TableRow><TableCell>Otros Haberes</TableCell><TableCell className="text-right">{formatCurrency(payroll.otherEarnings)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooterOriginal>
                                        <TableRow className="font-bold bg-gray-100"><TableCell>Total Haberes</TableCell><TableCell className="text-right">{formatCurrency(payroll.totalEarnings)}</TableCell></TableRow>
                                    </TableFooterOriginal>
                                </Table>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 underline">DESCUENTOS</h4>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell>Cotización AFP ({employee.afp})</TableCell><TableCell className="text-right">{formatCurrency(payroll.afpDiscount)}</TableCell></TableRow>
                                        <TableRow><TableCell>Cotización Salud ({employee.healthSystem})</TableCell><TableCell className="text-right">{formatCurrency(payroll.healthDiscount)}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooterOriginal>
                                        <TableRow className="font-bold bg-gray-100"><TableCell>Total Descuentos</TableCell><TableCell className="text-right">{formatCurrency(payroll.totalDiscounts)}</TableCell></TableRow>
                                    </TableFooterOriginal>
                                </Table>
                            </div>
                        </div>

                         <Separator className="my-4 bg-gray-300" />
                    
                        <div className="flex justify-between items-center bg-gray-700 text-white p-3 rounded-md mt-4">
                            <span className="text-lg font-bold">ALCANCE LÍQUIDO</span>
                            <span className="text-lg font-bold">{formatCurrency(payroll.netSalary)}</span>
                        </div>
                    </div>

                    {/* PDF Preview Iframe */}
                    {isPreview && (
                        <div className="h-[600px] border rounded-md">
                            {pdfUrl && <iframe src={pdfUrl} width="100%" height="100%" title="Vista previa de liquidación"/>}
                        </div>
                    )}
                </div>

                <DialogFooter>
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
