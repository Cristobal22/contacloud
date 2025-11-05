
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { generatePayroll } from '@/lib/payroll-generator';
import { Employee } from '@/lib/types';
import type { app } from 'firebase-admin';

async function getAuthenticatedAdminApp(req: Request): Promise<app.App | null> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const token = authorization.split('Bearer ')[1];
        const adminApp = await getAdminApp();
        try {
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
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return new Response('empresaId is required', { status: 400 });
        }

        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;

        const firestore = adminApp.firestore();
        const employeesSnapshot = await firestore.collection('empresas').doc(empresaId).collection('employees').where('status', '==', 'Activo').get();
        const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];

        // FIX: Pass the new required arguments (otherTaxableEarnings and otherDiscounts) as 0
        const payrollPromises = employees.map(employee => generatePayroll(firestore, employee, year, month, 0, 0));
        const payrolls = await Promise.all(payrollPromises);

        const batch = firestore.batch();
        payrolls.forEach(payroll => {
            if (payroll) { // Ensure payroll is not null
                const docRef = firestore.collection('empresas').doc(empresaId).collection('payrolls').doc();
                batch.set(docRef, payroll);
            }
        });

        await batch.commit();

        return NextResponse.json({ message: 'Liquidaciones procesadas con éxito' });
    } catch (error) {
        console.error('Error al procesar las liquidaciones:', error);
        // Always return a JSON response for errors
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
