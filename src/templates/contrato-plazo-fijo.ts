export const contratoPlazoFijoTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Trabajo a Plazo Fijo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
        }
        .container {
            max-width: 800px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ccc;
        }
        h1 {
            text-align: center;
        }
        .section {
            margin-bottom: 20px;
        }
        .text-center {
            text-align: center;
        }
        .bold {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="bold">CONTRATO DE TRABAJO A PLAZO FIJO</h1>

        <div class="section">
            <p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de {{ano_firma}}, entre {{razon_social_empresa}}, R.U.T. N° {{rut_empresa}}, representada legalmente por don(a) {{representante_legal_nombre}}, R.U.T. N° {{representante_legal_rut}}, ambos domiciliados para estos efectos en {{direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(a) {{nombre_trabajador}}, R.U.T. N° {{rut_trabajador}}, nacido(a) el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, domiciliado(a) en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente Contrato de Trabajo a Plazo Fijo:</p>
        </div>

        <div class="section">
            <p><span class="bold">PRIMERO.</span> El/La trabajador(a) se obliga a prestar servicios como {{cargo}} para el Empleador, desarrollando las funciones inherentes a dicho cargo.</p>
        </div>

        <div class="section">
            <p><span class="bold">SEGUNDO.</span> Los servicios se prestarán en las dependencias del Empleador ubicadas en {{lugar_prestacion_servicios}}, comuna de {{comuna_empresa}}.</p>
        </div>

        <div class="section">
            <p><span class="bold">TERCERO.</span> La jornada de trabajo será de {{jornada_trabajo_horas}} horas semanales, distribuidas de {{jornada_trabajo_dias_semana}}, en horario de {{horario_trabajo}} horas. El/la trabajador(a) tendrá un descanso de {{descanso_colacion}} minutos para colación.</p>
        </div>

        <div class="section">
            <p><span class="bold">CUARTO.</span> El Empleador remunerará al/la trabajador(a) con un sueldo mensual de <span class="bold">$ {{sueldo_base_monto}}</span> ({{sueldo_base_palabras}}), más una gratificación de <span class="bold">$ {{gratificacion_monto}}</span> ({{gratificacion_palabras}}).</p>
        </div>

        <div class="section">
            <p><span class="bold">QUINTO.</span> El presente contrato tendrá una duración de {{duracion_contrato}}, a contar del {{fecha_inicio}}. La relación laboral terminará al vencerse el plazo, sin necesidad de aviso previo ni formalidad alguna.</p>
        </div>

        <div class="section">
            <p><span class="bold">SEXTO.</span> Se deja constancia que el/la trabajador(a) ingresó al servicio con fecha {{fecha_ingreso}}.</p>
        </div>

        <div class="section">
            <p><span class="bold">SÉPTIMO.</span> El/la trabajador(a) se compromete y obliga a cumplir las normas del Reglamento Interno de Orden, Higiene y Seguridad de la empresa, y las órdenes e instrucciones impartidas por el Empleador o sus representantes.</p>
        </div>

        <div class="section">
            <p><span class="bold">OCTAVO.</span> Para todos los efectos legales del presente contrato, las partes fijan su domicilio en la ciudad de {{ciudad_firma}} y se someten a la jurisdicción de sus Tribunales.</p>
        </div>

        <div class="section">
            <p><span class="bold">NOVENO.</span> El presente contrato se firma en dos ejemplares de igual tenor y fecha, quedando uno en poder de cada parte.</p>
        </div>

        <br><br><br>

        <div class="section text-center">
            <p>__________________________<br>{{representante_legal_nombre}}<br>R.U.T.: {{representante_legal_rut}}<br><span class="bold">EMPLEADOR</span></p>
        </div>

        <br><br>

        <div class="section text-center">
            <p>__________________________<br>{{nombre_trabajador}}<br>R.U.T.: {{rut_trabajador}}<br><span class="bold">TRABAJADOR(A)</span></p>
        </div>
    </div>
</body>
</html>
`;