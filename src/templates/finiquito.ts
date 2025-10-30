
// src/templates/finiquito.ts

interface FiniquitoData {
  empleador_nombre: string;
  empleador_rut: string;
  empleador_domicilio: string;
  trabajador_nombre: string;
  trabajador_rut: string;
  trabajador_domicilio: string;
  trabajador_oficio: string;
  trabajador_fecha_inicio: string; // Formato "dd de mes de aaaa"
  trabajador_fecha_termino: string; // Formato "dd de mes de aaaa"
  trabajador_cargo: string;
  causal_articulo_y_nombre: string;
  causal_hechos_fundamento: string;
  monto_indemnizacion_anios_servicio: string; // Formato "1.234.567"
  monto_indemnizacion_aviso_previo: string; // Formato "1.234.567"
  dias_feriado_proporcional: string;
  monto_feriado_proporcional: string; // Formato "1.234.567"
  monto_remuneraciones_pendientes: string; // Formato "1.234.567"
  monto_otros_haberes: string; // Formato "1.234.567"
  monto_total_numerico: string; // Formato "1.234.567"
  monto_total_en_palabras: string;
  forma_pago: string; // ej: "Transferencia Electrónica"
  fecha_pago: string; // Formato "dd de mes de aaaa"
  fecha_documento_larga: string; // Formato "Ciudad, a dd de mes de aaaa"
  ministro_de_fe: string; // ej: "Notario Público"
}

export function generarTextoFiniquito(data: FiniquitoData): string {
  return `
FINIQUITO DE CONTRATO INDIVIDUAL DE TRABAJO

En ${data.fecha_documento_larga}, comparecen por una parte ${data.empleador_nombre}, Rol Único Tributario N° ${data.empleador_rut}, domiciliado en ${data.empleador_domicilio}, en adelante el "Empleador"; y por la otra parte, ${data.trabajador_nombre}, Rol Único Tributario N° ${data.trabajador_rut}, de profesión u oficio ${data.trabajador_oficio}, domiciliado en ${data.trabajador_domicilio}, en adelante el "Trabajador".

PRIMERO: Antecedentes de la Relación Laboral.
El Trabajador ingresó a prestar servicios bajo la dependencia y subordinación del Empleador con fecha ${data.trabajador_fecha_inicio}, para desempeñar las funciones de ${data.trabajador_cargo}, terminando su relación laboral el día ${data.trabajador_fecha_termino}.

SEGUNDO: Causal de Término del Contrato.
El contrato de trabajo ha terminado por la causal establecida en el ${data.causal_articulo_y_nombre} del Código del Trabajo, fundada en los siguientes hechos:
${data.causal_hechos_fundamento}

TERCERO: Haberes e Indemnizaciones.
El Empleador declara haber pagado al Trabajador y éste acepta, a su entera satisfacción, las siguientes sumas de dinero por los conceptos que se indican:

Concepto                                    Monto (CLP)
--------------------------------------------------------------------
Indemnización por Años de Servicio        $${data.monto_indemnizacion_anios_servicio}
Indemnización Sustitutiva del Aviso Previo  $${data.monto_indemnizacion_aviso_previo}
Feriado Anual Proporcional (${data.dias_feriado_proporcional} días)        $${data.monto_feriado_proporcional}
Remuneraciones pendientes                 $${data.monto_remuneraciones_pendientes}
Otros Haberes                             $${data.monto_otros_haberes}
--------------------------------------------------------------------
TOTAL A PAGAR                             **$${data.monto_total_numerico}**

El monto total ascendente a la suma de $${data.monto_total_numerico} pesos chilenos (${data.monto_total_en_palabras} pesos), será pagado mediante ${data.forma_pago} el día ${data.fecha_pago}.

CUARTO: Declaración de Finiquito.
El Trabajador declara por el presente instrumento que, con excepción de las sumas antes indicadas y pagadas, nada se le adeuda por concepto de remuneraciones, indemnizaciones, cotizaciones previsionales, feriado (vacaciones), ni por ningún otro concepto, ya sea legal o contractual, derivado de la relación laboral, por lo que otorga al Empleador el más amplio y completo finiquito.

Para constancia, se firma el presente finiquito en triplicado, ratificando ante ${data.ministro_de_fe} con fecha ${data.fecha_documento_larga}.



_________________________
${data.trabajador_nombre}
RUT: ${data.trabajador_rut}



_________________________
${data.empleador_nombre}
RUT: ${data.empleador_rut}
`;
}
