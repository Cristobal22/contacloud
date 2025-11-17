(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,78631,(a,e,r)=>{!function(e,r){if("function"==typeof define&&define.amd){let e;void 0!==(e=r())&&a.v(e)}else r()}(a.e,function(){"use strict";function r(a,e,r){var o=new XMLHttpRequest;o.open("GET",a),o.responseType="blob",o.onload=function(){i(o.response,e,r)},o.onerror=function(){console.error("could not download file")},o.send()}function o(a){var e=new XMLHttpRequest;e.open("HEAD",a,!1);try{e.send()}catch(a){}return 200<=e.status&&299>=e.status}function n(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(r){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(e)}}var t="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:a.g.global===a.g?a.g:void 0,s=t.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),i=t.saveAs||("object"!=typeof window||window!==t?function(){}:"download"in HTMLAnchorElement.prototype&&!s?function(a,e,s){var i=t.URL||t.webkitURL,d=document.createElement("a");d.download=e=e||a.name||"download",d.rel="noopener","string"==typeof a?(d.href=a,d.origin===location.origin?n(d):o(d.href)?r(a,e,s):n(d,d.target="_blank")):(d.href=i.createObjectURL(a),setTimeout(function(){i.revokeObjectURL(d.href)},4e4),setTimeout(function(){n(d)},0))}:"msSaveOrOpenBlob"in navigator?function(a,e,t){if(e=e||a.name||"download","string"!=typeof a){var s;navigator.msSaveOrOpenBlob((void 0===(s=t)?s={autoBom:!1}:"object"!=typeof s&&(console.warn("Deprecated: Expected third argument to be a object"),s={autoBom:!s}),s.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a),e)}else if(o(a))r(a,e,t);else{var i=document.createElement("a");i.href=a,i.target="_blank",setTimeout(function(){n(i)})}}:function(a,e,o,n){if((n=n||open("","_blank"))&&(n.document.title=n.document.body.innerText="downloading..."),"string"==typeof a)return r(a,e,o);var i="application/octet-stream"===a.type,d=/constructor/i.test(t.HTMLElement)||t.safari,l=/CriOS\/[\d]+/.test(navigator.userAgent);if((l||i&&d||s)&&"undefined"!=typeof FileReader){var c=new FileReader;c.onloadend=function(){var a=c.result;a=l?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),n?n.location.href=a:location=a,n=null},c.readAsDataURL(a)}else{var p=t.URL||t.webkitURL,m=p.createObjectURL(a);n?n.location=m:location.href=m,n=null,setTimeout(function(){p.revokeObjectURL(m)},4e4)}});t.saveAs=i.saveAs=i,e.exports=i})},10472,a=>{"use strict";var e=a.i(43476),r=a.i(18566),o=a.i(83019);let n=`
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
            <li>Nombre o Raz\xf3n Social: {{razon_social_empresa}}</li>
            <li>R.U.T. N\xb0: {{rut_empresa}}</li>
            <li>Representado(a) Legalmente por Don(a): {{representante_legal_nombre}}</li>
            <li>R.U.N. N\xb0: {{representante_legal_rut}}</li>
            <li>Domicilio Contractual: {{direccion_empresa}}, Comuna de {{comuna_empresa}}</li>
            <li>Correo Electr\xf3nico: {{email_empresa}}</li>
            <li>(En adelante, "El Empleador")</li>
        </ul>
        <p><span class="bold">B) El Trabajador/a:</span></p>
        <ul>
            <li>Nombre Completo: Don(a) {{nombre_trabajador}}</li>
            <li>R.U.N. N\xb0: {{rut_trabajador}}</li>
            <li>Nacionalidad: {{nacionalidad_trabajador}}</li>
            <li>Fecha de Nacimiento: {{fecha_nacimiento_trabajador}}</li>
            <li>Domicilio Contractual: {{direccion_trabajador}}, Comuna de {{comuna_trabajador}}</li>
            <li>Correo Electr\xf3nico: {{email_trabajador}}</li>
            <li>(En adelante, "El Trabajador/a")</li>
        </ul>
        <p>Ambas partes declaran conocer sus identidades y acuerdan el siguiente Contrato Individual de Trabajo:</p>

        <h3>II. Cl\xe1usulas Contractuales</h3>
        <p><span class="bold">PRIMERO: Objeto, Funciones y Lugar de Trabajo.</span></p>
        <p>El/La Trabajador(a) se compromete y obliga a prestar servicios como {{cargo_trabajador}} u otro trabajo o funci\xf3n similar, que tenga directa relaci\xf3n con el cargo ya indicado, en el Departamento (Secci\xf3n) {{departamento_seccion}}, ubicado en {{direccion_lugar_trabajo}}, comuna de {{comuna_lugar_trabajo}}.</p>
        <p>Sus principales funciones ser\xe1n: {{funciones_principales}}.</p>
        <p>El/La Trabajador(a) podr\xe1 ser trasladado a otro Departamento o Secci\xf3n de la Oficina Principal o de cualquiera de las Agencias del Empleador, a condici\xf3n que se trate de labores similares, en la misma ciudad, y sin que ello importe menoscabo para el/la trabajador(a), todo ello sujeto a las necesidades operativas de la Empresa.</p>
        <p>Fecha de Ingreso al Servicio de la Empresa: {{fecha_ingreso}}.</p>

        <p><span class="bold">SEGUNDO: Jornada de Trabajo.</span></p>
        <p>La jornada semanal ordinaria de trabajo ser\xe1 de {{jornada_semanal_horas}} horas, de acuerdo a la siguiente distribuci\xf3n: lunes a {{jornada_dias}}, de {{jornada_horario}} horas.</p>
        <p>La jornada de trabajo ser\xe1 interrumpida con un descanso de {{descanso_minutos}} minutos, entre las {{horario_colacion}} horas, destinados a la colaci\xf3n. Este tiempo {{imputa_jornada_colacion}} a la jornada de trabajo, y ser\xe1 de cargo del {{cargo_colacion}}.</p>

        <p><span class="bold">TERCERO: Horas Extraordinarias.</span></p>
        <p>Cuando las necesidades de funcionamiento de la Empresa lo exijan, y sea necesario pactar trabajo en tiempo extraordinario, el/la trabajador(a) que lo acuerde se obligar\xe1 a cumplir el horario que al efecto determine el/la Empleador, dentro de los l\xedmites legales. Dicho acuerdo deber\xe1 constar por escrito y se firmar\xe1 por ambas partes, previamente a la realizaci\xf3n del trabajo.</p>
        <p>El tiempo extraordinario trabajado se remunerar\xe1 con el recargo legal correspondiente y se liquidar\xe1 y pagar\xe1 conjuntamente con la remuneraci\xf3n del respectivo per\xedodo. Con todo, las partes podr\xe1n acordar por escrito que las horas extraordinarias se compensen por d\xedas adicionales de feriado.</p>
        <p>A falta de acuerdo, queda prohibido expresamente al/la trabajador(a) laborar sobretiempo o simplemente permanecer en el recinto de la Empresa, despu\xe9s de la hora diaria de salida, salvo en los casos que correspondan.</p>

        <p><span class="bold">CUARTO: Remuneraci\xf3n y Forma de Pago.</span></p>
        <p>El/La trabajador(a) percibir\xe1 un sueldo de $ {{sueldo_mensual_monto}} ({{sueldo_mensual_palabras}}) mensuales, pagaderos por meses vencidos.</p>
        <p>A solicitud del trabajador(a), el pago podr\xe1 realizarse por medio de cheque, o vale vista bancario a su nombre, o transferencia electr\xf3nica a la cuenta bancaria del trabajador, sin que ello importe costo alguno para \xe9l. El pago se efectuar\xe1 mediante {{metodo_pago}} a la siguiente cuenta bancaria del trabajador/a:</p>
        <ul>
            <li>Banco: {{banco_trabajador}}</li>
            <li>Tipo y N\xb0 de Cuenta: {{cuenta_bancaria_trabajador}}</li>
            <li>RUT Titular: {{rut_trabajador}}</li>
            <li>Correo Electr\xf3nico (Para Liquidaci\xf3n): {{email_trabajador}}</li>
        </ul>
        <p>Las deducciones que el/la Empleador/a podr\xe1 practicar a las remuneraciones, son todas aquellas que dispone la ley. El/La trabajador(a), asimismo, acepta y autoriza al Empleador para que haga las deducciones que establecen las leyes vigentes y, para que le descuente el tiempo no trabajado debido a atrasos, inasistencias o permisos y, adem\xe1s, la rebaja del monto de las multas establecidas en el Reglamento Interno de Orden, Higiene y Seguridad, en caso que procedieren.</p>

        <p><span class="bold">QUINTO: Gratificaci\xf3n Convencional.</span></p>
        <p>El Empleador se obliga a pagar al/la trabajador(a) una gratificaci\xf3n anual equivalente al 25% (veinticinco por ciento) del total de las remuneraciones mensuales que \xe9ste hubiere percibido en el a\xf1o, con tope de 4,75 Ingresos M\xednimos Mensuales. Esta gratificaci\xf3n se calcular\xe1, liquidar\xe1 y anticipar\xe1 mensualmente en forma conjunta con la remuneraci\xf3n del mes respectivo, siendo cada abono equivalente a la doceava parte de la gratificaci\xf3n anual.</p>
        <p>La gratificaci\xf3n as\xed convenida es incompatible y sustituye a la que resulte de la aplicaci\xf3n de las normas legales sobre gratificaci\xf3n.</p>

        <p><span class="bold">SEXTO: Ambiente Laboral, Obligaciones y Reglamento Interno.</span></p>
        <p>El/La Trabajador(a) se obliga y compromete expresamente a cumplir las instrucciones que le sean impartidas por su jefe inmediato o por la Gerencia de la empresa y acatar en todas sus partes las disposiciones establecidas en el Reglamento de Orden, Higiene y Seguridad, las que declara conocer y que, para estos efectos se consideran parte integrante del presente contrato, reglamento del cual el/la trabajador(a) recibe un ejemplar en este acto.</p>
        <p><span class="bold">Cl\xe1usula Espec\xedfica:</span> Ambas partes se obligan a mantener un ambiente de trabajo libre de acoso sexual, acoso laboral y violencia en el trabajo. El Protocolo de Prevenci\xf3n e Investigaci\xf3n, establecido en el Reglamento Interno, se considera parte integrante de este contrato.</p>

        <p><span class="bold">S\xc9PTIMO: Beneficios Adicionales.</span></p>
        <p>El empleador se compromete a otorgar o suministrar a el/la trabajador(a) los siguientes beneficios:</p>
        <ul>
            <li>a) {{beneficio_a}}</li>
            <li>b) {{beneficio_b}}</li>
            <li>c) {{beneficio_c}}</li>
        </ul>

        <p><span class="bold">OCTAVO: Duraci\xf3n del Contrato.</span></p>
        <p>El presente contrato ser\xe1 de duraci\xf3n {{duracion_contrato}}. Cualquiera de las partes, o ambas, seg\xfan el caso, podr\xe1n ponerle t\xe9rmino en cualquier momento con arreglo a la ley.</p>
        <p>Se deja constancia que el/la trabajador(a) ingres\xf3 al servicio de la Empresa con fecha {{fecha_ingreso}}.</p>

        <p><span class="bold">NOVENO: Disposiciones Finales.</span></p>
        <p>El presente contrato se firma en dos ejemplares, quedando en este mismo acto uno en poder de cada contratante.</p>
        <p>El Empleador se obliga a mantener en el lugar de trabajo un ejemplar firmado de este contrato, asimismo, deber\xe1 registrar este contrato en el sitio web de la Direcci\xf3n del Trabajo (www.direcciondeltrabajo.cl).</p>
        <p>Para todos los efectos legales derivados del presente contrato las partes fijan domicilio en la ciudad de {{ciudad_firma}} y se someten a la jurisdicci\xf3n de sus Tribunales.</p>

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
`,t=`
<div class="text-center">
    <h3 class="font-bold text-lg">CARTA DE RENUNCIA VOLUNTARIA</h3>
</div>
<br>
<p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de {{ano_firma}}.</p>
<br>
<p>Se\xf1ores</p>
<p><strong>{{razon_social_empresa}}</strong></p>
<p><u>Presente</u></p>
<br>
<p>De mi consideraci\xf3n:</p>
<br>
<p>Por medio de la presente, yo, {{nombre_trabajador}}, R.U.N. N\xb0 {{rut_trabajador}}, actualmente desempe\xf1\xe1ndome en el cargo de {{cargo}}, comunico mi decisi\xf3n de renunciar voluntariamente a mi puesto de trabajo en la empresa.</p>
<br>
<p>Esta decisi\xf3n, de car\xe1cter irrevocable, se har\xe1 efectiva a contar del d\xeda {{fecha_ultimo_dia_dia}} de {{fecha_ultimo_dia_mes}} de {{fecha_ultimo_dia_ano}}, siendo este mi \xfaltimo d\xeda de trabajo.</p>
<br>
<p>Agradezco la oportunidad y la confianza depositada en m\xed durante mi tiempo en la empresa.</p>
<br>
<p>Sin otro particular, saluda atentamente,</p>
<br>
<br>
<div style="text-align: left;">
    <p>............................................</p>
    <p><strong>{{nombre_trabajador}}</strong></p>
    <p>RUT: {{rut_trabajador}}</p>
</div>
`,s=`
<div class="text-center">
    <h3 class="font-bold text-lg">FINIQUITO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de {{ano_firma}}, entre <strong>{{razon_social_empresa}}</strong>, RUT N\xb0 {{rut_empresa}}, representada legalmente por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, RUT N\xb0 {{representante_legal_rut}}, ambos domiciliados en {{direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(\xf1a) <strong>{{nombre_trabajador}}</strong>, RUT N\xb0 {{rut_trabajador}}, domiciliado en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador", se deja constancia y se acuerda el siguiente finiquito:</p>
<br>
<p><strong>PRIMERO:</strong> El Trabajador prest\xf3 servicios al Empleador como <strong>{{cargo}}</strong>, desde el {{fecha_ingreso}} hasta el {{fecha_termino_contrato}}, fecha en que el contrato termin\xf3 por la causal: <strong>{{causal_termino}}</strong>.</p>
<br>
<p><strong>SEGUNDO:</strong> El Empleador paga al Trabajador los siguientes montos:</p>
<ul>
    <li><strong>A. Indemnizaci\xf3n Sustitutiva del Aviso Previo:</strong> $ {{indemnizacion_sustitutiva}}</li>
    <li><strong>B. Indemnizaci\xf3n por A\xf1os de Servicio:</strong> $ {{indemnizacion_anos_servicio}}</li>
    <li><strong>C. Feriado Legal o Proporcional:</strong> $ {{feriado_legal}}</li>
    <li><strong>TOTAL HABERES (A+B+C):</strong> $ {{total_haberes}}</li>
</ul>
<br>
<p><strong>TERCERO:</strong> El Empleador realiza los siguientes descuentos legales:</p>
<ul>
    <li><strong>D. Descuentos Previsionales:</strong> $ {{descuentos_previsionales}}</li>
    <li><strong>E. Descuentos de Salud:</strong> $ {{descuentos_salud}}</li>
    <li><strong>F. Otros Descuentos:</strong> $ {{otros_descuentos}}</li>
    <li><strong>TOTAL DESCUENTOS (D+E+F):</strong> $ {{total_descuentos}}</li>
</ul>
<br>
<p><strong>CUARTO:</strong> En consecuencia, el Trabajador recibe en este acto la suma de <strong>$ {{total_a_pagar}}</strong> ({{total_a_pagar_palabras}}), correspondiente al saldo final (TOTAL HABERES - TOTAL DESCUENTOS).</p>
<br>
<p><strong>QUINTO:</strong> El Trabajador declara recibir dicha suma a su entera satisfacci\xf3n, otorgando el m\xe1s completo y definitivo finiquito al Empleador, renunciando a cualquier acci\xf3n o reclamo futuro.</p>
<br>
<p>Para constancia, firman las partes.</p>
<br>
<br>
<div style="display: flex; justify-content: space-around; text-align: center;">
    <div>
        <p>............................................</p>
        <p><strong>{{representante_legal_nombre}}</strong></p>
        <p>RUT: {{representante_legal_rut}}</p>
        <p>EMPLEADOR</p>
    </div>
    <div>
        <p>............................................</p>
        <p><strong>{{nombre_trabajador}}</strong></p>
        <p>RUT: {{rut_trabajador}}</p>
        <p>TRABAJADOR</p>
    </div>
</div>
`,i=`
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
            <p>En {{ciudad_firma}}, a {{dia_firma}} de {{mes_firma}} de {{ano_firma}}, entre {{razon_social_empresa}}, R.U.T. N\xb0 {{rut_empresa}}, representada legalmente por don(a) {{representante_legal_nombre}}, R.U.T. N\xb0 {{representante_legal_rut}}, ambos domiciliados para estos efectos en {{direccion_empresa}}, comuna de {{comuna_empresa}}, en adelante el "Empleador"; y don(a) {{nombre_trabajador}}, R.U.T. N\xb0 {{rut_trabajador}}, nacido(a) el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, domiciliado(a) en {{direccion_trabajador}}, comuna de {{comuna_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente Contrato de Trabajo a Plazo Fijo:</p>
        </div>

        <div class="section">
            <p><span class="bold">PRIMERO.</span> El/La trabajador(a) se obliga a prestar servicios como {{cargo}} para el Empleador, desarrollando las funciones inherentes a dicho cargo.</p>
        </div>

        <div class="section">
            <p><span class="bold">SEGUNDO.</span> Los servicios se prestar\xe1n en las dependencias del Empleador ubicadas en {{lugar_prestacion_servicios}}, comuna de {{comuna_empresa}}.</p>
        </div>

        <div class="section">
            <p><span class="bold">TERCERO.</span> La jornada de trabajo ser\xe1 de {{jornada_trabajo_horas}} horas semanales, distribuidas de {{jornada_trabajo_dias_semana}}, en horario de {{horario_trabajo}} horas. El/la trabajador(a) tendr\xe1 un descanso de {{descanso_colacion}} minutos para colaci\xf3n.</p>
        </div>

        <div class="section">
            <p><span class="bold">CUARTO.</span> El Empleador remunerar\xe1 al/la trabajador(a) con un sueldo mensual de <span class="bold">$ {{sueldo_base_monto}}</span> ({{sueldo_base_palabras}}), m\xe1s una gratificaci\xf3n de <span class="bold">$ {{gratificacion_monto}}</span> ({{gratificacion_palabras}}).</p>
        </div>

        <div class="section">
            <p><span class="bold">QUINTO.</span> El presente contrato tendr\xe1 una duraci\xf3n de {{duracion_contrato}}, a contar del {{fecha_inicio}}. La relaci\xf3n laboral terminar\xe1 al vencerse el plazo, sin necesidad de aviso previo ni formalidad alguna.</p>
        </div>

        <div class="section">
            <p><span class="bold">SEXTO.</span> Se deja constancia que el/la trabajador(a) ingres\xf3 al servicio con fecha {{fecha_ingreso}}.</p>
        </div>

        <div class="section">
            <p><span class="bold">S\xc9PTIMO.</span> El/la trabajador(a) se compromete y obliga a cumplir las normas del Reglamento Interno de Orden, Higiene y Seguridad de la empresa, y las \xf3rdenes e instrucciones impartidas por el Empleador o sus representantes.</p>
        </div>

        <div class="section">
            <p><span class="bold">OCTAVO.</span> Para todos los efectos legales del presente contrato, las partes fijan su domicilio en la ciudad de {{ciudad_firma}} y se someten a la jurisdicci\xf3n de sus Tribunales.</p>
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
`,d=`
<div class="text-center">
    <h3 class="font-bold text-lg">AVISO DE T\xc9RMINO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p><strong>SANTIAGO, {{dia}} de {{mes}} de {{a\xf1o}}</strong></p>
<br>
<p><strong>SE\xd1OR(A):</strong></p>
<p><strong>{{nombre_trabajador}}</strong></p>
<p>RUT: {{rut_trabajador}}</p>
<p>DOMICILIO: {{direccion_trabajador}}, {{comuna_trabajador}}</p>
<br>
<p>De nuestra consideraci\xf3n:</p>
<br>
<p>Comunicamos a usted que la empresa, <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, ha resuelto poner t\xe9rmino a su contrato de trabajo, suscrito con fecha {{fecha_inicio_contrato_dia}} de {{fecha_inicio_contrato_mes}} de {{fecha_inicio_contrato_a\xf1o}}.</p>
<br>
<p>La terminaci\xf3n de su contrato se har\xe1 efectiva a contar del d\xeda <strong>{{fecha_termino_dia}} de {{fecha_termino_mes}} de {{fecha_termino_a\xf1o}}</strong>.</p>
<br>
<p>La causal legal que se invoca para esta terminaci\xf3n es <strong>{{causal_termino}}</strong>, del C\xf3digo del Trabajo.</p>
<br>
<p>Los hechos en que se funda esta causal son: <strong>{{hechos_fundamento}}</strong></p>
<br>
<p>Se deja constancia de que sus cotizaciones previsionales se encuentran al d\xeda y han sido \xedntegramente pagadas.</p>
<br>
<p>A la fecha de t\xe9rmino de su contrato, se le pagar\xe1n las remuneraciones y dem\xe1s prestaciones que correspondan. El correspondiente finiquito ser\xe1 puesto a su disposici\xf3n en las oficinas del empleador en la fecha de t\xe9rmino indicada.</p>
<br>
<p>Saluda atentamente a usted,</p>
<br>
<br>
<div style="text-align: left;">
    <p>............................................</p>
    <p><strong>{{representante_legal_nombre}}</strong></p>
    <p>RUT: {{representante_legal_rut}}</p>
    <p>Por <strong>{{razon_social_empresa}}</strong></p>
</div>
`,l=`
<div class="text-center">
    <h3 class="font-bold text-lg">CONVENIO DE PR\xc1CTICA PROFESIONAL</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, representada por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N\xb0 {{representante_legal_rut}}, en adelante la “Empresa”; y el estudiante don(\xf1a) <strong>{{nombre_estudiante}}</strong>, R.U.N. N\xb0 {{rut_estudiante}}, alumno(a) de la carrera de <strong>{{nombre_carrera}}</strong> de la instituci\xf3n <strong>{{nombre_institucion_educativa}}</strong>, en adelante el “Estudiante”, se ha acordado el siguiente convenio de pr\xe1ctica profesional:</p>
<br>
<p><strong>PRIMERO:</strong> La Empresa se compromete a permitir que el Estudiante realice su pr\xe1ctica profesional en sus dependencias, en el \xe1rea de <strong>{{area_departamento}}</strong>, con el objetivo de aplicar los conocimientos adquiridos en su formaci\xf3n acad\xe9mica.</p>
<br>
<p><strong>SEGUNDO:</strong> La pr\xe1ctica profesional se extender\xe1 por un total de <strong>{{total_horas_practica}}</strong> horas cronol\xf3gicas, comenzando el {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_a\xf1o}} y finalizando el {{fecha_termino_dia}} de {{fecha_termino_mes}} de {{fecha_termino_a\xf1o}}.</p>
<br>
<p><strong>TERCERO:</strong> El horario de la pr\xe1ctica ser\xe1 de {{horario_entrada}} a {{horario_salida}} horas, de {{dias_de_practica}}, con un descanso de {{tiempo_colacion_minutos}} minutos para colaci\xf3n.</p>
<br>
<p><strong>CUARTO:</strong> La Empresa asignar\xe1 al Estudiante una asignaci\xf3n de movilizaci\xf3n y colaci\xf3n de <strong>$ {{asignacion_mensual}}</strong> ({{asignacion_mensual_letras}}) mensuales.</p>
<br>
<p><strong>QUINTO:</strong> El Estudiante se compromete a cumplir con las normas internas de orden, higiene y seguridad de la Empresa, as\xed como a mantener la confidencialidad de la informaci\xf3n a la que tenga acceso.</p>
<br>
<p><strong>SEXTO:</strong> Este convenio no constituye un contrato de trabajo, por lo que no genera v\xednculo de subordinaci\xf3n ni dependencia laboral entre las partes, sino que se rige por el marco de la pr\xe1ctica profesional requerida por la instituci\xf3n educativa.</p>
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
`,c=`
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO PARA OBRA O FAENA DETERMINADA (CONSTRUCCI\xd3N)</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, representada por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N\xb0 {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador don(\xf1a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, nacido el {{fecha_nacimiento_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se conviene el siguiente contrato por obra o faena:</p>
<br>
<p><strong>PRIMERO:</strong> El Trabajador se compromete a ejecutar la labor de <strong>{{cargo_faena}}</strong>, en la obra o faena denominada <strong>"{{nombre_obra_faena}}"</strong>, ubicada en {{direccion_obra_faena}}, comuna de {{comuna_obra_faena}}.</p>
<br>
<p><strong>SEGUNDO:</strong> Las labores espec\xedficas del trabajador consistir\xe1n en <strong>{{labores_especificas}}</strong> y otras tareas similares que se le encomienden relacionadas con la obra.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo ser\xe1 de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en horario de {{horario_entrada}} a {{horario_salida}} horas.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerar\xe1 al trabajador con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}), m\xe1s las gratificaciones legales que correspondan.</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato se pacta por la duraci\xf3n de la obra o faena espec\xedfica individualizada en la cl\xe1usula primera, y terminar\xe1 de pleno derecho cuando dicha obra o faena concluya.</p>
<br>
<p><strong>SEXTO:</strong> El trabajador se obliga a cumplir las normas de prevenci\xf3n de riesgos, salud y seguridad en el trabajo dispuestas por el empleador.</p>
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
`,p=`
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO DE TEMPORADA</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, representada legalmente por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N\xb0 {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(\xf1a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente contrato de trabajo de temporada:</p>
<br>
<p><strong>PRIMERO:</strong> El/La Trabajador(a) se obliga a prestar servicios como <strong>{{cargo_temporada}}</strong>, para atender necesidades propias del giro de la empresa en la temporada de <strong>{{nombre_temporada}}</strong> (Ej: cosecha de uva, temporada de verano, etc.).</p>
<br>
<p><strong>SEGUNDO:</strong> Los servicios se prestar\xe1n en <strong>{{lugar_de_trabajo}}</strong>, comuna de {{comuna_lugar_de_trabajo}}.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo ser\xe1 de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en el horario que se le asigne, que no exceder\xe1 los l\xedmites legales.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerar\xe1 al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}), m\xe1s las asignaciones que correspondan.</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato regir\xe1 desde el {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_a\xf1o}} y su duraci\xf3n se extender\xe1 hasta la conclusi\xf3n de la temporada, la que se estima ocurrir\xe1 el <strong>{{fecha_termino_estimada_dia}} de {{fecha_termino_estimada_mes}} de {{fecha_termino_estimada_a\xf1o}}</strong>, fecha en que el contrato terminar\xe1 sin necesidad de aviso previo.</p>
<br>
<p><strong>SEXTO:</strong> Se deja constancia de que este contrato es de temporada, y que las labores del trabajador(a) son de car\xe1cter c\xedclico o peri\xf3dico y no continuas.</p>
<br>
<p>Para constancia y en se\xf1al de conformidad, las partes firman el presente contrato.</p>
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
`,m=`
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO DE PERSONAL DE CASA PARTICULAR (PUERTAS ADENTRO)</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{nombre_empleador}}</strong>, R.U.N. N\xb0 {{rut_empleador}}, con domicilio en {{direccion_empleador}}, comuna de {{comuna_empleador}}, en adelante el "Empleador"; y el/la trabajador(a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente contrato de trabajo:</p>
<br>
<p><strong>PRIMERO:</strong> El/La Trabajador(a) se compromete a efectuar las labores de personal de casa particular, prestando servicios de forma continua y exclusiva para el hogar del empleador, incluyendo aseo, cocina, cuidado de ni\xf1os y otras tareas dom\xe9sticas.</p>
<br>
<p><strong>SEGUNDO:</strong> El lugar de trabajo ser\xe1 el domicilio del empleador, ubicado en <strong>{{direccion_empleador}}, comuna de {{comuna_empleador}}</strong>, donde el/la trabajador(a) residir\xe1.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo no exceder\xe1 los l\xedmites legales y el/la trabajador(a) tendr\xe1 derecho a los descansos diarios y semanales que estipula la ley para el personal de casa particular puertas adentro. El descanso semanal ser\xe1 los d\xedas <strong>{{dias_descanso_semanal}}</strong>.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerar\xe1 al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}). Adicionalmente, el empleador proporcionar\xe1 habitaci\xf3n y alimentaci\xf3n, las cuales no ser\xe1n imputables al sueldo.</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato es de duraci\xf3n <strong>{{duracion_contrato}}</strong>. Se deja constancia que el/la trabajador(a) ingres\xf3 al servicio con fecha {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_a\xf1o}}.</p>
<br>
<p><strong>SEXTO:</strong> El empleador se compromete a efectuar las cotizaciones previsionales correspondientes en la AFP, Sistema de Salud y Seguro de Cesant\xeda que elija el/la trabajador(a).</p>
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
`,u=`
<div class="text-center">
    <h3 class="font-bold text-lg">CONTRATO DE TRABAJO DE PERSONAL DE CASA PARTICULAR (PUERTAS AFUERA)</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{nombre_empleador}}</strong>, R.U.N. N\xb0 {{rut_empleador}}, con domicilio en {{direccion_empleador}}, comuna de {{comuna_empleador}}, en adelante el "Empleador"; y el/la trabajador(a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, de nacionalidad {{nacionalidad_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente contrato de trabajo:</p>
<br>
<p><strong>PRIMERO:</strong> El/La Trabajador(a) se compromete a efectuar las labores de personal de casa particular (puertas afuera), prestando servicios para el hogar del empleador, incluyendo aseo, cocina, y otras tareas dom\xe9sticas seg\xfan se requiera.</p>
<br>
<p><strong>SEGUNDO:</strong> El lugar de trabajo ser\xe1 el domicilio del empleador, ubicado en <strong>{{direccion_empleador}}, comuna de {{comuna_empleador}}</strong>. El/la trabajador(a) no residir\xe1 en el domicilio.</p>
<br>
<p><strong>TERCERO:</strong> La jornada de trabajo ser\xe1 de <strong>{{jornada_semanal_horas}}</strong> horas semanales, distribuidas de {{dias_de_trabajo}}, en horario de {{horario_entrada}} a {{horario_salida}} horas.</p>
<br>
<p><strong>CUARTO:</strong> El Empleador remunerar\xe1 al/la trabajador(a) con un sueldo mensual de <strong>$ {{sueldo_base_pesos}}</strong> ({{sueldo_base_letras}}).</p>
<br>
<p><strong>QUINTO:</strong> El presente contrato es de duraci\xf3n <strong>{{duracion_contrato}}</strong>. Se deja constancia que el/la trabajador(a) ingres\xf3 al servicio con fecha {{fecha_inicio_dia}} de {{fecha_inicio_mes}} de {{fecha_inicio_a\xf1o}}.</p>
<br>
<p><strong>SEXTO:</strong> El empleador se compromete a efectuar las cotizaciones previsionales correspondientes en la AFP, Sistema de Salud y Seguro de Cesant\xeda que elija el/la trabajador(a).</p>
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
`,b=`
<div class="text-center">
    <h3 class="font-bold text-lg">ANEXO DE CONTRATO DE TRABAJO</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, representada por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N\xb0 {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(\xf1a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, en adelante el "Trabajador/a", se ha convenido el siguiente anexo al contrato de trabajo suscrito con fecha {{fecha_contrato_original_dia}} de {{fecha_contrato_original_mes}} de {{fecha_contrato_original_a\xf1o}}:</p>
<br>
<p><strong>PRIMERO:</strong> Las partes acuerdan modificar la cl\xe1usula <strong>{{clausula_a_modificar}}</strong> del contrato de trabajo, la cual quedar\xe1 redactada de la siguiente manera a contar de esta fecha:</p>
<br>
<p>"<strong>{{nueva_redaccion_clausula}}</strong>"</p>
<br>
<p><strong>SEGUNDO:</strong> Todas las dem\xe1s cl\xe1usulas del contrato de trabajo original que no se contradigan con el presente anexo permanecen plenamente vigentes.</p>
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
`,_=`
<div class="text-center">
    <h3 class="font-bold text-lg">PACTO DE HORAS EXTRAORDINARIAS</h3>
</div>
<br>
<p>En {{ciudad}}, a {{dia}} de {{mes}} de {{a\xf1o}}, entre <strong>{{razon_social_empresa}}</strong>, R.U.T. N\xb0 {{rut_empresa}}, representada por don(\xf1a) <strong>{{representante_legal_nombre}}</strong>, R.U.N. N\xb0 {{representante_legal_rut}}, en adelante el "Empleador"; y el trabajador(a) don(\xf1a) <strong>{{nombre_trabajador}}</strong>, R.U.N. N\xb0 {{rut_trabajador}}, en adelante el "Trabajador/a", se acuerda el siguiente pacto sobre trabajo extraordinario, complementario al contrato de trabajo de fecha {{fecha_contrato_original_dia}} de {{fecha_contrato_original_mes}} de {{fecha_contrato_original_a\xf1o}}.</p>
<br>
<p><strong>PRIMERO:</strong> Las partes acuerdan que, en caso de ser necesario para atender las necesidades de la empresa, el Trabajador/a se obliga a laborar hasta un m\xe1ximo de <strong>{{max_horas_extra_semanales}}</strong> horas extraordinarias por semana.</p>
<br>
<p><strong>SEGUNDO:</strong> Las horas extraordinarias ser\xe1n pagadas con el recargo legal del 50% sobre el sueldo convenido para la jornada ordinaria y ser\xe1n liquidadas y pagadas conjuntamente con la remuneraci\xf3n ordinaria del respectivo per\xedodo.</p>
<br>
<p><strong>TERCERO:</strong> El presente pacto tendr\xe1 una vigencia de <strong>{{vigencia_pacto_meses}}</strong> meses a contar de esta fecha, y se entender\xe1 renovado por per\xedodos iguales y sucesivos si ninguna de las partes manifestare a la otra su voluntad de no renovarlo, mediante comunicaci\xf3n escrita con 30 d\xedas de anticipaci\xf3n al vencimiento.</p>
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
`;var g=a.i(71645),f=a.i(55764),x=a.i(10204),j=a.i(19455),h=a.i(75254);let v=(0,h.default)("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]);var E=a.i(88511),T=a.i(37727);let R=(0,h.default)("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);var A=a.i(31278),y=a.i(27365);a.i(11981);var O=a.i(80428),N=a.i(61480),D=a.i(41899);a.i(36180);var C=a.i(17875),S=a.i(8406),w=a.i(67489),L=a.i(39126),U=a.i(29592);let I=(0,h.default)("Terminal",[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]]);var P=a.i(78631);let q=a=>{if(!a)return"";let e=a.getDate(),r=a.toLocaleString("es-CL",{month:"long"}),o=a.getFullYear();return`${e} de ${r} de ${o}`},M={"carta-renuncia-voluntaria":[{title:"I. Fecha y lugar",fields:[{id:"ciudad_firma",label:"Ciudad de Firma"},{id:"dia_firma",label:"Día de Firma"},{id:"mes_firma",label:"Mes de Firma"},{id:"ano_firma",label:"Año de Firma"}]},{title:"II. Detalles de la Renuncia",fields:[{id:"cargo",label:"Cargo actual del trabajador"},{id:"fecha_ultimo_dia_dia",label:"Día del último día de trabajo"},{id:"fecha_ultimo_dia_mes",label:"Mes del último día de trabajo"},{id:"fecha_ultimo_dia_ano",label:"Año del último día de trabajo"}]}],"finiquito-contrato-trabajo":[{title:"Detalles del Finiquito",fields:[{id:"causal_termino",label:"Causal de Término"},{id:"fecha_termino_contrato",label:"Fecha Término de Contrato"},{id:"indemnizacion_sustitutiva",label:"Indemnización Sustitutiva"},{id:"indemnizacion_anos_servicio",label:"Indemnización Años de Servicio"},{id:"feriado_legal",label:"Feriado Legal"},{id:"total_haberes",label:"Total Haberes"},{id:"descuentos_previsionales",label:"Descuentos Previsionales"},{id:"descuentos_salud",label:"Descuentos Salud"},{id:"otros_descuentos",label:"Otros Descuentos"},{id:"total_descuentos",label:"Total Descuentos"},{id:"total_a_pagar",label:"Total a Pagar"}]}],"contrato-plazo-fijo":[{title:"Datos del Contrato",fields:[{id:"ciudad_firma",label:"Ciudad de Firma"},{id:"dia_firma",label:"Día de Firma"},{id:"mes_firma",label:"Mes de Firma"},{id:"ano_firma",label:"Año de Firma"},{id:"cargo",label:"Cargo"},{id:"lugar_prestacion_servicios",label:"Lugar de Prestación de Servicios"},{id:"jornada_trabajo_horas",label:"Horas de Jornada"},{id:"jornada_trabajo_dias_semana",label:"Días de la Semana"},{id:"horario_trabajo",label:"Horario"},{id:"descanso_colacion",label:"Minutos de Colación"},{id:"sueldo_base_monto",label:"Sueldo Base"},{id:"sueldo_base_palabras",label:"Sueldo Base (Palabras)"},{id:"gratificacion_monto",label:"Gratificación"},{id:"gratificacion_palabras",label:"Gratificación (Palabras)"},{id:"duracion_contrato",label:"Duración del Contrato"},{id:"fecha_inicio",label:"Fecha de Inicio"},{id:"fecha_ingreso",label:"Fecha de Ingreso"}]}],"contrato-trabajador-administrativo":[{title:"I. Comparecencia",fields:[{id:"ciudad_firma",label:"Ciudad de Firma"},{id:"dia_firma",label:"Día de Firma"},{id:"mes_firma",label:"Mes de Firma"},{id:"ano_firma",label:"Año de Firma"},{id:"email_empresa",label:"Email de la Empresa"}]},{title:"II. Cláusulas Contractuales",fields:[{id:"cargo_trabajador",label:"Cargo Específico"},{id:"departamento_seccion",label:"Departamento o Sección"},{id:"direccion_lugar_trabajo",label:"Dirección Lugar de Trabajo"},{id:"comuna_lugar_trabajo",label:"Comuna Lugar de Trabajo"},{id:"funciones_principales",label:"Funciones Principales"},{id:"fecha_ingreso",label:"Fecha de Ingreso"},{id:"jornada_semanal_horas",label:"Jornada Semanal (Horas)"},{id:"jornada_dias",label:"Días de Trabajo (ej. Lunes a Viernes)"},{id:"jornada_horario",label:"Horario (ej. 09:00 a 18:00)"},{id:"descanso_minutos",label:"Minutos de Descanso para Colación"},{id:"horario_colacion",label:"Horario Colación (ej. 13:00 a 14:00)"},{id:"imputa_jornada_colacion",label:"Colación se imputa a jornada? (SI/NO)"},{id:"cargo_colacion",label:"Colación de cargo de (TRABAJADOR/EMPLEADOR)"},{id:"sueldo_mensual_monto",label:"Sueldo Mensual (CLP)"},{id:"sueldo_mensual_palabras",label:"Sueldo Mensual (Palabras)"},{id:"metodo_pago",label:"Método de Pago"},{id:"banco_trabajador",label:"Banco del Trabajador"},{id:"cuenta_bancaria_trabajador",label:"N° de Cuenta del Trabajador"},{id:"beneficio_a",label:"Beneficio Adicional A"},{id:"beneficio_b",label:"Beneficio Adicional B"},{id:"beneficio_c",label:"Beneficio Adicional C"},{id:"duracion_contrato",label:"Duración del Contrato"}]}]};function F(){let{slug:a}=(0,r.useParams)(),h=(0,r.useSearchParams)(),{toast:F}=(0,S.useToast)(),z=(0,N.useFirestore)(),B=(0,g.useContext)(L.SelectedCompanyContext),$=B?.selectedCompany,k=h.get("docId"),H=(0,g.useMemo)(()=>k&&z&&$?.id?(0,C.doc)(z,`companies/${$.id}/documents`,k):null,[k,z,$?.id]),{data:J,loading:G}=(0,D.useDoc)(H),{data:V,loading:X}=(0,O.useCollection)({path:$?`companies/${$.id}/employees`:void 0}),[Q,Y]=(0,g.useState)(""),[K,W]=(0,g.useState)(!1),[Z,aa]=(0,g.useState)(""),[ae,ar]=(0,g.useState)(k),[ao,an]=(0,g.useState)(!1),[at,as]=(0,g.useState)(!1),ai=(0,g.useRef)(null),ad=o.DOCUMENT_TEMPLATES.find(e=>e.slug===a),al=(0,g.useMemo)(()=>{switch(a){case"contrato-trabajador-administrativo":return n;case"carta-renuncia-voluntaria":return t;case"finiquito-contrato-trabajo":return s;case"contrato-plazo-fijo":return i;case"aviso-termino-contrato":return d;case"convenio-practica-profesional":return l;case"contrato-construccion":return c;case"contrato-temporada":return p;case"contrato-casa-particular-puertas-adentro":return m;case"contrato-casa-particular-puertas-afuera":return u;case"anexo-contrato-trabajo":return b;case"pacto-horas-extra":return _;default:return""}},[a]),ac=(0,g.useMemo)(()=>M[a]||[],[a]),ap=(0,g.useMemo)(()=>{let a={};return ac.forEach(e=>{e.fields.forEach(e=>{a[e.id]=""})}),a},[ac]),[am,au]=(0,g.useState)(ap);(0,g.useEffect)(()=>{J&&(au(J.formData),W(J.isCustomized),aa(J.htmlContent),J.employeeId&&Y(J.employeeId),k&&ar(k))},[J,k]),(0,g.useEffect)(()=>{k||(au(ap),aa(""),W(!1),Y(""),ar(null))},[k,ap,a]),(0,g.useEffect)(()=>{if(k||!$)return;let e={razon_social_empresa:$.name??"",rut_empresa:$.rut??"",representante_legal_nombre:$.legalRepresentativeName??"",representante_legal_rut:$.legalRepresentativeRut??"",direccion_empresa:$.address??"",comuna_empresa:$.commune??"",email_empresa:$.email??""};("contrato-casa-particular-puertas-adentro"===a||"contrato-casa-particular-puertas-afuera"===a)&&(e.nombre_empleador=$.legalRepresentativeName??"",e.rut_empleador=$.legalRepresentativeRut??"",e.direccion_empleador=$.address??"",e.comuna_empleador=$.commune??""),au(a=>({...a,...e}))},[$,k,a]),(0,g.useEffect)(()=>{if(k||!V)return;let a=V.find(a=>a.id===Q);if(a){let e=a.birthDate&&a.birthDate instanceof C.Timestamp?q(a.birthDate.toDate()):"",r=a.contractStartDate&&a.contractStartDate instanceof C.Timestamp?q(a.contractStartDate.toDate()):"",o=a.contractEndDate&&a.contractEndDate instanceof C.Timestamp?(a=>{if(!a)return"";let e=a.toDate(),r=e.getFullYear(),o=(e.getMonth()+1).toString().padStart(2,"0"),n=e.getDate().toString().padStart(2,"0");return`${r}-${o}-${n}`})(a.contractEndDate):"",n={nombre_trabajador:`${a.firstName} ${a.lastName}`,rut_trabajador:a.rut??"",nacionalidad_trabajador:a.nationality??"",fecha_nacimiento_trabajador:e,direccion_trabajador:a.address??"",comuna_trabajador:a.commune??"",email_trabajador:a.email??"",cargo:a.position??"",fecha_ingreso:r,fecha_termino_contrato:o,sueldo_base_monto:a.baseSalary?.toString()??"",afp:a.afp??"",sistema_salud:a.healthSystem??"",nombre_estudiante:`${a.firstName} ${a.lastName}`,rut_estudiante:a.rut??""};au(a=>({...a,...n}))}else{let a={nombre_trabajador:"",rut_trabajador:"",nacionalidad_trabajador:"",fecha_nacimiento_trabajador:"",direccion_trabajador:"",comuna_trabajador:"",email_trabajador:"",cargo:"",fecha_ingreso:"",fecha_termino_contrato:"",sueldo_base_monto:"",afp:"",sistema_salud:"",nombre_estudiante:"",rut_estudiante:""};au(e=>({...e,...a}))}},[Q,V,k]);let ab=(0,g.useMemo)(()=>{let a=al,e={...am};for(let r in e){let o=RegExp(`{{${r}}}`,"g");a=a.replace(o,e[r]||"")}return a.replace(/\{\{.*?\}\}/g,"")},[am,al]);(0,g.useEffect)(()=>{K&&ai.current&&ai.current.focus()},[K]);let a_=a=>{let{id:e,value:r}=a.target;au(a=>({...a,[e]:r}))},ag=async()=>{as(!0);let a=K?Z:ab;try{let e=await fetch("/api/generate-docx",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({htmlString:a})});if(!e.ok)throw Error(`Error: ${e.statusText}`);let r=await e.blob();(0,P.saveAs)(r,`${ad?.name||"document"}.docx`),F({title:"Descarga Iniciada",description:"El documento .docx se está descargando."})}catch(a){console.error("Error generating docx: ",a),F({title:"Error de Descarga",description:"No se pudo generar el archivo .docx.",variant:"destructive"})}finally{as(!1)}},af=async()=>{if(!$||!z)return;an(!0);let e={templateSlug:a,formData:am,isCustomized:K,htmlContent:K?Z:ab,lastSaved:(0,C.serverTimestamp)(),employeeId:Q};try{let a=ae||k;if(a){let r=(0,C.doc)(z,`companies/${$.id}/documents`,a);await (0,C.setDoc)(r,e,{merge:!0}),F({title:"Documento Actualizado",description:"Los cambios han sido guardados."})}else{let a=(0,C.collection)(z,`companies/${$.id}/documents`),r=await (0,C.addDoc)(a,e);ar(r.id),F({title:"Documento Guardado",description:"El nuevo documento ha sido creado."})}}catch(a){console.error("Error saving document: ",a),F({title:"Error al Guardar",description:"No se pudieron guardar los cambios.",variant:"destructive"})}finally{an(!1)}};return G?(0,e.jsxs)("div",{className:"flex h-screen w-full items-center justify-center",children:[(0,e.jsx)(A.Loader2,{className:"h-8 w-8 animate-spin text-muted-foreground"}),(0,e.jsx)("p",{className:"ml-2",children:"Cargando documento..."})]}):ad?al||G?(0,e.jsxs)("div",{className:"flex h-screen w-full flex-col md:flex-row overflow-hidden print:h-auto print:overflow-visible",children:[(0,e.jsx)("div",{id:"document-preview-container",className:`p-4 overflow-y-auto print:w-full print:p-0 print:overflow-visible ${K?"w-full":"w-full md:w-2/3"}`,children:(0,e.jsxs)("div",{className:"h-full rounded-lg border bg-background p-6 shadow-sm print:shadow-none print:border-none",children:[(0,e.jsxs)("div",{className:"flex items-center justify-between mb-4 print:hidden",children:[(0,e.jsxs)("h2",{className:"text-xl font-bold",children:[K?"Editando":"Vista Previa",": ",ad.name]}),(0,e.jsxs)("div",{className:"flex items-center gap-2",children:[K?(0,e.jsxs)(j.Button,{onClick:()=>{W(!1)},variant:"outline",size:"sm",children:[(0,e.jsx)(T.X,{className:"h-4 w-4 mr-2"}),"Volver al Formulario"]}):(0,e.jsxs)(j.Button,{onClick:()=>{aa(ab),W(!0)},variant:"outline",size:"sm",disabled:!$,children:[(0,e.jsx)(E.Edit,{className:"h-4 w-4 mr-2"}),"Personalizar"]}),(0,e.jsxs)(j.Button,{onClick:af,variant:"outline",size:"sm",disabled:!$||ao,children:[ao?(0,e.jsx)(A.Loader2,{className:"h-4 w-4 mr-2 animate-spin"}):(0,e.jsx)(R,{className:"h-4 w-4 mr-2"}),ae||k?"Actualizar":"Guardar"]}),(0,e.jsxs)(j.Button,{onClick:ag,variant:"outline",size:"sm",disabled:!$||at,children:[at?(0,e.jsx)(A.Loader2,{className:"h-4 w-4 mr-2 animate-spin"}):(0,e.jsx)(y.FileDown,{className:"h-4 w-4 mr-2"}),"Descargar .docx"]}),(0,e.jsxs)(j.Button,{onClick:()=>window.print(),variant:"default",size:"sm",disabled:!$,children:[(0,e.jsx)(v,{className:"h-4 w-4 mr-2"}),"Imprimir"]})]})]}),K&&(0,e.jsxs)(U.Alert,{className:"mb-4",children:[(0,e.jsx)(I,{className:"h-4 w-4"}),(0,e.jsx)(U.AlertTitle,{children:"Modo de Edición Libre"}),(0,e.jsx)(U.AlertDescription,{children:'Estás editando el documento directamente. Los cambios no se guardarán en el formulario. Para volver, haz clic en "Volver al Formulario".'})]}),(0,e.jsx)("div",{ref:ai,className:`prose prose-sm max-w-none ${K?"bg-slate-50 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-ring":""}`,contentEditable:K,onInput:K?a=>{aa(a.currentTarget.innerHTML)}:void 0,suppressContentEditableWarning:!0,dangerouslySetInnerHTML:{__html:K?Z:ab}})]})}),!K&&(0,e.jsx)("div",{className:"w-full md:w-1/3 border-l bg-slate-50 p-4 overflow-y-auto print:hidden",children:(0,e.jsxs)("div",{className:"h-full p-1 md:p-4",children:[(0,e.jsx)("h3",{className:"mb-4 text-lg font-semibold",children:"Completar Datos"}),(0,e.jsxs)("div",{className:"mb-6 p-4 border rounded-md bg-white",children:[(0,e.jsx)("h4",{className:"mb-3 font-medium text-base",children:"Cargar Datos"}),(0,e.jsxs)("div",{className:"grid w-full max-w-sm items-center gap-1.5",children:[(0,e.jsx)(x.Label,{htmlFor:"worker-select",children:"Seleccionar Persona"}),(0,e.jsxs)(w.Select,{onValueChange:Y,value:Q,disabled:!$||G,children:[(0,e.jsx)(w.SelectTrigger,{id:"worker-select",children:(0,e.jsx)(w.SelectValue,{placeholder:"Elige una persona..."})}),(0,e.jsxs)(w.SelectContent,{children:[X&&(0,e.jsx)(w.SelectItem,{disabled:!0,value:"loading",children:"Cargando..."}),V&&V.map(a=>(0,e.jsx)(w.SelectItem,{value:a.id,children:`${a.firstName} ${a.lastName}`},a.id)),(!V||0===V.length)&&!X&&(0,e.jsx)(w.SelectItem,{disabled:!0,value:"no-workers",children:"No hay personas en esta empresa."})]})]}),(0,e.jsx)("p",{className:"text-xs text-muted-foreground mt-2",children:"Los datos de la empresa y la persona se cargarán automáticamente."})]})]}),ac.map(a=>(0,e.jsxs)("div",{className:"mb-6",children:[(0,e.jsx)("h4",{className:"mb-3 font-medium text-base",children:a.title}),(0,e.jsx)("div",{className:"grid gap-4",children:a.fields.map(a=>(0,e.jsxs)("div",{className:"grid w-full max-w-sm items-center gap-1.5",children:[(0,e.jsx)(x.Label,{htmlFor:a.id,children:a.label}),(0,e.jsx)(f.Input,{id:a.id,value:am[a.id]||"",onChange:a_,placeholder:a.label,disabled:!$||G})]},a.id))})]},a.title))]})})]}):(0,e.jsx)("div",{className:"flex h-[calc(100vh-4rem)] w-full items-center justify-center",children:(0,e.jsxs)("div",{className:"text-center",children:[(0,e.jsx)("h2",{className:"text-xl font-bold",children:"Plantilla en Desarrollo"}),(0,e.jsxs)("p",{className:"text-muted-foreground",children:['La funcionalidad para "',ad.name,'" aún no ha sido implementada.']})]})}):(0,e.jsx)("div",{children:"Plantilla no encontrada"})}a.s(["default",()=>F],10472)}]);