import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import type { PayrollDraft, Payroll, Voucher, VoucherEntry, PayrollAccountMappings, Company } from '@/lib/types';
import { WriteBatch, Timestamp } from 'firebase-admin/firestore';

/**
 * Translates a payroll item's user-facing name to its corresponding key in the PayrollAccountMappings object.
 * This allows flexibility in the item names (e.g., 'Horas Extra (50%)' still maps to 'expense_overtime').
 * @param itemName The name of the payroll earning or discount item.
 * @returns The corresponding key from PayrollAccountMappings or undefined if not found.
 */
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

    // Fetch the company's chart of accounts to resolve account names from IDs
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
        if (!accountId) return; // Silently ignore if no account is mapped
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
        // ... (payroll data setup - same as before)
      };
      batch.set(newPayrollRef, finalPayroll);

      totalNetSalary += draft.netSalary ?? 0;

      // 1. Process Granular Earnings (Debits to Expense Accounts)
      draft.earnings?.forEach(earning => {
          const mappingKey = getMappingKeyForName(earning.name);
          if (mappingKey) {
              addEntry(mappings[mappingKey], Math.round(earning.amount), 0);
          }
      });

      // 2. Process Employer Contributions (Debit Expense, Credit Liability)
      if (draft.sisDiscount && draft.sisDiscount > 0) {
          addEntry(mappings.expense_sis, Math.round(draft.sisDiscount), 0);
          addEntry(mappings.liability_afp, 0, Math.round(draft.sisDiscount));
      }
      if (draft.employerUnemploymentInsurance && draft.employerUnemploymentInsurance > 0) {
          addEntry(mappings.expense_unemployment, Math.round(draft.employerUnemploymentInsurance), 0);
          addEntry(mappings.liability_unemployment, 0, Math.round(draft.employerUnemploymentInsurance));
      }

      // 3. Process Employee Discounts (Credits to Liability Accounts)
      if (draft.afpDiscount && draft.afpDiscount > 0) addEntry(mappings.liability_afp, 0, Math.round(draft.afpDiscount));
      if (draft.healthDiscount && draft.healthDiscount > 0) addEntry(mappings.liability_health, 0, Math.round(draft.healthDiscount));
      if (draft.unemploymentInsuranceDiscount && draft.unemploymentInsuranceDiscount > 0) addEntry(mappings.liability_unemployment, 0, Math.round(draft.unemploymentInsuranceDiscount));
      if (draft.iut && draft.iut > 0) addEntry(mappings.liability_tax, 0, Math.round(draft.iut));
      if (draft.advances && draft.advances > 0) addEntry(mappings.liability_advances, 0, Math.round(draft.advances));
      if (draft.ccafDiscount && draft.ccafDiscount > 0) addEntry(mappings.liability_ccaf, 0, Math.round(draft.ccafDiscount));
    });

    // 4. Add Net Salary payable (Credit to Liability)
    if (totalNetSalary > 0) {
        addEntry(companyData.salariesPayableAccount, 0, Math.round(totalNetSalary));
    }

    const voucherEntries: VoucherEntry[] = Object.entries(voucherAggregates).map(([accountId, data]) => ({
        accountId,
        accountName: data.accountName,
        debit: data.debit,
        credit: data.credit
    })).filter(e => e.debit > 0 || e.credit > 0); // Filter out zero entries

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
