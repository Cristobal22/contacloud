import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import type { Voucher, Payroll } from '@/lib/types';

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
    const { companyId, voucherId } = body as { companyId: string; voucherId: string };

    if (!companyId || !voucherId) {
      return NextResponse.json({ message: 'Invalid data: companyId and voucherId are required.' }, { status: 400 });
    }

    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || !companyDoc.data()?.memberUids?.includes(uid)) {
      return NextResponse.json({ message: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    const voucherRef = db.collection(`companies/${companyId}/vouchers`).doc(voucherId);
    
    await db.runTransaction(async (transaction) => {
      const voucherDoc = await transaction.get(voucherRef);
      if (!voucherDoc.exists) {
        throw new Error("Voucher not found.");
      }
      const voucherData = voucherDoc.data() as Voucher;

      // This logic specifically targets payroll centralization vouchers
      if (voucherData.description?.startsWith('Centralización de Remuneraciones')) {
        // Extract period from the description, e.g., "Centralización de Remuneraciones - 7/2024"
        const match = voucherData.description.match(/(\d+)\/(\d{4})$/);
        if (match) {
          const month = parseInt(match[1], 10);
          const year = parseInt(match[2], 10);

          // Find all associated payroll documents for that period
          const payrollsQuery = db.collection(`companies/${companyId}/payrolls`)
            .where('year', '==', year)
            .where('month', '==', month);
            
          const payrollsSnapshot = await payrollsQuery.get(); // Use get() directly without transaction

          if (!payrollsSnapshot.empty) {
            console.log(`Found ${payrollsSnapshot.size} payroll documents to delete for period ${month}/${year}.`);
            payrollsSnapshot.forEach(doc => {
              transaction.delete(doc.ref); // Delete each payroll document within the transaction
            });
          }
        }
      }
      
      // Finally, delete the voucher itself
      transaction.delete(voucherRef);
    });

    return NextResponse.json({ message: 'El comprobante y todas las liquidaciones asociadas han sido eliminados.' }, { status: 200 });

  } catch (error) {
    console.error('Error undoing centralization voucher:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
