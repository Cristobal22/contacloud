
import { NextResponse } from 'next/server';
import Flow from 'flow-api-client';
import { adminApp, adminFirestore } from '@/firebase/admin';
import { add, format } from 'date-fns';

// Inicializa el SDK de Flow con tus credenciales
const flow = new Flow({
    apiKey: process.env.FLOW_API_KEY || '',
    secret: process.env.FLOW_SECRET_KEY || '',
    production: false, // Cambia a true en producción
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.json({ status: 'error', message: 'Falta el token' }, { status: 400 });
        }

        // 1. Validar el estado del pago con Flow
        const paymentStatus = await flow.send('payment/get', { token }, 'GET');

        // 2. Verificar que el pago fue exitoso (status = 2 para pago exitoso)
        if (paymentStatus.status !== 2) {
            console.log(`Pago ${token} no fue exitoso. Estado: ${paymentStatus.status}`);
            return NextResponse.json({ status: 'ok', message: 'Pago no exitoso, no se procesa.' });
        }
        
        // 3. Extraer la información de la orden para saber qué usuario y plan actualizar
        // Formato esperado de commerceOrder: orden_{planId}_{userId}_{timestamp}
        const [_, planId, userId] = paymentStatus.commerceOrder.split('_');

        if (!planId || !userId) {
             console.error('commerceOrder no tiene el formato esperado:', paymentStatus.commerceOrder);
             return NextResponse.json({ status: 'error', message: 'Formato de orden inválido.' }, { status: 400 });
        }

        // 4. Actualizar la base de datos en Firestore
        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error(`Usuario con ID ${userId} no encontrado en Firestore.`);
            return NextResponse.json({ status: 'error', message: 'Usuario no encontrado.' }, { status: 404 });
        }
        
        // Calcular la nueva fecha de expiración
        const currentUserData = userDoc.data();
        let currentEndDate = new Date();
        // Si ya tiene una fecha, usamos esa como base para extender. Si no, usamos hoy.
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
