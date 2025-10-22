
import { NextResponse } from 'next/server';
import Flow from 'flow-api-client';
import { adminFirestore } from '@/firebase/admin';
import { add, format } from 'date-fns';

// Configura Flow con tus credenciales directamente aquí
// <-- REEMPLAZA CON TU API KEY REAL
const FLOW_API_KEY = 'TU_API_KEY_AQUI';
// <-- REEMPLAZA CON TU SECRET KEY REAL
const FLOW_SECRET_KEY = 'TU_SECRET_KEY_AQUI';

const flow = new Flow({
    apiKey: FLOW_API_KEY,
    secret: FLOW_SECRET_KEY,
    production: false, // Cambia a true en producción
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.json({ status: 'error', message: 'Falta el token' }, { status: 400 });
        }

        const paymentStatus = await flow.send('payment/get', { token }, 'GET');

        if (paymentStatus.status !== 2) {
            console.log(`Pago ${token} no fue exitoso. Estado: ${paymentStatus.status}`);
            return NextResponse.json({ status: 'ok', message: 'Pago no exitoso, no se procesa.' });
        }
        
        const [_, planId, userId] = paymentStatus.commerceOrder.split('_');

        if (!planId || !userId) {
             console.error('commerceOrder no tiene el formato esperado:', paymentStatus.commerceOrder);
             return NextResponse.json({ status: 'error', message: 'Formato de orden inválido.' }, { status: 400 });
        }

        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error(`Usuario con ID ${userId} no encontrado en Firestore.`);
            return NextResponse.json({ status: 'error', message: 'Usuario no encontrado.' }, { status: 404 });
        }
        
        const currentUserData = userDoc.data();
        let currentEndDate = new Date();
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
        return NextResponse.json({ status: 'error', message: 'Error interno del servidor.' }, { status: 500 });
    }
}
