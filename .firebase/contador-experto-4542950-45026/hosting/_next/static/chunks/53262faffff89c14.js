(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,10667,e=>{"use strict";var a=e.i(43476),i=e.i(15288),t=e.i(19455),d=e.i(55764),l=e.i(10204),n=e.i(67489);e.i(11981);var r=e.i(80428),o=e.i(71645),s=e.i(39126),c=e.i(8406);function u(){let{selectedCompany:e}=o.default.useContext(s.SelectedCompanyContext)||{},u=e?.id,{toast:p}=(0,c.useToast)(),[m,h]=o.default.useState(""),[f,C]=o.default.useState(new Date().getFullYear().toString()),[x,g]=o.default.useState(!1),{data:j,loading:A}=(0,r.useCollection)({path:u?`companies/${u}/employees`:void 0,companyId:u}),{data:S,loading:v}=(0,r.useCollection)({path:`companies/${u}/payrolls`,companyId:u}),E=A||v;return(0,a.jsxs)(i.Card,{children:[(0,a.jsxs)(i.CardHeader,{children:[(0,a.jsx)(i.CardTitle,{children:"Certificado de Remuneraciones"}),(0,a.jsx)(i.CardDescription,{children:"Genera certificados de remuneraciones para los empleados."})]}),(0,a.jsx)(i.CardContent,{children:(0,a.jsxs)("div",{className:"grid gap-6 md:grid-cols-2 max-w-lg",children:[(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)(l.Label,{htmlFor:"employee",children:"Empleado"}),(0,a.jsxs)(n.Select,{value:m,onValueChange:h,disabled:!u||E||x,children:[(0,a.jsx)(n.SelectTrigger,{id:"employee",children:(0,a.jsx)(n.SelectValue,{placeholder:u?E?"Cargando...":"Selecciona un empleado":"Selecciona una empresa"})}),(0,a.jsxs)(n.SelectContent,{children:[j?.map(e=>(0,a.jsxs)(n.SelectItem,{value:e.id,children:[e.firstName," ",e.lastName]},e.id)),!E&&j?.length===0&&(0,a.jsx)(n.SelectItem,{value:"no-emp",disabled:!0,children:"No hay empleados"})]})]})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)(l.Label,{htmlFor:"year",children:"Año"}),(0,a.jsx)(d.Input,{id:"year",type:"number",placeholder:"Ej: 2023",value:f,onChange:e=>C(e.target.value),disabled:x})]}),(0,a.jsx)("div",{className:"md:col-span-2 flex justify-end",children:(0,a.jsx)(t.Button,{disabled:!u||E||x,onClick:()=>{if(g(!0),!m){p({variant:"destructive",title:"Error",description:"Por favor, selecciona un empleado."}),g(!1);return}let a=j?.find(e=>e.id===m),i=parseInt(f),t=S?.filter(e=>e.employeeId===m&&e.year===i);if(!a||!t||0===t.length){p({variant:"destructive",title:"Sin Datos",description:`No se encontraron liquidaciones para ${a?.firstName||"el empleado"} en el a\xf1o ${f}.`}),g(!1);return}let d=t.reduce((e,a)=>e+a.taxableEarnings,0),l=t.reduce((e,a)=>e+a.afpDiscount,0),n=t.reduce((e,a)=>e+a.healthDiscount,0),r=new Blob([`
CERTIFICADO DE REMUNERACIONES
----------------------------------

EMPRESA: ${e?.name||"No especificada"}
RUT EMPRESA: ${e?.rut||"No especificado"}

EMPLEADO: ${a.firstName} ${a.lastName}
RUT EMPLEADO: ${a.rut}

A\xd1O: ${f}
----------------------------------

Se certifica que el trabajador individualizado anteriormente ha percibido las siguientes remuneraciones y ha efectuado las siguientes cotizaciones previsionales durante el a\xf1o ${f}:

RENTA TOTAL IMPONIBLE: $${d.toLocaleString("es-CL")}
COTIZACI\xd3N AFP PAGADA: $${l.toLocaleString("es-CL")}
COTIZACI\xd3N SALUD PAGADA: $${n.toLocaleString("es-CL")}

Este certificado se extiende a petici\xf3n del interesado para los fines que estime convenientes.

Fecha de emisi\xf3n: ${new Date().toLocaleDateString("es-CL")}
`],{type:"text/plain;charset=utf-8"}),o=document.createElement("a"),s=URL.createObjectURL(r);o.setAttribute("href",s),o.setAttribute("download",`certificado_${a.rut}_${f}.txt`),document.body.appendChild(o),o.click(),document.body.removeChild(o),p({title:"Certificado Generado",description:"El certificado ha sido descargado."}),g(!1)},children:E?"Cargando...":x?"Generando...":"Generar Certificado"})})]})})]})}e.s(["default",()=>u])}]);