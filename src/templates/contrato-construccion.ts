
export const contratoConstruccionTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO PARA OBRA O FAENA DETERMINADA (CONSTRUCCIÓN)</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, nacido el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se conviene el siguiente contrato por obra o faena:</p>
<br>
<p><strong>PRIMERO:</strong> El Trabajador se compromete a ejecutar la labor de <strong>{{cargo_faena}}</strong>, en la obra o faena denominada <strong>"{{nombre_obra_faena}}"</strong>, ubicada en {{direccion_obra_faena}}, comuna de {{comuna_obra_faena}}.</p>
<br>
<p><strong>SEGUNDO:</strong> Las labores específicas del trabajador consistirán en <strong>{{labores_especificas}}</strong> y otras tareas similares que se le encomienden relacionadas con la obra.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo será de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en horario de {{horario_entrada}} a {{horario_salida}} horas.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerará al trabajador con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}), más las gratificaciones legales que correspondan.</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato se pacta por la duración de la obra o faena específica individualizada en la cláusula primera, y terminará de pleno derecho cuando dicha obra o faena concluya.</p>
<br>
<p><strong>SEXTO:</strong> El trabajador se obliga a cumplir las normas de prevención de riesgos, salud y seguridad en el trabajo dispuestas por el empleador.</p>
<br>
<p>Para constancia, firman las partes en dos ejemplares.</p>
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
