// --- CONFIGURACIÓN DE FLOW ---
// Mueve aquí toda la configuración relacionada con Flow para centralizarla.

// <-- REEMPLAZA CON TU API KEY REAL
export const FLOW_API_KEY = '7DED014F-BB5E-4362-A08B-1L9BBD532D53'; 
// <-- REEMPLAZA CON TU SECRET KEY REAL
export const FLOW_SECRET_KEY = '68192639ec79397b7404b38198b1c918e6de1988';
// Cambia a true cuando estés listo para producción
const IS_PRODUCTION = false;
export const FLOW_API_URL = IS_PRODUCTION 
    ? 'https://www.flow.cl/api' 
    : 'https://sandbox.flow.cl/api';

/**
 * Genera una firma HMAC-SHA256 para autenticar la solicitud a la API de Flow.
 * Esta función sigue estrictamente la especificación de Flow.
 * @param params - Los parámetros de la petición (sin el parámetro 's').
 * @param secret - La SecretKey del comercio.
 * @returns La firma en formato hexadecimal.
 */
export async function sign(params: Record<string, any>, secret: string): Promise<string> {
  const crypto = (await import('crypto')).default;
  // 1. Ordenar los parámetros alfabéticamente por nombre de clave.
  const sortedKeys = Object.keys(params).sort();
  // 2. Concatenar los pares clave-valor en una sola cadena en el orden correcto.
  const toSign = sortedKeys.map(key => `${key}${params[key]}`).join('');
  // 3. Generar el hash HMAC-SHA256.
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex');
}
