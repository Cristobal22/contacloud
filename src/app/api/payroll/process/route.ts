import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import type { PayrollDraft, Payroll, Voucher, VoucherEntry } from '@/lib/types';
import { WriteBatch, Timestamp } from 'firebase-admin/firestore';

// Placeholder for a function that would get real account IDs from a chart of accounts
// For now, we'll use hardcoded string identifiers as placeholders.
const getAccountId = (accountName: string) => {
    const mapping: { [key: string]: string } = {
        'Remuneraciones': '620101', // Expense
        'Sueldos por Pagar': '210501', // Liability
        'Leyes Sociales por Pagar': '210401', // Liability
        'Impuestos por Pagar': '210301', // Liability
        'Anticipo al Personal': '110601', // Asset
    };
    return mapping[accountName] || accountName; // Return name as ID if not found
};

export async function POST(request: Request) {
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No Bearer token provided." }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken: DecodedIdToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (!uid) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token.' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, drafts, year, month } = body as { companyId: string; drafts: PayrollDraft[], year: string, month: string };

    if (!companyId || !drafts || !Array.isArray(drafts) || drafts.length === 0 || !year || !month) {
      return NextResponse.json({ message: 'Invalid data: companyId, non-empty drafts array, year, and month are required.' }, { status: 400 });
    }

    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return NextResponse.json({ message: 'The specified company does not exist.' }, { status: 404 });
    }

    const companyData = companyDoc.data();
    if (!companyData?.memberUids?.includes(uid)) {
      return NextResponse.json({ message: 'You do not have permission to process payrolls for this company.' }, { status: 403 });
    }
    
    const numericYear = parseInt(year, 10);
    const numericMonth = parseInt(month, 10) - 1; // JS months are 0-indexed
    const periodAsDate = new Date(Date.UTC(numericYear, numericMonth, 1));

    if (isNaN(periodAsDate.getTime())) {
        return NextResponse.json({ message: 'Invalid year or month provided, could not create a valid period date.' }, { status: 400 });
    }

    const batch: WriteBatch = db.batch();
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);
    let processedCount = 0;

    // --- AGGREGATE TOTALS FOR VOUCHER ---
    const totals = drafts.reduce((acc, draft) => {
        acc.totalEarnings += draft.totalEarnings ?? 0;
        acc.netSalary += draft.netSalary ?? 0;
        acc.afpDiscount += draft.afpDiscount ?? 0;
        acc.healthDiscount += draft.healthDiscount ?? 0;
        acc.unemploymentInsuranceDiscount += draft.unemploymentInsuranceDiscount ?? 0;
        acc.iut += draft.iut ?? 0;
        acc.advances += draft.advances ?? 0;
        return acc;
    }, {
        totalEarnings: 0, netSalary: 0, afpDiscount: 0, healthDiscount: 0,
        unemploymentInsuranceDiscount: 0, iut: 0, advances: 0,
    });
    
    const totalSocialLaws = totals.afpDiscount + totals.healthDiscount + totals.unemploymentInsuranceDiscount;

    // --- SAVE INDIVIDUAL PAYROLLS ---
    drafts.forEach((draft) => {
      const newPayrollRef = payrollsCollectionRef.doc();
      // Construct the final payroll object, ensuring all fields are present
      const finalPayroll: Omit<Payroll, 'id'> = {
        companyId: companyId,
        employeeId: draft.employeeId!, // Assert non-null as it's essential
        employeeName: draft.employeeName!,
        period: Timestamp.fromDate(periodAsDate),
        year: numericYear,
        month: numericMonth + 1,
        workedDays: draft.workedDays ?? 30,
        baseSalary: draft.baseSalary ?? 0,
        absentDays: draft.absentDays ?? 0,
        proportionalBaseSalary: draft.proportionalBaseSalary ?? 0,
        overtimeHours50: draft.overtimeHours50 ?? 0,
        overtimeHours100: draft.overtimeHours100 ?? 0,
        totalOvertimePay: draft.totalOvertimePay ?? 0,
        bonos: draft.bonos ?? [],
        gratification: draft.gratification ?? 0,
        taxableEarnings: draft.taxableEarnings ?? 0,
        nonTaxableEarnings: draft.nonTaxableEarnings ?? 0,
        totalEarnings: draft.totalEarnings ?? 0,
        afpDiscount: draft.afpDiscount ?? 0,
        healthDiscount: draft.healthDiscount ?? 0,
        unemploymentInsuranceDiscount: draft.unemploymentInsuranceDiscount ?? 0,
        iut: draft.iut ?? 0,
        familyAllowance: draft.familyAllowance ?? 0,
        advances: draft.advances ?? 0,
        totalDiscounts: draft.totalDiscounts ?? 0,
        netSalary: draft.netSalary ?? 0,
        createdAt: Timestamp.now(),
      };

      batch.set(newPayrollRef, finalPayroll);
      processedCount++;
    });

    // --- CREATE CENTRALIZATION VOUCHER ---
    const voucherEntries: VoucherEntry[] = [];

    // Debit Entry (Expense)
    if (totals.totalEarnings > 0) {
        voucherEntries.push({
            accountId: getAccountId('Remuneraciones'),
            accountName: 'Remuneraciones',
            debit: Math.round(totals.totalEarnings),
            credit: 0,
        });
    }

    // Credit Entries (Liabilities & Clearing)
    if (totals.netSalary > 0) {
        voucherEntries.push({ accountId: getAccountId('Sueldos por Pagar'), accountName: 'Sueldos por Pagar', debit: 0, credit: Math.round(totals.netSalary) });
    }
    if (totalSocialLaws > 0) {
        voucherEntries.push({ accountId: getAccountId('Leyes Sociales por Pagar'), accountName: 'Leyes Sociales por Pagar', debit: 0, credit: Math.round(totalSocialLaws) });
    }
    if (totals.iut > 0) {
        voucherEntries.push({ accountId: getAccountId('Impuestos por Pagar'), accountName: 'Impuestos por Pagar', debit: 0, credit: Math.round(totals.iut) });
    }
    if (totals.advances > 0) {
        voucherEntries.push({ accountId: getAccountId('Anticipo al Personal'), accountName: 'Anticipo al Personal', debit: 0, credit: Math.round(totals.advances) });
    }
    
    // Verify debits and credits balance
    const totalDebits = voucherEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = voucherEntries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebits !== totalCredits) {
        console.warn(`Voucher for ${companyId} is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}. Adding a balancing entry.`);
        // This is a fallback to prevent invalid accounting, should be investigated if it happens often.
        const difference = totalDebits - totalCredits;
        voucherEntries.push({ 
            accountId: 'CUENTA-DE-AJUSTE', 
            accountName: 'Ajuste por Centralización', 
            debit: difference > 0 ? 0 : -difference, 
            credit: difference < 0 ? 0 : difference 
        });
    }

    if (voucherEntries.length > 0) {
        const newVoucherRef = db.collection(`companies/${companyId}/vouchers`).doc();
        const voucherData: Omit<Voucher, 'id'> = {
            companyId,
            date: Timestamp.fromDate(periodAsDate),
            description: `Centralización de Remuneraciones - ${parseInt(month, 10)}/${year}`,
            type: 'Traspaso',
            status: 'Borrador', // <-- CRITICAL FIX: Set status to Draft
            total: totalDebits, 
            entries: voucherEntries,
            createdAt: Timestamp.now(),
        };
        batch.set(newVoucherRef, voucherData);
    }

    await batch.commit();

    return NextResponse.json(
      {
        message: 'Payrolls and centralization voucher processed successfully.',
        processedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing payrolls:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
