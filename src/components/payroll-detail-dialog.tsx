
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
import { useCollection, useFirestore } from "@/firebase";
import { EconomicIndicator, TaxParameter } from "@/lib/types";

interface PayrollDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        payroll: Payroll;
        employee: Employee;
    } | null;
}

const formatCurrency = (value: number) => {
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function PayrollDetailDialog({ isOpen, onClose, data }: PayrollDetailDialogProps) {
    const payrollContentRef = React.useRef<HTMLDivElement>(null);
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};

    const [pdfInstance, setPdfInstance] = React.useState<jsPDF | null>(null);
    const [isPreview, setIsPreview] = React.useState(false);
    
    const firestore = useFirestore();
    const companyId = selectedCompany?.id;
    const { data: taxParameters, loading: taxLoading } = useCollection<TaxParameter>({ path: 'tax-parameters' });
    const { data: economicIndicators, loading: indicatorsLoading } = useCollection<EconomicIndicator>({ path: companyId ? `companies/${companyId}/economic-indicators` : 'economic-indicators'});

    const handleClose = () => {
        setPdfInstance(null);
        setIsPreview(false);
        onClose();
    }

    const generatePdf = async (): Promise<jsPDF | null> => {
        const input = payrollContentRef.current;
        if (!input) return null;
    
        try {
            // Ensure the content is visible for capture
            input.style.opacity = '1';
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true, 
                backgroundColor: '#ffffff'
            });
            if (isPreview) {
               input.style.opacity = '0';
            }
    
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
            pdfToDownload.save(`liquidacion_${data?.employee.rut}_${data?.payroll.period.replace(/\s+/g, '_')}.pdf`);
        }
    };

    if (!data) return null;

    const { payroll, employee } = data;
    
    // --- IUT Calculation Details ---
    const periodIndicator = economicIndicators?.find(ind => ind.year === payroll.year && ind.month === payroll.month);
    const taxableBaseInUTM = periodIndicator?.utm ? payroll.taxableEarnings / periodIndicator.utm : 0;
    
    const taxBracket = taxParameters?.find(t => taxableBaseInUTM > t.desde && taxableBaseInUTM <= t.hasta);

    const taxAmountPreRebateInUTM = taxableBaseInUTM * (payroll.iutFactor || 0);
    const rebateAmountInUTM = payroll.iutRebajaInUTM || 0;
    const finalTaxInUTM = taxAmountPreRebateInUTM - rebateAmountInUTM;

    const taxAmountPreRebate = periodIndicator?.utm ? taxAmountPreRebateInUTM * periodIndicator.utm : 0;
    const rebateAmount = periodIndicator?.utm ? rebateAmountInUTM * periodIndicator.utm : 0;
        
    const iutFactorDisplay = payroll.iutFactor ? (payroll.iutFactor * 100).toFixed(1) + '%' : '0%';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl grid-rows-[auto_1fr_auto] p-0 max-h-[90svh]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Liquidación de Sueldo</DialogTitle>
                    <DialogDescription>
                        {`Detalle para ${employee.firstName} para el período de ${payroll.period}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative overflow-y-auto px-6">
                    <div className="h-[600px] w-full">
                        <div 
                            className={cn(
                                "bg-white text-black transition-opacity duration-300", 
                                isPreview && "opacity-0 absolute -z-10 pointer-events-none"
                            )}
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
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-base font-semibold mb-2 text-gray-700">Haberes</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-bold text-gray-600">Concepto</TableHead>
                                                    <TableHead className="text-right font-bold text-gray-600">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow><TableCell>Sueldo Base</TableCell><TableCell className="text-right">{formatCurrency(payroll.baseSalary)}</TableCell></TableRow>
                                                <TableRow><TableCell>Gratificación Legal</TableCell><TableCell className="text-right">{formatCurrency(payroll.gratification)}</TableCell></TableRow>
                                                <TableRow className="font-medium bg-gray-50"><TableCell>Total Haberes Imponibles</TableCell><TableCell className="text-right">{formatCurrency(payroll.taxableEarnings)}</TableCell></TableRow>
                                                <TableRow><TableCell>Colación y Movilización</TableCell><TableCell className="text-right">{formatCurrency(payroll.nonTaxableEarnings)}</TableCell></TableRow>
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
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-bold text-gray-600">Concepto</TableHead>
                                                    <TableHead className="text-right font-bold text-gray-600">Monto</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow><TableCell>Cotización AFP ({employee.afp})</TableCell><TableCell className="text-right">{formatCurrency(payroll.afpDiscount)}</TableCell></TableRow>
                                                <TableRow><TableCell>Cotización Salud ({employee.healthSystem})</TableCell><TableCell className="text-right">{formatCurrency(payroll.healthDiscount)}</TableCell></TableRow>
                                                
                                                <TableRow><TableCell className="pl-6 text-gray-500">Impuesto según tramo ({iutFactorDisplay})</TableCell><TableCell className="text-right text-gray-500">{formatCurrency(taxAmountPreRebate)}</TableCell></TableRow>
                                                <TableRow><TableCell className="pl-6 text-gray-500">(-) Rebaja por tramo</TableCell><TableCell className="text-right text-gray-500">{formatCurrency(rebateAmount)}</TableCell></TableRow>
                                                <TableRow className="font-medium"><TableCell>Impuesto Único a Pagar</TableCell><TableCell className="text-right font-medium">{formatCurrency(payroll.iut || 0)}</TableCell></TableRow>
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


                                {/* Grand Total */}
                                <div className="flex justify-end mt-8">
                                    <div className="w-full max-w-sm space-y-2 p-4 bg-gray-100 rounded-lg">
                                        <div className="flex justify-between text-lg font-bold text-gray-800">
                                            <span>ALCANCE LÍQUIDO:</span>
                                            <span>{formatCurrency(payroll.netSalary)}</span>
                                        </div>
                                    </div>
                                </div>
                        </div>
                        </div>
                    </div>
                    
                    {/* PDF Preview Iframe */}
                    {isPreview && (
                        <div className="absolute top-[80px] left-6 right-6 bottom-[80px] bg-white">
                             <div className="h-full border rounded-md">
                                {pdfInstance && <iframe src={pdfInstance.output('datauristring')} width="100%" height="100%" title="Vista previa de liquidación"/>}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0">
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
