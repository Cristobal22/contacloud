
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { generatePayroll } from '@/lib/payroll-generator';
import { Employee, PayrollDraft } from '@/lib/types';
import { DecodedIdToken } from 'firebase-admin/auth';

async function getAuthenticatedAdmin(req: Request): Promise<{ adminApp: any; decodedToken: DecodedIdToken | null }> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const token = authorization.split('Bearer ')[1];
        try {
            const adminApp = await getAdminApp();
            const decodedToken = await adminApp.auth().verifyIdToken(token);
            return { adminApp, decodedToken };
        } catch (error) {
            console.error('Token verification failed:', error);
            return { adminApp: null, decodedToken: null };
        }
    }
    console.error('Missing or invalid Authorization header.');
    return { adminApp: null, decodedToken: null };
}

async function hasCompanyAccess(firestore: any, userId: string, companyId: string): Promise<boolean> {
    try {
        const [userDoc, companyDoc] = await Promise.all([
            firestore.collection('users').doc(userId).get(),
            firestore.collection('companies').doc(companyId).get()
        ]);

        if (!userDoc.exists || !companyDoc.exists) {
            console.warn(`Access check failed: User or Company document not found. User: ${userId}, Company: ${companyId}`);
            return false;
        }

        const userData = userDoc.data();
        const companyData = companyDoc.data();

        if (userData?.role === 'Admin') {
            return true;
        }

        if (Array.isArray(companyData?.memberUids) && companyData.memberUids.includes(userId)) {
            return true;
        }

        console.warn(`Access Denied. User ${userId} is not an Admin and is not listed in memberUids for company ${companyId}.`);
        return false;

    } catch (error) {
        console.error('Exception caught while verifying company access:', error);
        return false;
    }
}

export async function POST(req: Request) {
    const { adminApp, decodedToken } = await getAuthenticatedAdmin(req);
    if (!adminApp || !decodedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        
        const body = await req.json();
        const employee = body as Employee;
        const overrides: Partial<PayrollDraft> = body.overrides || {};

        if (!companyId || !year || !month || !employee) {
            const missingParams = [!companyId && 'companyId', !year && 'year', !month && 'month', !employee && 'employee data'].filter(Boolean);
            return NextResponse.json({ error: `Incomplete parameters. Missing: ${missingParams.join(', ')}` }, { status: 400 });
        }

        const firestore = adminApp.firestore();

        const canAccess = await hasCompanyAccess(firestore, decodedToken.uid, companyId);
        if (!canAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const numericYear = parseInt(year, 10);
        const numericMonth = parseInt(month, 10);

        if (isNaN(numericYear) || isNaN(numericMonth)) {
            return NextResponse.json({ error: 'Year and month must be valid numbers.' }, { status: 400 });
        }
        
        const payrollDraft = await generatePayroll(
            firestore, 
            employee, 
            numericYear, 
            numericMonth, 
            overrides.workedDays, 
            overrides.absentDays,
            overrides.overtimeHours50,
            overrides.overtimeHours100,
            overrides.variableBonos,
            overrides.advances
        );

        return NextResponse.json(payrollDraft);

    } catch (error) {
        console.error('Error calculating payroll preview:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
