
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { generatePayroll } from '@/lib/payroll-generator';
import type { Employee, PayrollDraft } from '@/lib/types';
import type { app } from 'firebase-admin';

// Helper to authenticate and get the admin app instance
async function getAuthenticatedAdminApp(req: Request): Promise<app.App | null> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const token = authorization.split('Bearer ')[1];
        try {
            const adminApp = await getAdminApp();
            await adminApp.auth().verifyIdToken(token);
            return adminApp;
        } catch (error) {
            console.error('Token verification failed', error);
            return null;
        }
    }
    console.error('Missing or invalid Authorization header');
    return null;
}

export async function POST(req: Request) {
    const adminApp = await getAuthenticatedAdminApp(req);
    if (!adminApp) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const year = parseInt(searchParams.get('year') || '0', 10);
        const month = parseInt(searchParams.get('month') || '0', 10);

        if (!companyId || !year || !month) {
            return NextResponse.json({ message: 'companyId, year, and month are required' }, { status: 400 });
        }

        const draft: PayrollDraft = await req.json();
        if (!draft || !draft.employeeId) {
            return NextResponse.json({ message: 'Invalid payroll draft provided in body' }, { status: 400 });
        }

        const firestore = adminApp.firestore();

        // Fetch the specific employee from the database to ensure data integrity
        const employeeDoc = await firestore.collection('empresas').doc(companyId).collection('employees').doc(draft.employeeId).get();
        if (!employeeDoc.exists) {
            return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
        }
        const employee = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
        
        // Use the backend's single source of truth for calculation
        // We pass the employee from DB and enrich it with the draft's changes
        const otherTaxableEarnings = (draft.variableBonos?.reduce((sum, b) => sum + b.monto, 0) || 0) + (draft.overtimePay || 0);
        const otherDiscounts = draft.advances || 0;

        const calculatedPayroll = await generatePayroll(
            firestore,
            employee,
            year,
            month,
            otherTaxableEarnings,
            otherDiscounts
        );

        // We need to merge the result with the draft's interactive fields
        const responsePayload = {
            ...draft, // keeps fields like absentDays, overtimeHours50, etc.
            ...calculatedPayroll, // adds all calculated financial fields
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('Error calculating payroll preview:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
