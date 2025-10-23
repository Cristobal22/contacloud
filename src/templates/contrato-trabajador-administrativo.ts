
export const contratoTrabajadorAdministrativoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">MODELO DE CONTRATO DE TRABAJO DE TRABAJADOR ADMINISTRATIVO</h3>
</div>
<br>
<p>En la ciudad de {{ciudad}}, a {{dia}} días del mes de {{mes}} de 20{{año}} entre {{razon_social_empresa}}, R.U.T. {{rut_empresa}}, representado(a) legalmente por don(ña) {{representante_legal_nombre}}, R.U.N. N° {{representante_legal_rut}}, ambos con domicilio para estos efectos en {{direccion_empresa}} N° {{numero_direccion_empresa}}, comuna de {{comuna_empresa}}, Región {{region_empresa}}, con dirección de correo electrónico {{email_empresa}}, en adelante el "Empleador" y don(ña) {{nombre_trabajador}}, R.U.N. N° {{rut_trabajador}}, nacido el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, domiciliado en {{direccion_trabajador}} N° {{numero_direccion_trabajador}}, comuna de {{comuna_trabajador}}, Región {{region_trabajador}}, proveniente de {{pais_origen_trabajador}}, con dirección de correo electrónico {{email_trabajador}}, en adelante el "Trabajador/a". Se ha convenido el siguiente Contrato Individual de Trabajo:</p>
<br>
<p><strong>PRIMERO.</strong> El/La trabajador(a) se compromete y obliga a prestar servicios como {{cargo}} u otro trabajo o función similar, que tenga directa relación con el cargo ya indicado, en el Departamento (Sección) {{departamento}}, ubicado en {{lugar_de_trabajo}}, comuna de {{comuna_lugar_de_trabajo}}, pudiendo ser trasladado a otro Departamento o Sección de la Oficina Principal o de cualquiera de las Agencias del Empleador, a condición que se trate de labores similares, en la misma ciudad, y sin que ello importe menoscabo para el/la trabajador(a), todo ello sujeto a las necesidades operativas de la Empresa.</p>
<br>
<p><strong>SEGUNDO.</strong> El/La trabajador(a) cumplirá una jornada semanal ordinaria será de {{jornada_semanal_horas}} horas (2) de acuerdo a la siguiente distribución: lunes a {{dias_de_trabajo}}, de {{horario_entrada}} a {{horario_salida}} horas. La jornada de trabajo será interrumpida con un descanso de {{tiempo_colacion_minutos}} minutos, entre las {{horario_inicio_colacion}} y las {{horario_fin_colacion}} horas, destinados a la colación, tiempo que será de cargo del {{costo_colacion}}.</p>
<br>
<p><strong>TERCERO.</strong> (...) El tiempo extraordinario trabajado (...) se remunerará con el recargo legal correspondiente (...)</p>
<br>
<p><strong>CUARTO.</strong> El/La trabajador(a) percibirá un sueldo de $ {{sueldo_base_pesos}} ({{sueldo_base_letras}}) mensuales, pagaderos por meses vencidos. El pago de la remuneración, se hará en dinero efectivo.</p>
<br>
<p><strong>QUINTO.</strong> – El/La trabajador(a), asimismo, acepta y autoriza al Empleador para que haga las deducciones que establecen las leyes vigentes (...)</p>
<br>
<p><strong>SEXTO.</strong> - La Empresa se obliga a pagar al/la trabajador(a) una gratificación anual equivalente al 25% (...)</p>
<br>
<p><strong>SÉPTIMO.</strong> - El empleador se compromete a otorgar o suministrar a el/la trabajador(a) los siguientes beneficios: <br> a) {{beneficio_a}} <br> b) {{beneficio_b}} <br> c) {{beneficio_c}}</p>
<br>
<p><strong>OCTAVO.</strong> - El presente contrato será de duración {{duracion_contrato}} pero cualquiera de las partes, o ambas, según el caso, podrán ponerle término en cualquier momento con arreglo a la ley.</p>
<br>
<p><strong>DECIMO.</strong> – Se deja constancia que el/la trabajador(a) ingresó al servicio de la Empresa con fecha {{fecha_inicio_contrato_dia}} de {{fecha_inicio_contrato_mes}} de 20{{fecha_inicio_contrato_año}}.</p>
<br>
<p><strong>DECIMO PRIMERO.</strong> - El presente contrato se firma en dos ejemplares, quedando en este mismo acto uno en poder de cada contratante. (...)</p>
<br>
<p><strong>DECIMO SEGUNDO.</strong> - Para todos los efectos legales derivados del presente contrato las partes fijan domicilio en la ciudad de {{ciudad_domicilio_legal}} y se someten a la jurisdicción de sus Tribunales.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p>FIRMA EMPLEADOR</p>
        <p>RUT {{rut_empresa}}</p>
    </div>
    <div>
        <p>............................................</p>
        <p>FIRMA TRABAJADOR/A</p>
        <p>RUT {{rut_trabajador}}</p>
    </div>
</div>
`;
