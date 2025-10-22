import { NextResponse } from 'next/server';
import { plans } from '@/lib/plans';
import { adminAuth } from '@/firebase/admin';
import { FLOW_API_KEY, FLOW_SECRET_KEY, FLOW_API_URL, sign } from '@/lib/flow';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { planId, userId, amount: testAmount } = await request.json();

    if (!planId || !userId) {
        return NextResponse.json({ error: 'Faltan parámetros: planId y userId son requeridos.' }, { status: 400 });
    }

    let amount: number;
    let subject: string;

    if (planId === 'test-payment' && testAmount) {
        amount = testAmount;
        subject = 'Pago de Prueba';
    } else {
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 });
        }
        
        // Corregido: Eliminar todos los caracteres no numéricos para una conversión segura.
        amount = parseInt(plan.price.replace(/\D/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'El precio del plan no es válido.' }, { status: 400 });
        }
        subject = `Suscripción Plan ${plan.name}`;
    }
    
    const user = await adminAuth.getUser(userId);
    if (!user.email) {
        return NextResponse.json({ error: 'El usuario no tiene un email registrado.' }, { status: 400 });
    }
    
    const commerceOrder = `orden_${planId}_${userId}_${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    const paymentParams: Record<string, any> = {
        apiKey: FLOW_API_KEY,
        commerceOrder: commerceOrder,
        subject: subject,
        currency: 'CLP',
        amount: amount,
        email: user.email,
        urlConfirmation: `${baseUrl}/api/flow/webhook`,
        urlReturn: `${baseUrl}/dashboard/billing?status=success`,
    };

    // Añadir la firma a los parámetros
    paymentParams.s = await sign(paymentParams, FLOW_SECRET_KEY);

    // Construir el cuerpo de la solicitud en formato x-www-form-urlencoded
    const bodyString = Object.keys(paymentParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paymentParams[key])}`)
        .join('&');
    
    const response = await fetch(`${FLOW_API_URL}/payment/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString,
    });
    
    const result = await response.json();

    if (!response.ok) {
      // Flow devuelve errores con un 'code' y 'message'
      throw new Error(result.message || 'Error de comunicación con Flow.');
    }
    
    const redirectUrl = `${result.url}?token=${result.token}`;

    return NextResponse.json({ redirectUrl });

  } catch (error: any) {
    console.error('Error al crear el pago en Flow:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el pago.', details: error.message }, { status: 500 });
  }
}
