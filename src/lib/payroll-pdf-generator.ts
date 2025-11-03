
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import type { Payroll, Company, Employee } from '@/lib/types';
import { NumeroALetras } from 'numero-a-letras';

// --- Funciones de Ayuda ---

const formatCurrency = (value: number = 0): string => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (year: number, month: number): string => {
    return `${String(month).padStart(2, '0')}/${year}`;
}

// --- Clase Generadora de PDF ---

class PDFPayrollGenerator {
    private doc!: PDFDocument;
    private font!: PDFFont;
    private boldFont!: PDFFont;
    private page: any;
    private y: number = 0;
    private readonly pageHeight: number = 792;
    private readonly pageWidth: number = 612;
    private readonly margin: number = 50;
    private readonly fontSize = 10;
    private readonly lineHeight = 14;

    constructor(
        private payroll: Payroll,
        private company: Company,
        private employee: Employee
    ) {}

    private async initialize() {
        this.doc = await PDFDocument.create();
        this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
        this.font = await this.doc.embedFont(StandardFonts.Helvetica);
        this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
        this.y = this.pageHeight - this.margin;
    }

    private drawHeader() {
        // Título
        this.page.drawText('Liquidación de Sueldo', {
            x: this.margin,
            y: this.y,
            font: this.boldFont,
            size: 16,
        });
        this.y -= 30;

        // Datos de la Empresa
        this.page.drawText(this.company.name, { x: this.margin, y: this.y, font: this.boldFont });
        this.page.drawText(`RUT: ${this.company.rut}`, { x: this.pageWidth / 2, y: this.y, font: this.boldFont });
        this.y -= this.lineHeight;
        this.page.drawText(this.company.address, { x: this.margin, y: this.y, font: this.font });
        this.y -= this.lineHeight;
        this.page.drawText(this.company.giro, { x: this.margin, y: this.y, font: this.font });
        this.y -= 30;
    }

    private drawEmployeeDetails() {
        this.page.drawText('DATOS DEL TRABAJADOR', { x: this.margin, y: this.y, font: this.boldFont, size: 12 });
        this.y -= this.lineHeight * 1.5;

        const employeeData = [
            ['Nombre:', `${this.employee.firstName} ${this.employee.lastName}`],
            ['RUT:', this.employee.rut],
            ['Cargo:', this.employee.jobTitle || 'No especificado'],
            ['Periodo:', formatDate(this.payroll.year, this.payroll.month)],
            ['Fecha de Ingreso:', this.employee.contractStartDate ? new Date(this.employee.contractStartDate).toLocaleDateString('es-CL') : 'N/A'],
        ];

        employeeData.forEach(([label, value]) => {
            this.page.drawText(label, { x: this.margin, y: this.y, font: this.boldFont });
            this.page.drawText(value, { x: this.margin + 120, y: this.y, font: this.font });
            this.y -= this.lineHeight;
        });

        this.y -= 20;
    }

    private drawDetailsTable() {
        const tableTop = this.y;
        const col1X = this.margin;
        const col2X = this.margin + 250;
        const col3X = this.margin + 380;

        // Títulos
        this.page.drawText('HABERES', { x: col1X, y: this.y, font: this.boldFont });
        this.page.drawText('DESCUENTOS', { x: col2X, y: this.y, font: this.boldFont });
        this.y -= this.lineHeight * 1.5;

        const haberes = [
            ['Sueldo Base', formatCurrency(this.payroll.baseSalary)],
            ['Gratificación Legal', formatCurrency(this.payroll.gratification)],
            ...(this.payroll.otherTaxableEarnings > 0 ? [['Otros Haberes Imponibles', formatCurrency(this.payroll.otherTaxableEarnings)]] : []),
            ['Movilización', formatCurrency(this.payroll.nonTaxableEarnings - (this.payroll.collation || 0))], // Asumiendo que nonTaxableEarnings incluye mov y colación
            ['Colación', formatCurrency(this.payroll.collation || 0)],
        ];

        const descuentos = [
            ['Cotización AFP', formatCurrency(this.payroll.afpDiscount)],
            ['Cotización Salud (7%)', formatCurrency(this.payroll.healthDiscount)],
            ['Seguro de Cesantía', formatCurrency(this.payroll.unemploymentInsuranceDiscount)],
            ['Impuesto Único', formatCurrency(this.payroll.iut)],
            ...(this.payroll.otherDiscounts > 0 ? [['Otros Descuentos', formatCurrency(this.payroll.otherDiscounts)]] : []),
            ...(this.employee.apvAmount > 0 ? [['APV', formatCurrency(this.employee.apvAmount)]] : []),
        ];

        const maxRows = Math.max(haberes.length, descuentos.length);

        for (let i = 0; i < maxRows; i++) {
            if (haberes[i]) {
                this.page.drawText(haberes[i][0], { x: col1X + 5, y: this.y, font: this.font });
                this.page.drawText(haberes[i][1], { x: col1X + 150, y: this.y, font: this.font, align: 'right' });
            }
            if (descuentos[i]) {
                this.page.drawText(descuentos[i][0], { x: col2X + 5, y: this.y, font: this.font });
                this.page.drawText(descuentos[i][1], { x: col3X, y: this.y, font: this.font, align: 'right' });
            }
            this.y -= this.lineHeight;
        }

        this.y -= 10; // Espacio antes de los totales

        // Línea divisoria
        this.page.drawLine({
            start: { x: this.margin, y: this.y },
            end: { x: this.pageWidth - this.margin, y: this.y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8)
        });
        this.y -= this.lineHeight;

        // Totales
        this.page.drawText('TOTAL HABERES', { x: col1X, y: this.y, font: this.boldFont });
        this.page.drawText(formatCurrency(this.payroll.totalEarnings), { x: col1X + 150, y: this.y, font: this.boldFont, align: 'right' });

        this.page.drawText('TOTAL DESCUENTOS', { x: col2X, y: this.y, font: this.boldFont });
        this.page.drawText(formatCurrency(this.payroll.totalDiscounts), { x: col3X, y: this.y, font: this.boldFont, align: 'right' });
        
        this.y -= 30;
    }

    private drawFooter() {
        this.page.drawText('LÍQUIDO A PAGAR', { x: this.pageWidth / 2 - 100, y: this.y, font: this.boldFont, size: 12 });
        this.page.drawText(formatCurrency(this.payroll.netSalary), { x: this.pageWidth - this.margin - 100, y: this.y, font: this.boldFont, size: 12 });
        this.y -= this.lineHeight * 1.5;

        const totalEnPalabras = `SON: ${NumeroALetras(this.payroll.netSalary)} pesos.`;
        this.page.drawText(totalEnPalabras, { x: this.margin, y: this.y, font: this.font, size: 8 });
        this.y -= 60;
        
        // Firmas
        const signatureY = this.y;
        const employerX = this.margin + 100;
        const employeeX = this.pageWidth - this.margin - 100;
        
        this.page.drawLine({ start: { x: employerX - 70, y: signatureY }, end: { x: employerX + 70, y: signatureY } });
        this.page.drawText('Firma Empleador', { x: employerX - 35, y: signatureY - 10, font: this.font, size: 8 });

        this.page.drawLine({ start: { x: employeeX - 70, y: signatureY }, end: { x: employeeX + 70, y: signatureY } });
        this.page.drawText('Firma Trabajador', { x: employeeX - 35, y: signatureY - 10, font: this.font, size: 8 });
    }

    public async generate(): Promise<Uint8Array> {
        await this.initialize();
        this.drawHeader();
        this.drawEmployeeDetails();
        this.drawDetailsTable();
        this.drawFooter();
        return this.doc.save();
    }
}


export async function generatePayrollPDF(payroll: Payroll, company: Company, employee: Employee): Promise<Uint8Array> {
    const generator = new PDFPayrollGenerator(payroll, company, employee);
    return await generator.generate();
}
