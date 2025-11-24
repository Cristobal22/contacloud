
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import type { Company, Employee, Payroll } from '@/lib/types';

// ==========================================================================
// Security & Access Control
// ==========================================================================
async function hasCompanyAccess(firestore: any, userId: string, companyId: string): Promise<boolean> {
    try {
        const [userDoc, companyDoc] = await Promise.all([
            firestore.collection('users').doc(userId).get(),
            firestore.collection('companies').doc(companyId).get()
        ]);
        if (!userDoc.exists || !companyDoc.exists) return false;

        const userData = userDoc.data();
        const companyData = companyDoc.data();

        if (userData?.role === 'Admin') return true;
        if (Array.isArray(companyData?.memberUids) && companyData.memberUids.includes(userId)) return true;

        console.warn(`Access Denied. User ${userId} is not part of company ${companyId}.`);
        return false;
    } catch (error) {
        console.error('Exception in hasCompanyAccess:', error);
        return false;
    }
}

// ==========================================================================
// PDF Generation Logic (v2 - Improved Layout)
// ==========================================================================

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '$ 0';
    return `$ ${Math.round(value).toLocaleString('es-CL')}`;
};

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

async function drawRightAlignedText(page: any, text: string, font: PDFFont, size: number, x: number, y: number, color = rgb(0, 0, 0)) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x - textWidth, y, font, size, color });
}

async function generatePayslip(company: Company, employee: Employee, payroll: Payroll): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // === HEADER ===
    page.drawText(company.name, { x: margin, y, font: boldFont, size: 16 });
    y -= 18;
    page.drawText(`RUT: ${company.rut}`, { x: margin, y, font, size: 10 });
    y -= 50;
    page.drawText('Liquidación de Sueldo', { x: margin, y, font: boldFont, size: 14 });
    y -= 18;
    page.drawText(`${months[payroll.month - 1]} de ${payroll.year}`, { x: margin, y, font, size: 11 });
    y -= 30;

    // === EMPLOYEE DETAILS (2-Column Layout) ===
    const col1X = margin;
    const col2X = margin + 250;
    page.drawText(`Nombre: ${employee.firstName} ${employee.lastName}`, { x: col1X, y, font, size: 10 });
    page.drawText(`RUT: ${employee.rut}`, { x: col2X, y, font, size: 10 });
    y -= 15;
    page.drawText(`Fecha Ingreso: ${formatDate(employee.contractStartDate)}`, { x: col1X, y, font, size: 10 });
    page.drawText(`Cargo: ${employee.position || 'N/A'}`, { x: col2X, y, font, size: 10 });
    y -= 30;

    // === TABLES (EARNINGS & DEDUCTIONS) ===
    const earningsColLabel = margin;
    const earningsColValue = margin + 220;
    const deductionsColLabel = margin + 270;
    const deductionsColValue = width - margin;

    page.drawText('HABERES', { x: earningsColLabel, y, font: boldFont, size: 12 });
    page.drawText('DESCUENTOS', { x: deductionsColLabel, y, font: boldFont, size: 12 });
    y -= 20;

    let yEarnings = y;
    let yDeductions = y;

    // -- Earnings Items --
    const earnings = [
        { label: 'Sueldo Base', value: payroll.baseSalary },
        { label: 'Días Trabajados', value: payroll.workedDays, isInfo: true },
        { label: 'Sueldo Proporcional', value: payroll.proportionalBaseSalary },
        { label: `Gratificación Legal`, value: payroll.gratification },
        ...payroll.bonos.map(b => ({ label: b.glosa, value: b.monto })),
        { label: 'Horas Extras', value: payroll.totalOvertimePay },
    ];

    earnings.forEach(item => {
        if (item.value && item.value > 0) {
            page.drawText(item.label, { x: earningsColLabel, y: yEarnings, font, size: 10 });
            const text = item.isInfo ? String(item.value) : formatCurrency(item.value);
            drawRightAlignedText(page, text, font, 10, earningsColValue, yEarnings);
            yEarnings -= 15;
        }
    });
    
    yEarnings -= 10;
    page.drawText('No Imponibles', { x: earningsColLabel, y: yEarnings, font: boldFont, size: 10 });
    yEarnings -= 15;

    const nonTaxable = [
        { label: 'Movilización', value: employee.mobilization },
        { label: 'Colación', value: employee.collation },
        { label: 'Asignación Familiar', value: payroll.familyAllowance },
    ];

    nonTaxable.forEach(item => {
        if (item.value && item.value > 0) {
            page.drawText(item.label, { x: earningsColLabel, y: yEarnings, font, size: 10 });
            drawRightAlignedText(page, formatCurrency(item.value), font, 10, earningsColValue, yEarnings);
            yEarnings -= 15;
        }
    });

    // -- Deductions Items --
    const deductions = [
        { label: `AFP (${employee.afp})`, value: payroll.afpDiscount },
        { label: `Salud (${employee.healthSystem})`, value: payroll.healthDiscount },
        { label: 'Seguro Cesantía', value: payroll.unemploymentInsuranceDiscount },
        { label: 'Impuesto Único', value: payroll.iut },
        { label: 'Anticipos', value: payroll.advances },
    ];

    deductions.forEach(item => {
        if (item.value && item.value > 0) {
            page.drawText(item.label, { x: deductionsColLabel, y: yDeductions, font, size: 10 });
            drawRightAlignedText(page, formatCurrency(item.value), font, 10, deductionsColValue, yDeductions);
            yDeductions -= 15;
        }
    });

    // === TOTALS ===
    y = Math.min(yEarnings, yDeductions) - 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5 });
    y -= 20;

    page.drawText('Total Haberes', { x: earningsColLabel, y, font: boldFont, size: 11 });
    drawRightAlignedText(page, formatCurrency(payroll.totalEarnings), boldFont, 11, earningsColValue, y);

    page.drawText('Total Descuentos', { x: deductionsColLabel, y, font: boldFont, size: 11 });
    drawRightAlignedText(page, formatCurrency(payroll.totalDiscounts), boldFont, 11, deductionsColValue, y);
    y -= 30;

    // === FINAL NET SALARY ===
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1 });
    y -= 25;

    page.drawText('LÍQUIDO A PAGAR', { x: margin, y, font: boldFont, size: 12 });
    drawRightAlignedText(page, formatCurrency(payroll.netSalary), boldFont, 12, deductionsColValue, y);
    y -= 60;

    // === SIGNATURE ===
    const sigX = width / 2;
    page.drawLine({ start: { x: sigX - 100, y }, end: { x: sigX + 100, y }, thickness: 1 });
    y -= 15;
    page.drawText('Firma Empleador', { x: sigX - (font.widthOfTextAtSize('Firma Empleador', 10) / 2), y, font, size: 10 });

    return pdfDoc.save();
}

// ==========================================================================
// API Endpoint (POST)
// ==========================================================================
export async function POST(request: Request) {
    try {
        const token = request.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const adminApp = getAdminApp();
        const auth = adminApp.auth();
        const db = adminApp.firestore();
        
        const decodedToken = await auth.verifyIdToken(token);
        
        const { companyId, payrollId, employeeId } = await request.json();

        if (!companyId || !payrollId || !employeeId) {
            return new NextResponse(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
        }
        
        const canAccess = await hasCompanyAccess(db, decodedToken.uid, companyId);
        if (!canAccess) {
            return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const [companyDoc, employeeDoc, payrollDoc] = await Promise.all([
            db.collection('companies').doc(companyId).get(),
            db.collection(`companies/${companyId}/employees`).doc(employeeId).get(),
            db.collection(`companies/${companyId}/payrolls`).doc(payrollId).get()
        ]);

        if (!companyDoc.exists || !employeeDoc.exists || !payrollDoc.exists) {
            return new NextResponse(JSON.stringify({ error: 'Required documents could not be found.' }), { status: 404 });
        }

        const pdfBytes = await generatePayslip(companyDoc.data() as Company, employeeDoc.data() as Employee, payrollDoc.data() as Payroll);
        
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="payslip.pdf"`);

        return new NextResponse(pdfBytes, { headers });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
        console.error('[API|generate-payslip-pdf] Error:', errorMessage, error);
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
