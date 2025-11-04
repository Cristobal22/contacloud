import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Employee, Payroll } from '@/lib/types';

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return '$ 0';
    return `$ ${Math.round(value).toLocaleString('es-CL')}`;
};

export const generatePayslipPDF = (employee: Employee, payroll: Payroll) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    const companyName = 'EL PEREGRINO SPA'; // Replace with dynamic data if available
    const companyRut = '77.777.777-7'; // Replace with dynamic data if available
    const period = payroll.period || `${payroll.month}/${payroll.year}`;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LIQUIDACIÓN DE SUELDO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(period.toUpperCase(), 105, 27, { align: 'center' });

    doc.line(15, 30, 195, 30); // Horizontal line

    // Employee & Company Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS EMPRESA', 15, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Razón Social: ${companyName}`, 15, 46);
    doc.text(`RUT: ${companyRut}`, 15, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('DATOS TRABAJADOR', 105, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${employee.firstName} ${employee.lastName}`, 105, 46);
    doc.text(`RUT: ${employee.rut}`, 105, 52);
    doc.text(`Cargo: ${employee.position || 'No especificado'}`, 105, 58);

    doc.line(15, 65, 195, 65);

    // Haberes (Earnings)
    const haberesData = [
        ['Sueldo Base', formatCurrency(payroll.baseSalary)],
        ['Gratificación Legal', formatCurrency(payroll.gratification)],
        ...(payroll.bonos?.map(b => [b.glosa, formatCurrency(b.monto)]) || []),
        ['Horas Extra', formatCurrency(payroll.otherTaxableEarnings - (payroll.bonos?.reduce((s, b) => s + b.monto, 0) || 0) )],
        ['Movilización', formatCurrency(employee.mobilization)],
        ['Colación', formatCurrency(employee.collation)],
    ];

    // Descuentos (Deductions)
    const descuentosData = [
        [`AFP ${employee.afp}`, formatCurrency(payroll.afpDiscount)],
        [`Salud ${employee.healthSystem}`, formatCurrency(payroll.healthDiscount)],
        ['Seguro de Cesantía', formatCurrency(payroll.unemploymentInsuranceDiscount)],
        ['Impuesto Único', formatCurrency(payroll.iut)],
        ['Anticipos', formatCurrency(payroll.advances)],
        ['Otros Descuentos', formatCurrency(payroll.otherDiscounts)],
    ];

    doc.autoTable({
        startY: 70,
        head: [['HABERES', 'MONTO']],
        body: haberesData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        columnStyles: { 1: { halign: 'right' } },
        didDrawPage: (data) => {
            // Summary for Haberes
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL HABERES:', data.settings.margin.left, data.cursor.y + 6);
            doc.text(formatCurrency(payroll.totalEarnings), data.table.width, data.cursor.y + 6, { align: 'right' });
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

     doc.autoTable({
        startY: finalY + 15,
        head: [['DESCUENTOS', 'MONTO']],
        body: descuentosData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        columnStyles: { 1: { halign: 'right' } },
        didDrawPage: (data) => {
            // Summary for Descuentos
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL DESCUENTOS:', data.settings.margin.left, data.cursor.y + 6);
            doc.text(formatCurrency(payroll.totalDiscounts), data.table.width, data.cursor.y + 6, { align: 'right' });
        }
    });

    // Footer - Net Salary
    const finalY2 = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALCANCE LÍQUIDO:', 15, finalY2 + 20);
    doc.text(formatCurrency(payroll.netSalary), 195, finalY2 + 20, { align: 'right' });

    // Signature
    doc.line(60, 250, 150, 250);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Firma del Trabajador', 105, 255, { align: 'center' });
    doc.text(`Recibí conforme el alcance líquido de la presente liquidación, no teniendo cargo ni cobro alguno que hacer por otro concepto.`, 15, 265, { maxWidth: 180 });

    doc.save(`Liquidacion_${employee.firstName}_${employee.lastName}_${period.replace(' ', '_')}.pdf`);
};
