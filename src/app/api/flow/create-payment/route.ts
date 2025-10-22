
import { NextResponse } from 'next/server';
import Flow from 'flow-api-client';
import { plans } from '@/lib/plans';
import { auth } from 'firebase-admin';
import { adminApp } from '@/firebase/admin';

// Inicializa el SDK de Flow con tus credenciales desde las variables de entorno
const flow = new Flow({
    apiKey: process.env.FLOW_API_KEY || '',
    secret: process.env.FLOW_SECRET_KEY || '',
    // Cambia a true cuando estés listo para producción
    production: false, 
});

export async function POST(request: Request) {
  try {
    const { planId, userId } = await request.json();

    if (!planId || !userId) {
        return NextResponse.json({ error: 'Faltan parámetros: planId y userId son requeridos.' }, { status: 400 });
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
        return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 });
    }
    
    // Correct way to get user data in a server environment
    const user = await auth().getUser(userId);
    if (!user.email) {
        return NextResponse.json({ error: 'El usuario no tiene un email registrado.' }, { status: 400 });
    }

    // Extraer el monto numérico del precio. Ejemplo: "$20.000" -> 20000
    const amount = parseInt(plan.price.replace(/[$.]/g, ''), 10);
    if (isNaN(amount)) {
        return NextResponse.json({ error: 'El precio del plan no es válido.' }, { status: 400 });
    }
    
    const commerceOrder = `orden_${planId}_${userId}_${Date.now()}`;
    
    const paymentData = {
        commerceOrder: commerceOrder,
        subject: `Suscripción Plan ${plan.name}`,
        currency: 'CLP',
        amount: amount,
        email: user.email,
        urlConfirmation: `${process.env.NEXT_PUBLIC_BASE_URL}/api/flow/webhook`,
        urlReturn: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?status=success`,
    };

    const result = await flow.send('payment/create', paymentData);
    
    // La respuesta de Flow contiene una URL a la que debes redirigir al usuario
    const redirectUrl = `${result.url}?token=${result.token}`;

    return NextResponse.json({ redirectUrl });

  } catch (error: any) {
    console.error('Error al crear el pago en Flow:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el pago.', details: error.message }, { status: 500 });
  }
}
