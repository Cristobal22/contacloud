
export const finiquitoContratoTrabajoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">FINIQUITO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de {{ano_firma}}, entre <strong>{{razon_social_empresa}}</strong>, RUT N° {{rut_empresa}}, representada legalmente por don(ña) <strong>{{representante_legal_nombre}}</strong>, RUT N° {{representante_legal_rut}}, ambos domiciliados en {{direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(ña) <strong>{{nombre_trabajador}}</strong>, RUT N° {{rut_trabajador}}, domiciliado en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador", se deja constancia y se acuerda el siguiente finiquito:</p>
<br>
<p><strong>PRIMERO:</strong> El Trabajador prestó servicios al Empleador como <strong>{{cargo}}</strong>, desde el {{fecha_ingreso}} hasta el {{fecha_termino_contrato}}, fecha en que el contrato terminó por la causal: <strong>{{causal_termino}}</strong>.</p>
<br>
<p><strong>SEGUNDO:</strong> El Empleador paga al Trabajador los siguientes montos:</p>
<ul>
    <li><strong>A. Indemnización Sustitutiva del Aviso Previo:</strong> $ {{indemnizacion_sustitutiva}}</li>
    <li><strong>B. Indemnización por Años de Servicio:</strong> $ {{indemnizacion_anos_servicio}}</li>
    <li><strong>C. Feriado Legal o Proporcional:</strong> $ {{feriado_legal}}</li>
    <li><strong>TOTAL HABERES (A+B+C):</strong> $ {{total_haberes}}</li>
</ul>
<br>
<p><strong>TERCERO:</strong> El Empleador realiza los siguientes descuentos legales:</p>
<ul>
    <li><strong>D. Descuentos Previsionales:</strong> $ {{descuentos_previsionales}}</li>
    <li><strong>E. Descuentos de Salud:</strong> $ {{descuentos_salud}}</li>
    <li><strong>F. Otros Descuentos:</strong> $ {{otros_descuentos}}</li>
    <li><strong>TOTAL DESCUENTOS (D+E+F):</strong> $ {{total_descuentos}}</li>
</ul>
<br>
<p><strong>CUARTO:</strong> En consecuencia, el Trabajador recibe en este acto la suma de <strong>$ {{total_a_pagar}}</strong> ({{total_a_pagar_palabras}}), correspondiente al saldo final (TOTAL HABERES - TOTAL DESCUENTOS).</p>
<br>
<p><strong>QUINTO:</strong> El Trabajador declara recibir dicha suma a su entera satisfacción, otorgando el más completo y definitivo finiquito al Empleador, renunciando a cualquier acción o reclamo futuro.</p>
<br>
<p>Para constancia, firman las partes.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p><strong>{{representante_legal_nombre}}</strong></p>
        <p>RUT: {{representante_legal_rut}}</p>
        <p>EMPLEADOR</p>
    </div>
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_trabajador}}</strong></p>
        <p>RUT: {{rut_trabajador}}</p>
        <p>TRABAJADOR</p>
    </div>
</div>
`;
