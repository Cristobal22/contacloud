
export const anexoContratoTrabajoTemplate = `
<div class="text-center">
    <h3 class="font-bold text-lg">ANEXO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{año}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N° {{rut_empresa}}, representada por don(ña) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N° {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(ña) <strong>{{nombre_trabajador}}</strong>, R.U.N. N° {{rut_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente anexo al contrato de trabajo suscrito con fecha {{fecha_contrato_original_dia}} de {{fecha_contrato_original_mes}} de {{fecha_contrato_original_año}}:</p>
<br>
<p><strong>PRIMERO:</strong> Las partes acuerdan modificar la cláusula <strong>{{clausula_a_modificar}}</strong> del contrato de trabajo, la cual quedará redactada de la siguiente manera a contar de esta fecha:</p>
<br>
<p>"<strong>{{nueva_redaccion_clausula}}</strong>"</p>
<br>
<p><strong>SEGUNDO:</strong> Todas las demás cláusulas del contrato de trabajo original que no se contradigan con el presente anexo permanecen plenamente vigentes.</p>
<br>
<p><strong>TERCERO:</strong> El presente anexo se firma en dos ejemplares de igual tenor y data, quedando uno en poder de cada parte.</p>
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
