
export const avisoTerminoContratoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">AVISO DE TÉRMINO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p><strong>SANTIAGO, {{dia}} de {{mes}} de {{año}}</strong></p>
<br>
<p><strong>SEÑOR(A):</strong></p>
<p><strong>{{nombre_trabajador}}</strong></p>
<p>RUT: {{rut_trabajador}}</p>
<p>DOMICILIO: {{direccion_trabajador}}, {{comuna_trabajador}}</p>
<br>
<p>De nuestra consideración:</p>
<br>
<p>Comunicamos a usted que la empresa, <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, ha resuelto poner término a su contrato de trabajo, suscrito con fecha {{fecha_inicio_contrato_dia}} de {{fecha_inicio_contrato_mes}} de {{fecha_inicio_contrato_año}}.</p>
<br>
<p>La terminación de su contrato se hará efectiva a contar del día <strong>{{fecha_termino_dia}} de {{fecha_termino_mes}} de {{fecha_termino_año}}</strong>.</p>
<br>
<p>La causal legal que se invoca para esta terminación es <strong>{{causal_termino}}</strong>, del Código del Trabajo.</p>
<br>
<p>Los hechos en que se funda esta causal son: <strong>{{hechos_fundamento}}</strong></p>
<br>
<p>Se deja constancia de que sus cotizaciones previsionales se encuentran al día y han sido íntegramente pagadas.</p>
<br>
<p>A la fecha de término de su contrato, se le pagarán las remuneraciones y demás prestaciones que correspondan. El correspondiente finiquito será puesto a su disposición en las oficinas del empleador en la fecha de término indicada.</p>
<br>
<p>Saluda atentamente a usted,</p>
<br>
<br>
<div style="text-align: left;">
    <p>............................................</p>
    <p><strong>{{representante_legal_nombre}}</strong></p>
    <p>RUT: {{representante_legal_rut}}</p>
    <p>Por <strong>{{razon_social_empresa}}</strong></p>
</div>
`;
