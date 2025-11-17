
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/auth';

async function verifyTokenAndGetProfile(req: Request): Promise<{ decodedToken: DecodedIdToken; userProfile: any } | null> {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.split('Bearer ')[1];
    if (!token) {
        return null;
    }
    try {
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const firestore = getAdminFirestore();
        const userProfileDoc = await firestore.collection('users').doc(decodedToken.uid).get();
        if (!userProfileDoc.exists) {
            return null;
        }
        return { decodedToken, userProfile: userProfileDoc.data() };
    } catch (error) {
        console.error('Auth Error:', (error as Error).message);
        return null;
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const authResult = await verifyTokenAndGetProfile(req);
    if (!authResult) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { userProfile } = authResult;
    const { searchParams, pathname } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const pathParts = pathname.split('/');
    const payrollId = pathParts[pathParts.length - 1];

    if (!empresaId || typeof empresaId !== 'string') {
        return new Response('Bad Request: empresaId is required and must be a string', { status: 400 });
    }
    if (!payrollId || typeof payrollId !== 'string') {
        return new Response('Bad Request: payrollId is required and must be a string', { status: 400 });
    }

    const allowedRoles = ['Accountant', 'Admin'];

    // Handle the companyIds map structure by extracting its keys.
    const companyIds = userProfile.companyIds;
    let userCompanies: string[] = [];
    if (companyIds && typeof companyIds === 'object' && !Array.isArray(companyIds)) {
        userCompanies = Object.keys(companyIds);
    } else if (Array.isArray(companyIds)) {
        userCompanies = companyIds;
    }

    if (!userProfile.role || !allowedRoles.includes(userProfile.role) || !userCompanies.includes(empresaId)) {
        return new Response('Forbidden: User does not have the required role or company access.', { status: 403 });
    }

    try {
        const firestore = getAdminFirestore();
        await firestore.runTransaction(async (transaction) => {
            const payrollRef = firestore.collection('companies').doc(empresaId).collection('payrolls').doc(payrollId);
            const payrollDoc = await transaction.get(payrollRef);

            if (!payrollDoc.exists) {
                throw new Error('Payroll not found');
            }

            const payrollData = payrollDoc.data();
            const voucherId = payrollData?.voucherId;

            transaction.delete(payrollRef);

            if (voucherId && typeof voucherId === 'string') {
                const voucherRef = firestore.collection('companies').doc(empresaId).collection('vouchers').doc(voucherId);
                const voucherDoc = await transaction.get(voucherRef);
                if (voucherDoc.exists) {
                    transaction.update(voucherRef, { status: 'Borrador' });
                }
            }
        });

        return NextResponse.json({ message: 'Liquidación revertida con éxito' });

    } catch (error: any) {
        console.error('Error during payroll annulment:', error);
        if (error.message === 'Payroll not found') {
            return new Response('Not Found: Payroll not found', { status: 404 });
        }
        return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
