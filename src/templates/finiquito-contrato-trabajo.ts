
export const finiquitoContratoTrabajoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">FINIQUITO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p>En la ciudad de {{ciudad}}, a {{dia}} días del mes de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada legalmente por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, ambos domiciliados en {{direccion_empresa}} N° {{numero_direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, domiciliado en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se deja constancia de lo siguiente:</p>
<br>
<p><strong>PRIMERO:</strong> El/La trabajador(a) declara haber prestado servicios al empleador en calidad de <strong>{{cargo}}</strong>, desde el {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_año}}, hasta el día {{fecha_termino_dia}} de {{fecha_termino_mes}} de {{fecha_termino_año}}, fecha esta última en que su contrato de trabajo ha terminado por la causal de <strong>{{causal_termino}}</strong>.</p>
<br>
<p><strong>SEGUNDO:</strong> El Empleador paga en este acto al/la trabajador(a) los siguientes conceptos:</p>
<ul>
    <li>Indemnización por años de servicio: <strong>$ {{indemnizacion_anos_servicio}}</strong></li>
    <li>Indemnización sustitutiva del aviso previo: <strong>$ {{indemnizacion_aviso_previo}}</strong></li>
    <li>Feriado legal y/o proporcional: <strong>$ {{feriado_proporcional}}</strong></li>
    <li><strong>Otros conceptos (si aplica):</strong> {{otros_conceptos}}</li>
</ul>
<p>Da un total a pagar de <strong>$ {{total_a_pagar}}</strong> ({{total_a_pagar_letras}}).</p>
<br>
<p><strong>TERCERO:</strong> El/La trabajador(a) declara recibir en este acto, a su entera y total satisfacción, la suma antes indicada, sin tener cargo, cobro, ni reclamo alguno que formular en contra del Empleador, por ningún concepto, ya sea por remuneraciones, cotizaciones previsionales, feriados, indemnizaciones o cualquier otra prestación derivada de la relación laboral que los vinculó.</p>
<br>
<p><strong>CUARTO:</strong> Las partes otorgan al presente finiquito, el más completo, total y definitivo poder liberatorio, declarando que no existen otras obligaciones pendientes y que la relación laboral se encuentra totalmente extinguida.</p>
<br>
<p>Para constancia, y en señal de conformidad, firman las partes en dos ejemplares de igual tenor y fecha.</p>
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
        <p>TRABAJADOR/A</p>
    </div>
</div>
`;
