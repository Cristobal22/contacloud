import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import type { Payroll } from '@/lib/types';

// Account mapping (This should ideally be configurable by the user/company)
const ACCOUNT_MAP = {
  baseSalary: '4101010',      // Gasto: Sueldos y Salarios
  gratification: '4101020',   // Gasto: Gratificación
  netSalary: '2103010',        // Pasivo: Remuneraciones por Pagar
  afpDiscount: '2104010',      // Pasivo: Leyes Sociales por Pagar
  healthDiscount: '2104010',   // Pasivo: Leyes Sociales por Pagar
  unemploymentInsurance: '2104010', // Pasivo: Leyes Sociales por Pagar
  tax: '2105010',             // Pasivo: Impuesto Único por Pagar
};

export async function POST(request: Request) {
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  try {
    // 1. Authenticate and Authorize User
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    // 2. Validate Request Body
    const body = await request.json();
    const { companyId, payrollIds, status } = body as { companyId: string; payrollIds: string[]; status: 'Borrador' | 'Contabilizado' };

    if (!companyId || !payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0 || !status) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    // 3. Fetch all payroll documents
    const payrollsRef = db.collection(`companies/${companyId}/payrolls`);
    const payrollDocs = await payrollsRef.where('__name__', 'in', payrollIds).get();
    
    if (payrollDocs.empty) {
        return NextResponse.json({ message: "No matching payrolls found." }, { status: 404 });
    }

    const payrolls = payrollDocs.docs.map(doc => doc.data() as Payroll);

    // 4. Aggregate amounts
    const totals = {
        baseSalary: 0,
        gratification: 0,
        afpDiscount: 0,
        healthDiscount: 0,
        unemploymentInsuranceDiscount: 0,
        iut: 0,
        netSalary: 0,
    };

    payrolls.forEach(p => {
        totals.baseSalary += p.baseSalary ?? 0;
        totals.gratification += p.gratification ?? 0;
        totals.afpDiscount += p.afpDiscount ?? 0;
        totals.healthDiscount += p.healthDiscount ?? 0;
        totals.unemploymentInsuranceDiscount += p.unemploymentInsuranceDiscount ?? 0;
        totals.iut += p.iut ?? 0;
        totals.netSalary += p.netSalary ?? 0;
    });

    const leyesSocialesPorPagar = totals.afpDiscount + totals.healthDiscount + totals.unemploymentInsuranceDiscount;

    // 5. Create Journal Entry Lines
    const journalLines = [];
    if (totals.baseSalary > 0) journalLines.push({ accountId: ACCOUNT_MAP.baseSalary, debit: totals.baseSalary, credit: 0, glosa: 'Sueldos y Salarios' });
    if (totals.gratification > 0) journalLines.push({ accountId: ACCOUNT_MAP.gratification, debit: totals.gratification, credit: 0, glosa: 'Gratificación Legal' });
    if (leyesSocialesPorPagar > 0) journalLines.push({ accountId: ACCOUNT_MAP.afpDiscount, debit: 0, credit: leyesSocialesPorPagar, glosa: 'Leyes Sociales por Pagar' });
    if (totals.iut > 0) journalLines.push({ accountId: ACCOUNT_MAP.tax, debit: 0, credit: totals.iut, glosa: 'Impuesto Único a los Trabajadores' });
    if (totals.netSalary > 0) journalLines.push({ accountId: ACCOUNT_MAP.netSalary, debit: 0, credit: totals.netSalary, glosa: 'Remuneraciones por Pagar' });

    // 6. Create and save the Journal Voucher
    const period = payrolls[0]?.period; // Use period from the first payroll
    const voucherRef = db.collection(`companies/${companyId}/vouchers`).doc();

    await voucherRef.set({
        id: voucherRef.id,
        companyId,
        type: 'Traspaso',
        date: new Date(),
        period: period || new Date(),
        glosa: `Centralización de Remuneraciones ${period ? new Date(period.seconds * 1000).toLocaleDateString('es-CL') : ''}`,
        lines: journalLines,
        status: status, // 'Borrador' or 'Contabilizado' from request
        createdAt: new Date(),
    });

    return NextResponse.json({ message: `Voucher created successfully with status: ${status}`, voucherId: voucherRef.id }, { status: 201 });

  } catch (error) {
    console.error("Error during payroll centralization:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
