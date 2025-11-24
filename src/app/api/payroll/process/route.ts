import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import type { PayrollDraft, Payroll, Voucher, VoucherEntry, PayrollAccountMappings, Company } from '@/lib/types';
import { WriteBatch, Timestamp } from 'firebase-admin/firestore';

const getMappingKeyForName = (itemName: string): keyof PayrollAccountMappings | undefined => {
    const name = itemName.toLowerCase();
    if (name.includes('sueldo') || name.includes('base')) return 'expense_baseSalary';
    if (name.includes('gratificación')) return 'expense_gratification';
    if (name.includes('horas extra')) return 'expense_overtime';
    if (name.includes('bono') || name.includes('comision') || name.includes('comisión')) return 'expense_bonuses';
    if (name.includes('movilización')) return 'expense_transportation';
    if (name.includes('colación')) return 'expense_mealAllowance';
    return undefined;
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

    const companyData = companyDoc.data() as Company;
    if (!companyData?.memberUids?.includes(uid)) {
      return NextResponse.json({ message: 'You do not have permission to process payrolls for this company.' }, { status: 403 });
    }
    
    const mappings = companyData.payrollAccountMappings;
    if (!mappings) {
        return NextResponse.json({ message: 'Error: La configuración de mapeo de cuentas de remuneraciones no ha sido definida.' }, { status: 400 });
    }

    const accountsSnapshot = await db.collection(`companies/${companyId}/accounts`).get();
    const accountsMap = new Map<string, string>();
    accountsSnapshot.forEach(doc => {
        const data = doc.data();
        accountsMap.set(data.code, data.name);
    });

    const numericYear = parseInt(year, 10);
    const numericMonth = parseInt(month, 10) - 1;
    const periodAsDate = new Date(Date.UTC(numericYear, numericMonth, 1));

    if (isNaN(periodAsDate.getTime())) {
        return NextResponse.json({ message: 'Invalid year or month provided.' }, { status: 400 });
    }

    const batch: WriteBatch = db.batch();
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);
    
    const voucherAggregates: { [accountId: string]: { debit: number, credit: number, accountName: string } } = {};

    const addEntry = (accountId: string | undefined, debit: number, credit: number) => {
        if (!accountId) return;
        const accountName = accountsMap.get(accountId);
        if (!accountName) {
            console.warn(`Voucher entry skipped: Account ID "${accountId}" not found in chart of accounts.`);
            return;
        }
        if (!voucherAggregates[accountId]) {
            voucherAggregates[accountId] = { debit: 0, credit: 0, accountName: accountName };
        }
        voucherAggregates[accountId].debit += debit;
        voucherAggregates[accountId].credit += credit;
    };

    let totalNetSalary = 0;

    drafts.forEach((draft) => {
      const newPayrollRef = payrollsCollectionRef.doc();
      
      const finalPayroll: Omit<Payroll, 'id'> = {
        companyId,
        employeeId: draft.employeeId,
        employeeName: draft.employeeName || '',
        period: Timestamp.fromDate(periodAsDate),
        year: numericYear,
        month: numericMonth + 1,
        baseSalary: draft.baseSalary || 0,
        workedDays: draft.workedDays || 0,
        absentDays: draft.absentDays || 0,
        proportionalBaseSalary: draft.proportionalBaseSalary || 0,
        overtimeHours50: draft.overtimeHours50 || 0,
        overtimeHours100: draft.overtimeHours100 || 0,
        totalOvertimePay: draft.totalOvertimePay || 0,
        bonos: draft.variableBonos || [],
        gratification: draft.gratification || 0,
        taxableEarnings: draft.taxableEarnings || 0,
        nonTaxableEarnings: draft.nonTaxableEarnings || 0,
        totalEarnings: draft.totalEarnings || 0,
        afpDiscount: draft.afpDiscount || 0,
        healthDiscount: draft.healthDiscount || 0,
        unemploymentInsuranceDiscount: draft.unemploymentInsuranceDiscount || 0,
        iut: draft.iut || 0,
        familyAllowance: draft.familyAllowance || 0,
        advances: draft.advances || 0,
        totalDiscounts: draft.totalDiscounts || 0,
        netSalary: draft.netSalary || 0,
        createdAt: Timestamp.now(),
        earnings: draft.earnings || [],
        discounts: draft.discounts || [],
        sisDiscount: draft.sisDiscount || 0,
        employerUnemploymentInsurance: draft.employerUnemploymentInsurance || 0,
        ccafDiscount: draft.ccafDiscount || 0,
      };
      batch.set(newPayrollRef, finalPayroll);

      totalNetSalary += draft.netSalary ?? 0;

      draft.earnings?.forEach(earning => {
          const mappingKey = getMappingKeyForName(earning.name);
          if (mappingKey) {
              addEntry(mappings[mappingKey], Math.round(earning.amount), 0);
          }
      });

      if (draft.sisDiscount && draft.sisDiscount > 0) {
          addEntry(mappings.expense_sis, Math.round(draft.sisDiscount), 0);
          addEntry(mappings.liability_afp, 0, Math.round(draft.sisDiscount));
      }
      if (draft.employerUnemploymentInsurance && draft.employerUnemploymentInsurance > 0) {
          addEntry(mappings.expense_unemployment, Math.round(draft.employerUnemploymentInsurance), 0);
          addEntry(mappings.liability_unemployment, 0, Math.round(draft.employerUnemploymentInsurance));
      }

      if (draft.afpDiscount && draft.afpDiscount > 0) addEntry(mappings.liability_afp, 0, Math.round(draft.afpDiscount));
      if (draft.healthDiscount && draft.healthDiscount > 0) addEntry(mappings.liability_health, 0, Math.round(draft.healthDiscount));
      if (draft.unemploymentInsuranceDiscount && draft.unemploymentInsuranceDiscount > 0) addEntry(mappings.liability_unemployment, 0, Math.round(draft.unemploymentInsuranceDiscount));
      if (draft.iut && draft.iut > 0) addEntry(mappings.liability_tax, 0, Math.round(draft.iut));
      if (draft.advances && draft.advances > 0) addEntry(mappings.liability_advances, 0, Math.round(draft.advances));
      if (draft.ccafDiscount && draft.ccafDiscount > 0) addEntry(mappings.liability_ccaf, 0, Math.round(draft.ccafDiscount));
    });

    if (totalNetSalary > 0) {
        addEntry(companyData.salariesPayableAccount, 0, Math.round(totalNetSalary));
    }

    const voucherEntries: VoucherEntry[] = Object.entries(voucherAggregates).map(([accountId, data]) => ({
        accountId,
        accountName: data.accountName,
        debit: data.debit,
        credit: data.credit
    })).filter(e => e.debit > 0 || e.credit > 0);

    const totalDebits = voucherEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = voucherEntries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.round(totalDebits) !== Math.round(totalCredits)) {
        const difference = totalDebits - totalCredits;
        voucherEntries.push({ 
            accountId: 'CUENTA-DE-AJUSTE', 
            accountName: 'Ajuste por Centralización', 
            debit: difference > 0 ? 0 : Math.abs(difference), 
            credit: difference < 0 ? 0 : difference 
        });
    }

    if (voucherEntries.length > 0) {
        const newVoucherRef = db.collection(`companies/${companyId}/vouchers`).doc();
        const totalVoucherAmount = voucherEntries.reduce((sum, e) => sum + e.debit, 0);
        const voucherData: Omit<Voucher, 'id'> = {
            companyId,
            date: Timestamp.fromDate(periodAsDate),
            description: `Centralización de Remuneraciones - ${parseInt(month, 10)}/${year}`,
            type: 'Traspaso',
            status: 'Borrador',
            total: totalVoucherAmount, 
            entries: voucherEntries,
            createdAt: Timestamp.now(),
        };
        batch.set(newVoucherRef, voucherData);
    }

    await batch.commit();

    return NextResponse.json(
      {
        message: 'Payrolls and granular centralization voucher processed successfully.',
        processedCount: drafts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing payrolls:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
