
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
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const payrollId = params.id;

    if (!empresaId) {
        return new Response('Bad Request: empresaId is required', { status: 400 });
    }

    const userCompanies = userProfile.companyIds || [];
    if (userProfile.role !== 'Accountant' || !userCompanies.includes(empresaId)) {
        return new Response('Forbidden', { status: 403 });
    }

    try {
        const firestore = getAdminFirestore();
        const payrollRef = firestore.collection('companies').doc(empresaId).collection('payrolls').doc(payrollId);
        const payrollDoc = await payrollRef.get();

        if (!payrollDoc.exists) {
            return new Response('Not Found: Payroll not found', { status: 404 });
        }

        const payrollData = payrollDoc.data();
        const voucherId = payrollData?.voucherId;

        const batch = firestore.batch();
        batch.delete(payrollRef);

        if (voucherId) {
            const voucherRef = firestore.collection('companies').doc(empresaId).collection('vouchers').doc(voucherId);
            const voucherDoc = await voucherRef.get(); // <-- THE FIX: Check if voucher exists
            if (voucherDoc.exists) { // <-- THE FIX: Only update if it exists
                batch.update(voucherRef, { status: 'Borrador' });
            }
        }

        await batch.commit();

        return NextResponse.json({ message: 'Liquidación revertida con éxito' });

    } catch (error) {
        console.error('Error during payroll annulment:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
