import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import type { PayrollDraft, Payroll } from '@/lib/types';
import { WriteBatch } from 'firebase-admin/firestore';

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
    // Capture year and month from the request body
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
    
    // FINAL FIX: Construct the period date reliably on the server-side.
    // This avoids any issues with malformed date strings from the client.
    // We create a UTC date to ensure consistency across timezones.
    const numericYear = parseInt(year, 10);
    const numericMonth = parseInt(month, 10) - 1; // JS months are 0-indexed
    const periodAsDate = new Date(Date.UTC(numericYear, numericMonth, 1));

    if (isNaN(periodAsDate.getTime())) {
        return NextResponse.json({ message: 'Invalid year or month provided, could not create a valid period date.' }, { status: 400 });
    }

    const batch: WriteBatch = db.batch();
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);
    let processedCount = 0;

    drafts.forEach((draft) => {
      const newPayrollRef = payrollsCollectionRef.doc();

      const finalPayroll: Omit<Payroll, 'id'> = {
        employeeId: draft.employeeId,
        companyId: companyId,
        period: periodAsDate, // Use the reliably-constructed Date object
        baseSalary: draft.baseSalary ?? 0,
        taxableEarnings: draft.taxableEarnings ?? 0,
        nonTaxableEarnings: draft.nonTaxableEarnings ?? 0,
        totalEarnings: draft.totalEarnings ?? 0,
        afpDiscount: draft.afpDiscount ?? 0,
        healthDiscount: draft.healthDiscount ?? 0,
        unemploymentInsuranceDiscount: draft.unemploymentInsuranceDiscount ?? 0,
        iut: draft.iut ?? 0,
        totalDiscounts: draft.totalDiscounts ?? 0,
        netSalary: draft.netSalary ?? 0,
        gratification: draft.gratification ?? 0,
        severanceBase: draft.severanceBase ?? 0,
        iutFactor: draft.iutFactor ?? 0,
        iutRebajaInCLP: draft.iutRebajaInCLP ?? 0,
        processedAt: new Date(),
      };

      batch.set(newPayrollRef, finalPayroll);
      processedCount++;
    });

    await batch.commit();

    return NextResponse.json(
      {
        message: 'Payrolls processed successfully.',
        processedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing payrolls:', error);
    // Check if it's a Firebase auth error
    if (error.code && error.code.startsWith('auth/')) {
        return NextResponse.json({ message: `Authentication error: ${error.message}` }, { status: 403 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
