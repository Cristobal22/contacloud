
// src/lib/indicadoresService.ts

interface IndicadorResponse {
  serie: {
    valor: number;
  }[];
}

/**
 * Obtiene el valor más reciente de la Unidad de Fomento (UF) desde la API pública mindicador.cl.
 * @returns Una promesa que resuelve al valor numérico de la UF.
 */
export async function getValorUF(): Promise<number> {
  try {
    // Se usa un timestamp para evitar el caché en algunas plataformas de despliegue.
    const response = await fetch(`https://mindicador.cl/api/uf?t=${new Date().getTime()}`);
    
    if (!response.ok) {
      throw new Error(`Error al contactar la API de indicadores: ${response.statusText}`);
    }

    const data: IndicadorResponse = await response.json();

    if (data.serie && data.serie.length > 0) {
      return data.serie[0].valor;
    }

    throw new Error('La respuesta de la API no tuvo el formato esperado.');

  } catch (error) {
    console.error("Error al obtener el valor de la UF:", error);
    // En caso de que la API falle, devolvemos un valor por defecto para no bloquear la app,
    // pero en un escenario ideal, esto debería ser manejado de forma más robusta (ej. alertar al usuario).
    // Usamos un valor plausible para el año 2024.
    return 37500;
  }
}
