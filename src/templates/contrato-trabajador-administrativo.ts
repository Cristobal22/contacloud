export const contratoTrabajadorAdministrativoTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato Individual de Trabajo (Administrativo)</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        .container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ccc; }
        h1, h2, h3 { text-align: center; }
        .section { margin-bottom: 20px; }
        .bold { font-weight: bold; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-around; }
        .signature { text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Contrato Individual de Trabajo (Administrativo)</h2>
        
        <h3>I. Comparecencia</h3>
        <p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de 20{{ano_firma}}, comparecen:</p>
        <p><span class="bold">A) El Empleador:</span></p>
        <ul>
            <li>Nombre o Razón Social: {{razon_social_empresa}}</li>
            <li>R.U.T. N°: {{rut_empresa}}</li>
            <li>Representado(a) Legalmente por Don(a): {{representante_legal_nombre}}</li>
            <li>R.U.N. N°: {{representante_legal_rut}}</li>
            <li>Domicilio Contractual: {{direccion_empresa}}, Comuna de {{comuna_empresa}}</li>
            <li>Correo Electrónico: {{email_empresa}}</li>
            <li>(En adelante, "El Empleador")</li>
        </ul>
        <p><span class="bold">B) El Trabajador/a:</span></p>
        <ul>
            <li>Nombre Completo: Don(a) {{nombre_trabajador}}</li>
            <li>R.U.N. N°: {{rut_trabajador}}</li>
            <li>Nacionalidad: {{nacionalidad_trabajador}}</li>
            <li>Fecha de Nacimiento: {{fecha_nacimiento_trabajador}}</li>
            <li>Domicilio Contractual: {{direccion_trabajador}}, Comuna de {{comuna_trabajador}}</li>
            <li>Correo Electrónico: {{email_trabajador}}</li>
            <li>(En adelante, "El Trabajador/a")</li>
        </ul>
        <p>Ambas partes declaran conocer sus identidades y acuerdan el siguiente Contrato Individual de Trabajo:</p>

        <h3>II. Cláusulas Contractuales</h3>
        <p><span class="bold">PRIMERO: Objeto, Funciones y Lugar de Trabajo.</span></p>
        <p>El/La Trabajador(a) se compromete y obliga a prestar servicios como {{cargo_trabajador}} u otro trabajo o función similar, que tenga directa relación con el cargo ya indicado, en el Departamento (Sección) {{departamento_seccion}}, ubicado en {{direccion_lugar_trabajo}}, comuna de {{comuna_lugar_trabajo}}.</p>
        <p>Sus principales funciones serán: {{funciones_principales}}.</p>
        <p>El/La Trabajador(a) podrá ser trasladado a otro Departamento o Sección de la Oficina Principal o de cualquiera de las Agencias del Empleador, a condición que se trate de labores similares, en la misma ciudad, y sin que ello importe menoscabo para el/la trabajador(a), todo ello sujeto a las necesidades operativas de la Empresa.</p>
        <p>Fecha de Ingreso al Servicio de la Empresa: {{fecha_ingreso}}.</p>

        <p><span class="bold">SEGUNDO: Jornada de Trabajo.</span></p>
        <p>La jornada semanal ordinaria de trabajo será de {{jornada_semanal_horas}} horas, de acuerdo a la siguiente distribución: lunes a {{jornada_dias}}, de {{jornada_horario}} horas.</p>
        <p>La jornada de trabajo será interrumpida con un descanso de {{descanso_minutos}} minutos, entre las {{horario_colacion}} horas, destinados a la colación. Este tiempo {{imputa_jornada_colacion}} a la jornada de trabajo, y será de cargo del {{cargo_colacion}}.</p>

        <p><span class="bold">TERCERO: Horas Extraordinarias.</span></p>
        <p>Cuando las necesidades de funcionamiento de la Empresa lo exijan, y sea necesario pactar trabajo en tiempo extraordinario, el/la trabajador(a) que lo acuerde se obligará a cumplir el horario que al efecto determine el/la Empleador, dentro de los límites legales. Dicho acuerdo deberá constar por escrito y se firmará por ambas partes, previamente a la realización del trabajo.</p>
        <p>El tiempo extraordinario trabajado se remunerará con el recargo legal correspondiente y se liquidará y pagará conjuntamente con la remuneración del respectivo período. Con todo, las partes podrán acordar por escrito que las horas extraordinarias se compensen por días adicionales de feriado.</p>
        <p>A falta de acuerdo, queda prohibido expresamente al/la trabajador(a) laborar sobretiempo o simplemente permanecer en el recinto de la Empresa, después de la hora diaria de salida, salvo en los casos que correspondan.</p>

        <p><span class="bold">CUARTO: Remuneración y Forma de Pago.</span></p>
        <p>El/La trabajador(a) percibirá un sueldo de $ {{sueldo_mensual_monto}} ({{sueldo_mensual_palabras}}) mensuales, pagaderos por meses vencidos.</p>
        <p>A solicitud del trabajador(a), el pago podrá realizarse por medio de cheque, o vale vista bancario a su nombre, o transferencia electrónica a la cuenta bancaria del trabajador, sin que ello importe costo alguno para él. El pago se efectuará mediante {{metodo_pago}} a la siguiente cuenta bancaria del trabajador/a:</p>
        <ul>
            <li>Banco: {{banco_trabajador}}</li>
            <li>Tipo y N° de Cuenta: {{cuenta_bancaria_trabajador}}</li>
            <li>RUT Titular: {{rut_trabajador}}</li>
            <li>Correo Electrónico (Para Liquidación): {{email_trabajador}}</li>
        </ul>
        <p>Las deducciones que el/la Empleador/a podrá practicar a las remuneraciones, son todas aquellas que dispone la ley. El/La trabajador(a), asimismo, acepta y autoriza al Empleador para que haga las deducciones que establecen las leyes vigentes y, para que le descuente el tiempo no trabajado debido a atrasos, inasistencias o permisos y, además, la rebaja del monto de las multas establecidas en el Reglamento Interno de Orden, Higiene y Seguridad, en caso que procedieren.</p>

        <p><span class="bold">QUINTO: Gratificación Convencional.</span></p>
        <p>El Empleador se obliga a pagar al/la trabajador(a) una gratificación anual equivalente al 25% (veinticinco por ciento) del total de las remuneraciones mensuales que éste hubiere percibido en el año, con tope de 4,75 Ingresos Mínimos Mensuales. Esta gratificación se calculará, liquidará y anticipará mensualmente en forma conjunta con la remuneración del mes respectivo, siendo cada abono equivalente a la doceava parte de la gratificación anual.</p>
        <p>La gratificación así convenida es incompatible y sustituye a la que resulte de la aplicación de las normas legales sobre gratificación.</p>

        <p><span class="bold">SEXTO: Ambiente Laboral, Obligaciones y Reglamento Interno.</span></p>
        <p>El/La Trabajador(a) se obliga y compromete expresamente a cumplir las instrucciones que le sean impartidas por su jefe inmediato o por la Gerencia de la empresa y acatar en todas sus partes las disposiciones establecidas en el Reglamento de Orden, Higiene y Seguridad, las que declara conocer y que, para estos efectos se consideran parte integrante del presente contrato, reglamento del cual el/la trabajador(a) recibe un ejemplar en este acto.</p>
        <p><span class="bold">Cláusula Específica:</span> Ambas partes se obligan a mantener un ambiente de trabajo libre de acoso sexual, acoso laboral y violencia en el trabajo. El Protocolo de Prevención e Investigación, establecido en el Reglamento Interno, se considera parte integrante de este contrato.</p>

        <p><span class="bold">SÉPTIMO: Beneficios Adicionales.</span></p>
        <p>El empleador se compromete a otorgar o suministrar a el/la trabajador(a) los siguientes beneficios:</p>
        <ul>
            <li>a) {{beneficio_a}}</li>
            <li>b) {{beneficio_b}}</li>
            <li>c) {{beneficio_c}}</li>
        </ul>

        <p><span class="bold">OCTAVO: Duración del Contrato.</span></p>
        <p>El presente contrato será de duración {{duracion_contrato}}. Cualquiera de las partes, o ambas, según el caso, podrán ponerle término en cualquier momento con arreglo a la ley.</p>
        <p>Se deja constancia que el/la trabajador(a) ingresó al servicio de la Empresa con fecha {{fecha_ingreso}}.</p>

        <p><span class="bold">NOVENO: Disposiciones Finales.</span></p>
        <p>El presente contrato se firma en dos ejemplares, quedando en este mismo acto uno en poder de cada contratante.</p>
        <p>El Empleador se obliga a mantener en el lugar de trabajo un ejemplar firmado de este contrato, asimismo, deberá registrar este contrato en el sitio web de la Dirección del Trabajo (www.direcciondeltrabajo.cl).</p>
        <p>Para todos los efectos legales derivados del presente contrato las partes fijan domicilio en la ciudad de {{ciudad_firma}} y se someten a la jurisdicción de sus Tribunales.</p>

        <div class="signature-section">
            <div class="signature">
                <p>__________________________</p>
                <p>FIRMA EMPLEADOR</p>
                <p>{{representante_legal_nombre}}</p>
                <p>R.U.T. {{rut_empresa}}</p>
            </div>
            <div class="signature">
                <p>__________________________</p>
                <p>FIRMA TRABAJADOR/A</p>
                <p>{{nombre_trabajador}}</p>
                <p>R.U.T. {{rut_trabajador}}</p>
            </div>
        </div>
    </div>
</body>
</html>
`;