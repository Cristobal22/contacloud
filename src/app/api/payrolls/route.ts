
import { NextResponse } from 'next/server';
import { adminAuth as auth } from '@/firebase/admin';
import { adminFirestore as firestore } from '@/firebase/admin';
import { Payroll } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return new Response('Unauthorized: No token provided', { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    // verifyIdToken arrojará un error si el token no es válido, que será capturado por el bloque catch
    const session = await auth().verifyIdToken(idToken);

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
  } catch (error: any) {
    // Si el error es por token inválido, también es Unauthorized
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired') {
      return new Response('Unauthorized: Invalid token', { status: 401 });
    }
    console.error('Error al obtener las liquidaciones:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
