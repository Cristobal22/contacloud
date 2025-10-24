
export const contratoCasaParticularPuertasAfueraTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO DE PERSONAL DE CASA PARTICULAR (PUERTAS AFUERA)</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{nombre_empleador}}</strong>, R.U.N. N° {{rut_empleador}}, con domicilio en {{direccion_empleador}}, comuna de {{comuna_empleador}}, en adelante el "Empleador"; y el/la trabajador(a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente contrato de trabajo:</p>
<br>
<p><strong>PRIMERO:</strong> El/La Trabajador(a) se compromete a efectuar las labores de personal de casa particular (puertas afuera), prestando servicios para el hogar del empleador, incluyendo aseo, cocina, y otras tareas domésticas según se requiera.</p>
<br>
<p><strong>SEGUNDO:</strong> El lugar de trabajo será el domicilio del empleador, ubicado en <strong>{{direccion_empleador}}, comuna de {{comuna_empleador}}</strong>. El/la trabajador(a) no residirá en el domicilio.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo será de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en horario de {{horario_entrada}} a {{horario_salida}} horas.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerará al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}).</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato es de duración <strong>{{duracion_contrato}}</strong>. Se deja constancia que el/la trabajador(a) ingresó al servicio con fecha {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_año}}.</p>
<br>
<p><strong>SEXTO:</strong> El empleador se compromete a efectuar las cotizaciones previsionales correspondientes en la AFP, Sistema de Salud y Seguro de Cesantía que elija el/la trabajador(a).</p>
<br>
<p>Para constancia, firman las partes en dos ejemplares.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_empleador}}</strong></p>
        <p>EMPLEADOR</p>
    </div>
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_trabajador}}</strong></p>
        <p>TRABAJADOR/A</p>
    </div>
</div>
`;
