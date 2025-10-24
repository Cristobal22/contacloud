
export const pactoHorasExtraTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">PACTO DE HORAS EXTRAORDINARIAS</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, en adelante el "Trabajador/a", se acuerda el siguiente pacto sobre trabajo extraordinario, complementario al contrato de trabajo de fecha {{fecha_contrato_original_dia}} de {{fecha_contrato_original_mes}} de {{fecha_contrato_original_año}}.</p>
<br>
<p><strong>PRIMERO:</strong> Las partes acuerdan que, en caso de ser necesario para atender las necesidades de la empresa, el Trabajador/a se obliga a laborar hasta un máximo de <strong>{{max_horas_extra_semanales}}</strong> horas extraordinarias por semana.</p>
<br>
<p><strong>SEGUNDO:</strong> Las horas extraordinarias serán pagadas con el recargo legal del 50% sobre el sueldo convenido para la jornada ordinaria y serán liquidadas y pagadas conjuntamente con la remuneración ordinaria del respectivo período.</p>
<br>
<p><strong>TERCERO:</strong> El presente pacto tendrá una vigencia de <strong>{{vigencia_pacto_meses}}</strong> meses a contar de esta fecha, y se entenderá renovado por períodos iguales y sucesivos si ninguna de las partes manifestare a la otra su voluntad de no renovarlo, mediante comunicación escrita con 30 días de anticipación al vencimiento.</p>
<br>
<p><strong>CUARTO:</strong> En todo lo no modificado por el presente instrumento, se mantienen plenamente vigentes las estipulaciones del contrato de trabajo individual.</p>
<br>
<p>Las partes firman el presente pacto en dos ejemplares de igual contenido.</p>
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
