// src/app/api/payroll/process/route.ts

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Employee, Payroll } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import { generatePayroll } from '@/lib/payroll-generator';

export async function POST(request: Request) {
  const db = getAdminFirestore();

  try {
    const body = await request.json();
    const { companyId, employees: employeesFromClient, year, month, overrides } = body as {
        companyId: string;
        employees: Partial<Employee>[];
        year: number;
        month: number;
        overrides: { [employeeId: string]: any };
    };

    if (!companyId || !employeesFromClient || !Array.isArray(employeesFromClient) || !year || !month) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    // --- Step 1: Pre-Transaction Data Fetching ---
    // Fetch all required employee documents beforehand.
    const employeeDocs = await Promise.all(
        employeesFromClient.map(e => e.id ? db.collection(`companies/${companyId}/employees`).doc(e.id).get() : Promise.resolve(null))
    );

    const fullEmployees: Employee[] = employeeDocs
        .filter(doc => doc !== null && doc.exists)
        .map(doc => ({ id: doc!.id, ...doc!.data() } as Employee));

    if (fullEmployees.length === 0) {
        return NextResponse.json({ message: "No valid employees found to process." }, { status: 400 });
    }

    // --- Step 2: In-Memory Calculation ---
    // Call generatePayroll for each employee with the fetched data.
    // This happens entirely in memory without further DB reads inside the loop.
    const calculatedPayrolls: Payroll[] = [];
    for (const employee of fullEmployees) {
        const employeeOverrides = overrides[employee.id] || {};
        try {
            const payrollData = await generatePayroll(
                db, // db is passed but generatePayroll will use it to fetch aux data
                employee,
                year,
                month,
                employeeOverrides.workedDays,
                employeeOverrides.absentDays,
                employeeOverrides.overtimeHours50,
                employeeOverrides.overtimeHours100,
                employeeOverrides.variableBonos,
                employeeOverrides.advances
            );
            calculatedPayrolls.push(payrollData as Payroll);
        } catch (error) {
            console.error(`Skipping payroll for ${employee.id} due to calculation error:`, error);
            // Optionally, you could collect these errors and return them
        }
    }

    // --- Step 3: Atomic Write-Only Transaction ---
    const periodDateUTC = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1)));
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);

    await db.runTransaction(async (transaction) => {
        // Perform all reads first
        const existingPayrollsQuery = payrollsCollectionRef.where('period', '==', periodDateUTC);
        const existingPayrollsSnap = await transaction.get(existingPayrollsQuery);

        // Now, perform all writes
        if (!existingPayrollsSnap.empty) {
            existingPayrollsSnap.forEach(doc => transaction.delete(doc.ref));
        }

        calculatedPayrolls.forEach(payroll => {
            const newPayrollDocRef = payrollsCollectionRef.doc();
            const finalPayroll: Payroll = {
                ...payroll,
                id: newPayrollDocRef.id,
                companyId,
                period: periodDateUTC,
                status: 'processed',
                createdAt: Timestamp.now(),
            };
            transaction.set(newPayrollDocRef, finalPayroll);
        });
    });

    return NextResponse.json({ message: `Payrolls processed successfully. ${calculatedPayrolls.length} payrolls created.` }, { status: 200 });

  } catch (error) {
    console.error('[CRITICAL] Error processing payrolls:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: `Server error during payroll processing: ${errorMessage}` }, { status: 500 });
  }
}
