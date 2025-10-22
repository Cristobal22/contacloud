
import { NextResponse } from 'next/server';
import { plans } from '@/lib/plans';
import { adminAuth } from '@/firebase/admin';
import crypto from 'crypto';

// --- CONFIGURACIÓN DE FLOW ---
// <-- REEMPLAZA CON TU API KEY REAL
const FLOW_API_KEY = '7DED014F-BB5E-4362-A08B-1L9BBD532D53'; 
// <-- REEMPLAZA CON TU SECRET KEY REAL
const FLOW_SECRET_KEY = '68192639ec79397b7404b38198b1c918e6de1988';
// Cambia a true cuando estés listo para producción
const IS_PRODUCTION = false;
const FLOW_API_URL = IS_PRODUCTION 
    ? 'https://www.flow.cl/api' 
    : 'https://sandbox.flow.cl/api';

/**
 * Genera una firma HMAC-SHA256 para autenticar la solicitud a la API de Flow.
 */
function sign(params: Record<string, any>, secret: string): string {
  const sortedParams = Object.keys(params).sort();
  const toSign = sortedParams.map(key => `${key}${params[key]}`).join('');
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex');
}

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
    
    const user = await adminAuth.getUser(userId);
    if (!user.email) {
        return NextResponse.json({ error: 'El usuario no tiene un email registrado.' }, { status: 400 });
    }

    // Extraer el monto numérico del precio. Ejemplo: "$20.000" -> 20000
    const amount = parseInt(plan.price.replace(/[$.]/g, ''), 10);
    if (isNaN(amount)) {
        return NextResponse.json({ error: 'El precio del plan no es válido.' }, { status: 400 });
    }
    
    const commerceOrder = `orden_${planId}_${userId}_${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    const paymentParams: Record<string, any> = {
        apiKey: FLOW_API_KEY,
        commerceOrder: commerceOrder,
        subject: `Suscripción Plan ${plan.name}`,
        currency: 'CLP',
        amount: amount,
        email: user.email,
        urlConfirmation: `${baseUrl}/api/flow/webhook`,
        urlReturn: `${baseUrl}/dashboard/billing?status=success`,
    };

    // Añadir la firma a los parámetros
    paymentParams.s = sign(paymentParams, FLOW_SECRET_KEY);

    const response = await fetch(`${FLOW_API_URL}/payment/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(paymentParams),
    });
    
    const result = await response.json();

    if (result.code) { // Flow devuelve un 'code' en caso de error
      throw new Error(`Error de Flow: ${result.message}`);
    }
    
    const redirectUrl = `${result.url}?token=${result.token}`;

    return NextResponse.json({ redirectUrl });

  } catch (error: any) {
    console.error('Error al crear el pago en Flow:', error);
    // Devuelve un error JSON claro y detallado
    return NextResponse.json({ error: 'Error interno del servidor al procesar el pago.', details: error.message }, { status: 500 });
  }
}
