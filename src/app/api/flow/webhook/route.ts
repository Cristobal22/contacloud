import { NextResponse } from 'next/server';
import { adminFirestore } from '@/firebase/admin';
import { add, format } from 'date-fns';
import { FLOW_API_KEY, FLOW_SECRET_KEY, FLOW_API_URL, sign } from '@/lib/flow';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.json({ status: 'error', message: 'Falta el token' }, { status: 400 });
        }

        const params = {
          apiKey: FLOW_API_KEY,
          token: token,
        };
        const signature = await sign(params, FLOW_SECRET_KEY);
        
        const queryString = `apiKey=${FLOW_API_KEY}&token=${token}&s=${signature}`;

        const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${queryString}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al verificar el estado del pago en Flow.');
        }

        const paymentStatus = await response.json();

        // Status 2 significa pago exitoso. Otros estados (1: pendiente, 3: rechazado, 4: anulado) no se procesan.
        if (paymentStatus.status !== 2) {
            console.log(`Pago ${token} no fue exitoso. Estado: ${paymentStatus.status}`);
            return NextResponse.json({ status: 'ok', message: 'Pago no exitoso, no se procesa.' });
        }
        
        const [_, planId, userId] = paymentStatus.commerceOrder.split('_');

        if (!planId || !userId) {
             console.error('commerceOrder no tiene el formato esperado:', paymentStatus.commerceOrder);
             return NextResponse.json({ status: 'error', message: 'Formato de orden inválido.' }, { status: 400 });
        }

        // Si es un pago de prueba, no actualizamos la base de datos, solo confirmamos que el flujo funcionó.
        if (planId === 'test-payment') {
            console.log(`Pago de prueba exitoso para el usuario ${userId}. No se actualiza la suscripción.`);
            return NextResponse.json({ status: 'ok', message: 'Pago de prueba procesado correctamente.' });
        }

        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error(`Usuario con ID ${userId} no encontrado en Firestore.`);
            return NextResponse.json({ status: 'error', message: 'Usuario no encontrado.' }, { status: 404 });
        }
        
        const currentUserData = userDoc.data();
        let currentEndDate = new Date();
        // Si el usuario ya tiene una suscripción activa y futura, agregamos días a esa fecha.
        if (currentUserData && currentUserData.subscriptionEndDate && new Date(currentUserData.subscriptionEndDate) > new Date()) {
            currentEndDate = new Date(currentUserData.subscriptionEndDate);
        }

        const newSubscriptionEndDate = format(add(currentEndDate, { days: 30 }), 'yyyy-MM-dd');

        await userRef.update({
            plan: planId,
            subscriptionEndDate: newSubscriptionEndDate,
        });

        console.log(`Suscripción actualizada para el usuario ${userId}. Nuevo plan: ${planId}, vence el: ${newSubscriptionEndDate}`);

        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('Error en el webhook de Flow:', error);
        return NextResponse.json({ status: 'error', message: 'Error interno del servidor.', details: error.message }, { status: 500 });
    }
}
