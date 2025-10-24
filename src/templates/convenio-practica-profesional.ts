
export const convenioPracticaProfesionalTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">CONVENIO DE PRÁCTICA PROFESIONAL</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, en adelante la “Empresa”; y el estudiante don(ña) <strong>{{nombre_estudiante}}</strong>, R.U.N. N° {{rut_estudiante}}, alumno(a) de la carrera de <strong>{{nombre_carrera}}</strong> de la institución <strong>{{nombre_institucion_educativa}}</strong>, en adelante el “Estudiante”, se ha acordado el siguiente convenio de práctica profesional:</p>
<br>
<p><strong>PRIMERO:</strong> La Empresa se compromete a permitir que el Estudiante realice su práctica profesional en sus dependencias, en el área de <strong>{{area_departamento}}</strong>, con el objetivo de aplicar los conocimientos adquiridos en su formación académica.</p>
<br>
<p><strong>SEGUNDO:</strong> La práctica profesional se extenderá por un total de <strong>{{total_horas_practica}}</strong> horas cronológicas, comenzando el {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_año}} y finalizando el {{fecha_termino_dia}} de {{fecha_termino_mes}} de {{fecha_termino_año}}.</p>
<br>
<p><strong>TERCERO:</strong> El horario de la práctica será de {{horario_entrada}} a {{horario_salida}} horas, de {{dias_de_practica}}, con un descanso de {{tiempo_colacion_minutos}} minutos para colación.</p>
<br>
<p><strong>CUARTO:</strong> La Empresa asignará al Estudiante una asignación de movilización y colación de <strong>$ {{asignacion_mensual}}</strong> ({{asignacion_mensual_letras}}) mensuales.</p>
<br>
<p><strong>QUINTO:</strong> El Estudiante se compromete a cumplir con las normas internas de orden, higiene y seguridad de la Empresa, así como a mantener la confidencialidad de la información a la que tenga acceso.</p>
<br>
<p><strong>SEXTO:</strong> Este convenio no constituye un contrato de trabajo, por lo que no genera vínculo de subordinación ni dependencia laboral entre las partes, sino que se rige por el marco de la práctica profesional requerida por la institución educativa.</p>
<br>
<p>Para constancia, firman las partes en dos ejemplares.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p><strong>{{representante_legal_nombre}}</strong></p>
        <p>EMPRESA</p>
    </div>
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_estudiante}}</strong></p>
        <p>ESTUDIANTE</p>
    </div>
</div>
`;
