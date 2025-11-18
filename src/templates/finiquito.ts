
// src/templates/finiquito.ts

// La interfaz de datos de entrada no cambia
export interface FiniquitoData {
  empleador_nombre: string;
  empleador_rut: string;
  empleador_domicilio: string;
  trabajador_nombre: string;
  trabajador_rut: string;
  trabajador_domicilio: string;
  trabajador_oficio: string;
  trabajador_cargo: string;
  trabajador_fecha_inicio: string;
  trabajador_fecha_termino: string;
  causal_articulo_y_nombre: string;
  causal_hechos_fundamento: string;
  monto_indemnizacion_anios_servicio: string;
  monto_indemnizacion_aviso_previo: string;
  dias_feriado_proporcional: string;
  monto_feriado_proporcional: string;
  monto_remuneraciones_pendientes: string;
  monto_otros_haberes: string;
  monto_total_haberes: string;
  monto_descuento_previsional: string;
  monto_otros_descuentos: string;
  monto_total_descuentos: string;
  monto_total_numerico: string;
  monto_total_en_palabras: string;
  forma_pago: string;
  fecha_pago: string;
  ciudadFirma: string; // Needed for comparecencia
  ministro_de_fe: string;
}

// La estructura de salida se ha simplificado. 
// El contenido principal ahora reside completamente en `clausulas`.
export interface FiniquitoContent {
  title: string;
  comparecencia: string;
  clausulas: { titulo: string; contenido: string; }[];
  liquidacion: {
    haberes: { label: string; value: string; }[];
    totalHaberes: string;
    descuentos: { label: string; value: string; }[];
    totalDescuentos: string;
    totalAPagar: {
      label: string;
      value: string;
    };
  };
  firmas: {
    trabajador: { nombre: string; rut: string; };
    empleador: { nombre: string; rut: string; };
  };
}

// Función mejorada para generar el objeto de contenido estructurado
export function generarContenidoFiniquito(data: FiniquitoData): FiniquitoContent {
  
  // Función interna para parsear valores monetarios de los strings
  const parseCurrency = (value: string) => parseFloat(value.replace(/[^\d,-]/g, '')) || 0;

  return {
    title: 'FINIQUITO DE CONTRATO DE TRABAJO',
    comparecencia: `En ${data.ciudadFirma}, a ${data.trabajador_fecha_termino}, comparecen: por una parte, **${data.empleador_nombre}**, RUT N° **${data.empleador_rut}**, ambos con domicilio en ${data.empleador_domicilio}, en adelante "el Empleador"; y por otra parte, **${data.trabajador_nombre}**, RUT N° **${data.trabajador_rut}**, con domicilio en ${data.trabajador_domicilio}, de profesión u oficio ${data.trabajador_oficio}, en adelante "el Trabajador"; quienes han convenido en el siguiente finiquito de contrato de trabajo:`,
    
    clausulas: [
      {
        titulo: 'PRIMERO: ANTECEDENTES DE LA RELACIÓN LABORAL',
        contenido: `El Trabajador declara haber prestado servicios personales bajo vínculo de subordinación y dependencia para el Empleador, desempeñando la función de ${data.trabajador_cargo}, desde el ${data.trabajador_fecha_inicio} y hasta el día ${data.trabajador_fecha_termino}, fecha en que se ha puesto término a la relación laboral.`
      },
      {
        titulo: 'SEGUNDO: CAUSAL DE TÉRMINO',
        contenido: `El contrato de trabajo ha terminado por la causal establecida en el ${data.causal_articulo_y_nombre} del Código del Trabajo, fundada en los siguientes hechos: ${data.causal_hechos_fundamento}.`
      },
      {
        titulo: 'TERCERO: LIQUIDACIÓN Y PAGO',
        contenido: `El Empleador y el Trabajador dejan constancia de que los haberes y descuentos que corresponden son los siguientes:`
      },
      {
        titulo: 'CUARTO: PAGO Y FINIQUITO TOTAL',
        contenido: `La suma líquida que el Empleador paga al Trabajador en este acto asciende a **$${data.monto_total_numerico} (${data.monto_total_en_palabras} pesos)**.\n\nEl pago se efectúa mediante ${data.forma_pago} con fecha ${data.fecha_pago}. El Trabajador declara recibir dicha suma a su entera y total satisfacción, otorgando el más amplio, completo y total finiquito por los servicios prestados, sin tener reclamo alguno que formular en contra del Empleador por concepto alguno derivado de la relación laboral o su terminación.`
      },
      {
        titulo: 'QUINTO: RATIFICACIÓN Y FIRMA',
        contenido: `Para constancia, y en señal de aceptación de todo lo obrado, las partes firman el presente finiquito en tres ejemplares de igual tenor y fecha, ratificándolo ante ${data.ministro_de_fe}.`
      }
    ],
    
    liquidacion: {
      haberes: [
        { label: 'Indemnización por Años de Servicio', value: `$ ${data.monto_indemnizacion_anios_servicio}` },
        { label: 'Indemnización Sustitutiva del Aviso Previo', value: `$ ${data.monto_indemnizacion_aviso_previo}` },
        { label: `Feriado Proporcional (${data.dias_feriado_proporcional} días)`, value: `$ ${data.monto_feriado_proporcional}` },
        { label: 'Remuneraciones Pendientes', value: `$ ${data.monto_remuneraciones_pendientes}` },
        { label: 'Otros Haberes', value: `$ ${data.monto_otros_haberes}` },
      ].filter(item => parseCurrency(item.value) > 0), // Oculta si el valor es 0
      
      totalHaberes: `$ ${data.monto_total_haberes}`,
      
      descuentos: [
        { label: 'Aporte Previsional sobre Indemnización', value: `$ ${data.monto_descuento_previsional}` },
        { label: 'Otros Descuentos', value: `$ ${data.monto_otros_descuentos}` },
      ].filter(item => parseCurrency(item.value) > 0), // Oculta si el valor es 0
      
      totalDescuentos: `$ ${data.monto_total_descuentos}`,
      
      totalAPagar: {
        label: 'TOTAL LÍQUIDO A PAGAR',
        value: `$ ${data.monto_total_numerico}`
      }
    },

    firmas: {
      trabajador: { nombre: data.trabajador_nombre, rut: data.trabajador_rut },
      empleador: { nombre: data.empleador_nombre, rut: data.empleador_rut },
    }
  };
}
