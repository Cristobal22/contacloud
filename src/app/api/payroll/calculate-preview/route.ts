
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { generatePayroll } from '@/lib/payroll-generator';
import { Employee } from '@/lib/types';
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

// FINAL AND CORRECTED PERMISSION LOGIC
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

        // 1. Admin role has universal access.
        if (userData?.role === 'Admin') {
            return true;
        }

        // 2. User has access if their UID is in the company's `memberUids` array.
        // This is the definitive check that covers both owners and assigned accountants,
        // based on the evidence from the rest of the application.
        if (Array.isArray(companyData?.memberUids) && companyData.memberUids.includes(userId)) {
            return true;
        }

        // If none of the above checks pass, deny access.
        console.warn(`Access Denied. User ${userId} is not an Admin and is not listed in memberUids for company ${companyId}.`);
        return false;

    } catch (error) {
        console.error('Exception caught while verifying company access:', error);
        return false;
    }
}


// API route handler for calculating a payroll preview.
export async function POST(req: Request) {
    const { adminApp, decodedToken } = await getAuthenticatedAdmin(req);
    if (!adminApp || !decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const body = await req.json();
        const employee = body as Employee; 

        if (!companyId || !year || !month || !employee) {
            const missingParams = [!companyId && 'companyId', !year && 'year', !month && 'month', !employee && 'employee data'].filter(Boolean);
            return NextResponse.json({ message: `Incomplete parameters. Missing: ${missingParams.join(', ')}` }, { status: 400 });
        }

        const firestore = adminApp.firestore();

        // Call the definitive, corrected access logic.
        const canAccess = await hasCompanyAccess(firestore, decodedToken.uid, companyId);
        if (!canAccess) {
            // Return the Forbidden error, which is the correct behavior if access is denied.
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const numericYear = parseInt(year, 10);
        const numericMonth = parseInt(month, 10);

        if (isNaN(numericYear) || isNaN(numericMonth)) {
            return NextResponse.json({ message: 'Year and month must be valid numbers.' }, { status: 400 });
        }
        
        const payrollDraft = await generatePayroll(firestore, employee, numericYear, numericMonth, 0, 0);

        return NextResponse.json(payrollDraft);

    } catch (error) {
        console.error('Error calculating payroll preview:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return NextResponse.json({ message: `Calculation error: ${errorMessage}` }, { status: 500 });
    }
}
