// src/app/api/payroll/cleanup-duplicates/route.ts

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Payroll } from '@/lib/types';

export async function POST(request: Request) {
  const db = getAdminFirestore();

  try {
    const { companyId, year, month } = await request.json();

    if (!companyId || !year || !month) {
      return NextResponse.json({ message: 'Missing required fields: companyId, year, or month.' }, { status: 400 });
    }

    const periodDateUTC = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1)));
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);

    let deletedCount = 0;
    const report: { [employeeId: string]: string } = {};

    await db.runTransaction(async (transaction) => {
      const query = payrollsCollectionRef.where('period', '==', periodDateUTC);
      const snapshot = await transaction.get(query);

      if (snapshot.empty) {
        return; // No payrolls for this period, nothing to do.
      }

      const payrollsByEmployee: { [employeeId: string]: Payroll[] } = {};

      snapshot.forEach(doc => {
        const payroll = { id: doc.id, ...doc.data() } as Payroll;
        if (!payrollsByEmployee[payroll.employeeId]) {
          payrollsByEmployee[payroll.employeeId] = [];
        }
        payrollsByEmployee[payroll.employeeId].push(payroll);
      });

      for (const employeeId in payrollsByEmployee) {
        const duplicates = payrollsByEmployee[employeeId];
        if (duplicates.length > 1) {
          // Sort by creation date, newest first. Handles both Timestamp and Date objects.
          duplicates.sort((a, b) => {
            const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt as any).getTime();
            const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt as any).getTime();
            return timeB - timeA;
          });

          // The first one is the one to keep, delete the rest.
          const payrollsToDelete = duplicates.slice(1);

          payrollsToDelete.forEach(payroll => {
            const docRef = payrollsCollectionRef.doc(payroll.id);
            transaction.delete(docRef);
            deletedCount++;
          });
          
          const keptDate = duplicates[0].createdAt instanceof Timestamp ? duplicates[0].createdAt.toDate().toISOString() : duplicates[0].createdAt;
          report[employeeId] = `Found ${duplicates.length} records. Kept the one from ${keptDate}. Deleted ${payrollsToDelete.length} older records.`;
        }
      }
    });

    if (deletedCount > 0) {
      return NextResponse.json({
        message: `Cleanup successful. Deleted ${deletedCount} duplicate payroll records.`,
        report,
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No duplicates found for the specified period.' }, { status: 200 });
    }

  } catch (error) {
    console.error('[CRITICAL] Error during payroll cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: `Server error during cleanup: ${errorMessage}` }, { status: 500 });
  }
}