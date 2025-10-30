
// src/lib/calculos-finiquito.ts

/**
 * Interfaz que define la estructura de datos para los cálculos del finiquito.
 */
interface FiniquitoInput {
  ultimaRemuneracion: number;
  fechaInicio: Date;
  fechaTermino: Date;
  valorUF: number;
  requiereAviso: boolean;
  fueDadoAviso: boolean;
  diasVacacionesPendientesAnteriores: number;
  remuneracionBaseVacaciones: number;
}

/**
 * Calcula la indemnización por años de servicio.
 * @param ultimaRemuneracion - Última remuneración mensual del trabajador.
 * @param fechaInicio - Fecha de inicio del contrato.
 * @param fechaTermino - Fecha de término del contrato.
 * @param valorUF - Valor de la UF del día del cálculo.
 * @returns Monto de la indemnización por años de servicio.
 */
export function calcularIndemnizacionAniosServicio(
  ultimaRemuneracion: number,
  fechaInicio: Date,
  fechaTermino: Date,
  valorUF: number
): number {
  const topeRemuneracion = 90 * valorUF;
  const baseCalculo = Math.min(ultimaRemuneracion, topeRemuneracion);

  let aniosServicio = (fechaTermino.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24 * 365.25);
  // Redondear al año superior si la fracción es 6 meses o más
  if (aniosServicio % 1 >= 0.5) {
    aniosServicio = Math.ceil(aniosServicio);
  } else {
    aniosServicio = Math.floor(aniosServicio);
  }

  const aniosAConsiderar = Math.min(aniosServicio, 11); // Tope de 11 años

  if (aniosAConsiderar <= 0) {
    return 0;
  }

  return Math.round(aniosAConsiderar * baseCalculo);
}

/**
 * Calcula la indemnización sustitutiva del aviso previo.
 * @param ultimaRemuneracion - Última remuneración mensual.
 * @param requiereAviso - Si la causal de término requiere aviso previo.
 * @param fueDadoAviso - Si el empleador dio el aviso con 30 días de anticipación.
 * @returns Monto de la indemnización por aviso previo.
 */
export function calcularIndemnizacionAvisoPrevio(
  ultimaRemuneracion: number,
  requiereAviso: boolean,
  fueDadoAviso: boolean
): number {
  if (requiereAviso && !fueDadoAviso) {
    return ultimaRemuneracion;
  }
  return 0;
}

/**
 * Calcula los días hábiles de feriado proporcional.
 * @param fechaInicio - Fecha de inicio del contrato.
 * @param fechaTermino - Fecha de término del contrato.
 * @param diasVacacionesPendientesAnteriores - Días de vacaciones ya acumulados.
 * @returns Número de días hábiles de feriado proporcional.
 */
export function calcularDiasFeriadoProporcional(
  fechaInicio: Date,
  fechaTermino: Date,
  diasVacacionesPendientesAnteriores: number
): number {
  const mesesCompletos = (fechaTermino.getFullYear() - fechaInicio.getFullYear()) * 12 + (fechaTermino.getMonth() - fechaInicio.getMonth());
  const diasDevengados = mesesCompletos * 1.25;
  return diasDevengados + diasVacacionesPendientesAnteriores;
}

/**
 * Valoriza los días de feriado proporcional en pesos.
 * @param diasProporcionales - Días hábiles de feriado.
 * @param remuneracionBase - Remuneración base para el cálculo.
 * @returns Valor en pesos del feriado proporcional.
 */
export function valorizarFeriadoProporcional(
  diasProporcionales: number,
  remuneracionBase: number
): number {
  if (diasProporcionales <= 0) {
    return 0;
  }
  // Se usa 30 como base estándar para el cálculo mensual
  const valorDia = remuneracionBase / 30;
  return Math.round(diasProporcionales * valorDia);
}

/**
 * Convierte un número a su representación en palabras en español.
 * @param numero - El número a convertir (solo la parte entera).
 * @returns El número en palabras, capitalizado y con la moneda.
 */
export function convertirNumeroAPalabras(numero: number): string {
    const entero = Math.floor(numero);

    if (entero === 0) {
        return 'Cero pesos';
    }

    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    function convertirMenorQueMil(n: number): string {
        if (n >= 100) {
            if (n === 100) return 'cien';
            const centena = Math.floor(n / 100);
            const resto = n % 100;
            return centenas[centena] + (resto > 0 ? ' ' + convertirMenorQueCien(resto) : '');
        }
        return convertirMenorQueCien(n);
    }

    function convertirMenorQueCien(n: number): string {
        if (n < 10) return unidades[n];
        if (n < 20) return especiales[n - 10];
        const decena = Math.floor(n / 10);
        const unidad = n % 10;
        if (unidad === 0) return decenas[decena];
        if (decena === 2) return 'veinti' + unidades[unidad];
        return decenas[decena] + ' y ' + unidades[unidad];
    }
    
    let resultado = [];
    
    const millones = Math.floor(entero / 1000000);
    let resto = entero % 1000000;
    
    if (millones > 0) {
        if (millones === 1) {
            resultado.push('un millón');
        } else {
            resultado.push(convertirMenorQueMil(millones) + ' millones');
        }
    }

    const miles = Math.floor(resto / 1000);
    resto %= 1000;

    if (miles > 0) {
        if (miles === 1) {
            resultado.push('mil');
        } else {
            resultado.push(convertirMenorQueMil(miles) + ' mil');
        }
    }

    if (resto > 0) {
        resultado.push(convertirMenorQueMil(resto));
    }
    
    let textoFinal = resultado.join(' ').replace('uno millones', 'un millón').replace('uno mil', 'un mil');
    
    if (textoFinal.endsWith('uno')) {
        textoFinal = textoFinal.slice(0, -1);
    }

    return (textoFinal.charAt(0).toUpperCase() + textoFinal.slice(1)) + ' pesos';
}


/**
 * Orquesta todos los cálculos del finiquito.
 * @param data - Objeto con todos los datos de entrada para el cálculo.
 * @returns Un objeto con el desglose de los montos y el total.
 */
export function calcularTotalFiniquito(data: FiniquitoInput): { totalNumerico: number; desglose: object } {
  const indemnizacionAniosServicio = calcularIndemnizacionAniosServicio(
    data.ultimaRemuneracion,
    data.fechaInicio,
    data.fechaTermino,
    data.valorUF
  );

  const indemnizacionAvisoPrevio = calcularIndemnizacionAvisoPrevio(
    data.ultimaRemuneracion,
    data.requiereAviso,
    data.fueDadoAviso
  );

  const diasFeriado = calcularDiasFeriadoProporcional(
    data.fechaInicio,
    data.fechaTermino,
    data.diasVacacionesPendientesAnteriores
  );

  const feriadoProporcional = valorizarFeriadoProporcional(
    diasFeriado,
    data.remuneracionBaseVacaciones
  );

  const totalNumerico = indemnizacionAniosServicio + indemnizacionAvisoPrevio + feriadoProporcional;

  const desglose = {
    indemnizacionAniosServicio,
    indemnizacionAvisoPrevio,
    feriadoProporcional,
    diasFeriado: diasFeriado.toFixed(2)
  };

  return { totalNumerico, desglose };
}
