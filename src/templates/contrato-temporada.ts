
export const contratoTemporadaTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO DE TEMPORADA</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada legalmente por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente contrato de trabajo de temporada:</p>
<br>
<p><strong>PRIMERO:</strong> El/La Trabajador(a) se obliga a prestar servicios como <strong>{{cargo_temporada}}</strong>, para atender necesidades propias del giro de la empresa en la temporada de <strong>{{nombre_temporada}}</strong> (Ej: cosecha de uva, temporada de verano, etc.).</p>
<br>
<p><strong>SEGUNDO:</strong> Los servicios se prestarán en <strong>{{lugar_de_trabajo}}</strong>, comuna de {{comuna_lugar_de_trabajo}}.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo será de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en el horario que se le asigne, que no excederá los límites legales.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerará al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}), más las asignaciones que correspondan.</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato regirá desde el {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_año}} y su duración se extenderá hasta la conclusión de la temporada, la que se estima ocurrirá el <strong>{{fecha_termino_estimada_dia}} de {{fecha_termino_estimada_mes}} de {{fecha_termino_estimada_año}}</strong>, fecha en que el contrato terminará sin necesidad de aviso previo.</p>
<br>
<p><strong>SEXTO:</strong> Se deja constancia de que este contrato es de temporada, y que las labores del trabajador(a) son de carácter cíclico o periódico y no continuas.</p>
<br>
<p>Para constancia y en señal de conformidad, las partes firman el presente contrato.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p><strong>{{representante_legal_nombre}}</strong></p>
        <p>EMPLEADOR</p>
    </div>
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_trabajador}}</strong></p>
        <p>TRABAJADOR/A</p>
    </div>
</div>
`;
