// src/app/api/payroll/process/route.ts

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import type { Employee, Payroll, Company } from '@/lib/types';
import { WriteBatch, Timestamp } from 'firebase-admin/firestore';
import { generatePayroll } from '@/lib/payroll-generator';

// FINAL, DEFINITIVE FIX: The endpoint now adds the crucial `period` Timestamp field to each payroll document before saving.
// The UI uses this exact field to query for and display processed payrolls for a given month.
// Its absence was the reason processed payrolls were not appearing on screen despite being successfully saved.

export async function POST(request: Request) {
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    await auth.verifyIdToken(idToken);

    const body = await request.json();
    const { companyId, employees: employeesFromClient, year, month, overrides } = body as {
        companyId: string;
        employees: Partial<Employee>[];
        year: number;
        month: number;
        overrides: { [employeeId: string]: any };
    };

    if (!companyId || !employeesFromClient || !Array.isArray(employeesFromClient) || employeesFromClient.length === 0 || !year || !month) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    // *** THIS IS THE CRITICAL FIX ***
    // Create the Timestamp for the period. The client query depends on this exact value.
    const periodDateUTC = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1)));

    const companyRef = db.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }

    const batch: WriteBatch = db.batch();
    const payrollsCollectionRef = db.collection(`companies/${companyId}/payrolls`);
    
    for (const employeeStub of employeesFromClient) {
        if (!employeeStub.id) {
            console.warn('Skipping an employee in the list because it has no ID.');
            continue;
        }

        const employeeRef = db.collection(`companies/${companyId}/employees`).doc(employeeStub.id);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            console.warn(`Employee with ID ${employeeStub.id} not found. Skipping.`);
            continue;
        }

        const fullEmployee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
        const employeeOverrides = overrides[fullEmployee.id] || {};

        const calculatedPayroll = await generatePayroll(
            db,
            fullEmployee,
            year,
            month,
            employeeOverrides.workedDays,
            employeeOverrides.absentDays,
            employeeOverrides.overtimeHours50,
            employeeOverrides.overtimeHours100,
            employeeOverrides.variableBonos,
            employeeOverrides.advances
        );

        const finalPayroll: Payroll = {
            ...(calculatedPayroll as Payroll),
            id: payrollsCollectionRef.doc().id,
            companyId,
            period: periodDateUTC, // Added the missing period field
            status: 'processed',
            createdAt: Timestamp.now(),
        };

        batch.set(payrollsCollectionRef.doc(finalPayroll.id), finalPayroll);
    }

    if (batch.isEmpty) {
        return NextResponse.json({ message: "No valid employees found to process." }, { status: 400 });
    }

    await batch.commit();

    return NextResponse.json({ message: 'Payrolls recalculated and processed successfully.' }, { status: 200 });

  } catch (error) {
    console.error('[CRITICAL] Error processing payrolls:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return NextResponse.json({ message: `Server error during payroll processing: ${errorMessage}` }, { status: 500 });
  }
}