
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { generatePayroll } from '@/lib/payroll-generator';
import { Employee } from '@/lib/types';
import { DecodedIdToken } from 'firebase-admin/auth';

// This function authenticates the request and returns the admin app instance and the user's token.
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
        const userDocRef = firestore.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.warn(`User document not found for userId: ${userId}`);
            return false;
        }

        const userData = userDoc.data();
        // An admin has access to all companies
        if (userData?.role === 'Admin') {
            return true;
        }

        // An accountant has access only if the companyId is in their companyIds map.
        if (userData?.role === 'Accountant' && userData.companyIds && userData.companyIds[companyId]) {
            return true;
        }

        console.warn(`Access denied for user ${userId} to company ${companyId}. User role: ${userData?.role}`);
        return false;

    } catch (error) {
        console.error('Error verifying company access:', error);
        return false;
    }
}


// This is the new API route handler for calculating a payroll preview.
export async function POST(req: Request) {
    const { adminApp, decodedToken } = await getAuthenticatedAdmin(req);
    if (!adminApp || !decodedToken) {
        // Correctly return a JSON response for unauthorized errors.
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const body = await req.json();
        const employee = body as Employee; // The employee data is sent in the request body.

        // --- Input Validation ---
        if (!companyId || !year || !month || !employee) {
            let missingParams = [];
            if (!companyId) missingParams.push('companyId');
            if (!year) missingParams.push('year');
            if (!month) missingParams.push('month');
            if (!employee) missingParams.push('employee data');
            return NextResponse.json({ message: `Parámetros incompletos. Faltan: ${missingParams.join(', ')}` }, { status: 400 });
        }

        const firestore = adminApp.firestore();

        // --- Permission Check ---
        const canAccess = await hasCompanyAccess(firestore, decodedToken.uid, companyId);
        if (!canAccess) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const numericYear = parseInt(year, 10);
        const numericMonth = parseInt(month, 10);

        if (isNaN(numericYear) || isNaN(numericMonth)) {
            return NextResponse.json({ message: 'El año y el mes deben ser números válidos.' }, { status: 400 });
        }
        
        // The core logic: use the payroll generator to calculate the preview.
        // We pass 0 for otherTaxableEarnings and otherDiscounts as they are handled in the final processing.
        const payrollDraft = await generatePayroll(firestore, employee, numericYear, numericMonth, 0, 0);

        // Return the calculated draft.
        return NextResponse.json(payrollDraft);

    } catch (error) {
        console.error('Error al calcular la liquidación (preview):', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido en el servidor.';
        
        // Provide a clear error message to the client.
        return NextResponse.json({ message: `Error en el cálculo: ${errorMessage}` }, { status: 500 });
    }
}
