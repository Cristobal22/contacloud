
export const contratoPlazoFijoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">MODELO DE CONTRATO DE TRABAJO A PLAZO FIJO</h3>
</div>
<br>
<p>En la ciudad de {{ciudad}}, a {{dia}} días del mes de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada legalmente por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, con domicilio en {{direccion_empresa}} N° {{numero_direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, nacido el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, domiciliado en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente Contrato de Trabajo a Plazo Fijo:</p>
<br>
<p><strong>PRIMERO.</strong> El/La trabajador(a) se obliga a prestar servicios como <strong>{{cargo}}</strong> para el Empleador, desarrollando las funciones inherentes a dicho cargo.</p>
<br>
<p><strong>SEGUNDO.</strong> Los servicios se prestarán en las dependencias del Empleador ubicadas en {{lugar_de_trabajo}}, comuna de {{comuna_lugar_de_trabajo}}.</p>
<br>
<p><strong>TERCERO.</strong> La jornada de trabajo será de {{jornada_semanal_horas}} horas semanales, distribuidas de {{dias_de_trabajo}}, en horario de {{horario_entrada}} a {{horario_salida}} horas. El/la trabajador(a) tendrá un descanso de {{tiempo_colacion_minutos}} minutos para colación.</p>
<br>
<p><strong>CUARTO.</strong> El Empleador remunerará al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}).</p>
<br>
<p><strong>QUINTO.</strong> El presente contrato tendrá una duración de <strong>{{duracion_plazo_fijo}}</strong>, a contar del {{fecha_inicio_contrato_dia}} de {{fecha_inicio_contrato_mes}} de {{fecha_inicio_contrato_año}}. La relación laboral terminará al vencerse el plazo, sin necesidad de aviso previo ni formalidad alguna.</p>
<br>
<p><strong>SEXTO.</strong> Se deja constancia que el/la trabajador(a) ingresó al servicio con fecha {{fecha_inicio_contrato_dia}} de {{fecha_inicio_contrato_mes}} de {{fecha_inicio_contrato_año}}.</p>
<br>
<p>Para constancia, las partes firman el presente contrato en dos ejemplares.</p>
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
