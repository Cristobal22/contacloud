
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import type { app } from 'firebase-admin';
import { Payroll } from '@/lib/types';

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
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const firestore = adminApp.firestore();
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return new Response('empresaId is required', { status: 400 });
        }

        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const period = `${String(month).padStart(2, '0')}-${year}`;

        const payrollsSnapshot = await firestore.collection('empresas').doc(empresaId).collection('payrolls').where('period', '==', period).where('isCentralized', '!=', true).get();
        const payrolls = payrollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payroll[];

        if (payrolls.length === 0) {
            return NextResponse.json({ message: 'No hay liquidaciones para centralizar' });
        }

        const totalNetSalary = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
        const totalBaseSalary = payrolls.reduce((acc, p) => acc + p.baseSalary, 0);
        const totalGratification = payrolls.reduce((acc, p) => acc + p.gratification, 0);
        const totalAfpDiscount = payrolls.reduce((acc, p) => acc + p.afpDiscount, 0);
        const totalHealthDiscount = payrolls.reduce((acc, p) => acc + p.healthDiscount, 0);
        const totalUnemploymentInsuranceDiscount = payrolls.reduce((acc, p) => acc + p.unemploymentInsuranceDiscount, 0);
        const totalIUT = payrolls.reduce((acc, p) => acc + p.iut, 0);

        const voucherRef = firestore.collection('empresas').doc(empresaId).collection('vouchers').doc();
        const voucherId = voucherRef.id;

        await voucherRef.set({
            date: new Date(),
            description: `Centralización de remuneraciones para el período ${period}`,
            status: 'Borrador',
            type: 'CENTRALIZACION_REMUNERACIONES',
            period: period,
            entries: [
                { account: 'Sueldos y Salarios', debit: totalBaseSalary + totalGratification, credit: 0 },
                { account: 'Leyes Sociales', debit: totalAfpDiscount + totalHealthDiscount + totalUnemploymentInsuranceDiscount, credit: 0 },
                { account: 'Impuesto Único', debit: totalIUT, credit: 0 },
                { account: 'Sueldos por Pagar', debit: 0, credit: totalNetSalary },
            ],
        });

        const batch = firestore.batch();
        payrolls.forEach(payroll => {
            const docRef = firestore.collection('empresas').doc(empresaId).collection('payrolls').doc(payroll.id);
            batch.update(docRef, { isCentralized: true, voucherId: voucherId });
        });
        await batch.commit();

        return NextResponse.json({ message: 'Remuneraciones centralizadas con éxito', voucherId: voucherId });
    } catch (error) {
        console.error('Error al centralizar las remuneraciones:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
