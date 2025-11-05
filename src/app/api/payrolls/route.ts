
import { NextResponse } from 'next/server';
import { adminAuth as auth } from '@/firebase/admin';
import { adminFirestore as firestore } from '@/firebase/admin';
import { Payroll } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const session = await auth().verifyIdToken(req.headers.get('Authorization')?.split('Bearer ')[1] || '');
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return new Response('empresaId is required', { status: 400 });
    }

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const period = `${String(month).padStart(2, '0')}-${year}`;

    const payrollsSnapshot = await firestore.collection('empresas').doc(empresaId).collection('payrolls').where('period', '==', period).get();
    const payrolls = payrollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payroll[];

    return NextResponse.json(payrolls);
  } catch (error) {
    console.error('Error al obtener las liquidaciones:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
