

import type { Account, AfpEntity, EconomicIndicator, FamilyAllowanceParameter, HealthEntity, TaxableCap, TaxParameter } from "./types";

export const initialChartOfAccounts: Omit<Account, 'id' | 'companyId' | 'balance'>[] = [
    // --- 1. ACTIVOS ---
    { code: "1", name: "ACTIVO", type: "Activo" },
    { code: "101", name: "ACTIVO CORRIENTE", type: "Activo" },
    { code: "10101", name: "EFECTIVO Y EQUIVALENTE", type: "Activo" },
    { code: "1010101", name: "CAJA", type: "Activo" },
    { code: "1010102", name: "BANCOS", type: "Activo" },
    { code: "10102", name: "OTROS ACT. FINANCIEROS CORR.", type: "Activo" },
    { code: "1010210", name: "DEPOSITO A PLAZO BANCOS", type: "Activo" },
    { code: "1010220", name: "FONDOS MUTUOS", type: "Activo" },
    { code: "10103", name: "OTROS ACT. NO FINANCIEROS COR.", type: "Activo" },
    { code: "1010310", name: "UTILES DE OFICINA", type: "Activo" },
    { code: "1010320", name: "MATERIALES DE OFICINA", type: "Activo" },
    { code: "1010350", name: "ANTICIPOS DE PROVEEDORES", type: "Activo" },
    { code: "1010351", name: "ANTICIPOS PUBLICIDAD", type: "Activo" },
    { code: "1010352", name: "ANTICIPOS DE HONORARIOS", type: "Activo" },
    { code: "1010353", name: "ANTICIPOS DE SUELDOS", type: "Activo" },
    { code: "1010370", name: "PRIMAS DE SEGURO", type: "Activo" },
    { code: "1010380", name: "RENTAS PAGADAS POR ANTICIPADO", type: "Activo" },
    { code: "10104", name: "DEUDORES COMER. Y OTRAS CXC", type: "Activo" },
    { code: "1010401", name: "CLIENTES", type: "Activo" },
    { code: "1010415", name: "HONORARIOS POR COBRAR", type: "Activo" },
    { code: "1010420", name: "ESTIMACION DEUDORES INCOBRABLE", type: "Activo" },
    { code: "1010430", name: "CHEQUES A FECHA", type: "Activo" },
    { code: "1010431", name: "LETRAS POR COBRAR", type: "Activo" },
    { code: "1010432", name: "PAGARES POR COBRAR", type: "Activo" },
    { code: "1010440", name: "OTROS DOCUMENTOS POR COBRAR", type: "Activo" },
    { code: "10105", name: "CXC ENTIDADES REL. CORRIENTES", type: "Activo" },
    { code: "1010501", name: "CXC EMP. RELACIONADAS", type: "Activo" },
    { code: "10106", name: "INVENTARIOS", type: "Activo" },
    { code: "1010610", name: "MATERIAS PRIMAS", type: "Activo" },
    { code: "1010611", name: "MATERIALES DIRECTOS", type: "Activo" },
    { code: "1010620", name: "PRODUCTOS EN PROCESO", type: "Activo" },
    { code: "1010621", name: "PRODUCTOS TERMINADOS", type: "Activo" },
    { code: "1010630", name: "MERCADERIAS NACIONALES", type: "Activo" },
    { code: "1010640", name: "IMPORTACIONES EN TRANSITO", type: "Activo" },
    { code: "1010690", name: "PROVISION MERCADERIA OBSOLETA", type: "Activo" },
    { code: "10107", name: "ACTIVOS BIOLOGICOS CORRIENTES", type: "Activo" },
    { code: "1010701", name: "ACTIVOS BIOLOGICOS CORRIENTES", type: "Activo" },
    { code: "10108", name: "ACTIVOS IMPUESTOS CORRIENTES", type: "Activo" },
    { code: "1010801", name: "PPM", type: "Activo" },
    { code: "1010802", name: "IVA CREDITO FISCAL", type: "Activo" },
    { code: "1010803", name: "IVA REMANENTE CREDITO FISCAL", type: "Activo" },
    { code: "1010804", name: "IMPUESTO ADICIONAL", type: "Activo" },
    { code: "1010805", name: "IMPUESTO ESPECIFICO", type: "Activo" },
    { code: "1010825", name: "RETENCION HONORARIO POR COBRAR", type: "Activo" },
    { code: "10109", name: "ACTIVOS NO CORR. X CLASIFICAR", type: "Activo" },
    { code: "1010910", name: "ACTIVO MANT. PARA VENTA", type: "Activo" },
    { code: "1010920", name: "ACTIVO MANT. PARA PROPIETARIOS", type: "Activo" },
    { code: "102", name: "ACTIVO NO CORRIENTE", type: "Activo" },
    { code: "10201", name: "OTROS ACTIVOS FINAN. NO CORR.", type: "Activo" },
    { code: "1020101", name: "OTROS FINANCIEROS NO CORR.", type: "Activo" },
    { code: "10202", name: "OTROS NO FINANCIEROS NO CORR.", type: "Activo" },
    { code: "1020201", name: "ARRIENDOS EN GARANTIA POR REC.", type: "Activo" },
    { code: "10203", name: "DERECHOS COBRAR NO CORRIENTES", type: "Activo" },
    { code: "1020301", name: "DEUDORES A LARGO PLAZO", type: "Activo" },
    { code: "10204", name: "CXC A ENTIDAD REL. NO CORR.", type: "Activo" },
    { code: "1020410", name: "CXC A EMPRESA RELACIONADA L.P", type: "Activo" },
    { code: "1020420", name: "DXC A EMPRESA RELACIONADA L.P", type: "Activo" },
    { code: "1020430", name: "OTROS DXC A EMP RELACIONADA LP", type: "Activo" },
    { code: "10205", name: "INV. CONTAB. METODO PARTIC", type: "Activo" },
    { code: "1020501", name: "INV. CONTAB. METODO PARTIC", type: "Activo" },
    { code: "10206", name: "ACTIVOS INTANGIBLES NO PLUSV.", type: "Activo" },
    { code: "1020601", name: "DERECHOS DE AUTOR", type: "Activo" },
    { code: "1020602", name: "MARCA REGISTRADA", type: "Activo" },
    { code: "1020603", name: "PATENTES", type: "Activo" },
    { code: "1020604", name: "SOFTWARE", type: "Activo" },
    { code: "1020605", name: "FRANQUICIAS", type: "Activo" },
    { code: "1020606", name: "GASTOS DE CONSTITUCION", type: "Activo" },
    { code: "10207", name: "PLUSVALIA", type: "Activo" },
    { code: "1020701", name: "PLUSVALIA", type: "Activo" },
    { code: "10208", name: "PROPIEDAD PLANTA Y EQUIPO", type: "Activo" },
    { code: "1020810", name: "MAQUINARIAS Y EQUIPOS", type: "Activo" },
    { code: "1020811", name: "DEP ACUM MAQUINARIAS Y EQUIPOS", type: "Activo" },
    { code: "1020820", name: "MUEBLES Y UTILES", type: "Activo" },
    { code: "1020821", name: "DEPR ACUM MUEBLES Y UTILES", type: "Activo" },
    { code: "1020824", name: "EQUIPOS COMPUTACIONALES", type: "Activo" },
    { code: "1020825", name: "DEP ACUM EQUIPOS COMPUTACIONAL", type: "Activo" },
    { code: "1020830", name: "INSTALACIONES", type: "Activo" },
    { code: "1020831", name: "DEPR ACUM INSTALACIONES", type: "Activo" },
    { code: "10209", name: "ACTIVOS BIOLOGICOS NO CORR.", type: "Activo" },
    { code: "1020901", name: "ACTIVOS BIOLOGICOS NO CORR.", type: "Activo" },
    { code: "10210", name: "PROPIEDAD DE INVERSION", type: "Activo" },
    { code: "1021001", name: "PROPIEDAD DE INVERSION", type: "Activo" },
    { code: "10211", name: "ACTIVOS POR IMPUESTOS DIFERIDO", type: "Activo" },
    { code: "1021101", name: "ACTIVOS POR IMPUESTOS DIFERIDO", type: "Activo" },
    // --- 2. PASIVOS ---
    { code: "2", name: "PASIVOS", type: "Pasivo" },
    { code: "201", name: "PASIVO CORRIENTE", type: "Pasivo" },
    { code: "20101", name: "OTROS PASIVOS FINAN. CORR.", type: "Pasivo" },
    { code: "2010101", name: "DEUDAS CON BANCOS CORTO PLAZO", type: "Pasivo" },
    { code: "2010102", name: "LINEA DE CREDITO BANCOS", type: "Pasivo" },
    { code: "2010120", name: "ACREEDORES POR LEASING", type: "Pasivo" },
    { code: "2010130", name: "OBLIGACIONES POR FACTORING", type: "Pasivo" },
    { code: "20102", name: "CXP COMERCIALES Y OTRAS CTAS", type: "Pasivo" },
    { code: "2010201", name: "PROVEEDORES", type: "Pasivo" },
    { code: "2010210", name: "CUENTAS POR PAGAR", type: "Pasivo" },
    { code: "2010211", name: "PPM por Pagar", type: "Pasivo" },
    { code: "2010215", name: "SUELDOS POR PAGAR", type: "Pasivo" },
    { code: "2010220", name: "HONORARIOS POR PAGAR", type: "Pasivo" },
    { code: "2010225", name: "IMPOSICIONES POR PAGAR", type: "Pasivo" },
    { code: "2010226", name: "APORTE PATRONAL AFP POR PAGAR", type: "Pasivo" },
    { code: "20104", name: "CXP ENTIDAD RELACIONADA CORR.", type: "Pasivo" },
    { code: "2010401", name: "CXP ENTIDAD RELACIONada CORR.", type: "Pasivo" },
    { code: "20105", name: "OTRAS PROVISIONES A C.P.", type: "Pasivo" },
    { code: "2010590", name: "PROVISIONES VARIAS", type: "Pasivo" },
    { code: "20109", name: "PASIVOS POR IMPUESTOS CORR.", type: "Pasivo" },
    { code: "2010910", name: "IMPUESTO UNICO TRABAJADORES", type: "Pasivo" },
    { code: "2010920", name: "IVA DEBITO FISCAL", type: "Pasivo" },
    { code: "2010925", name: "OTROS IMPUESTOS", type: "Pasivo" },
    { code: "2010930", name: "RETENCION IMPUESTO HONORARIOS", type: "Pasivo" },
    { code: "2010940", name: "RETENCION INGRESO HONORARIO", type: "Pasivo" },
    { code: "2010990", name: "PROVISION IMPUESTO A LA RENTA", type: "Pasivo" },
    { code: "20110", name: "PASIVOS CORR. BEN. EMPLEADOS", type: "Pasivo" },
    { code: "2011001", name: "PROVISION VACACIONES PERSONAL", type: "Pasivo" },
    { code: "20111", name: "OTROS PASIVOS NO FINANC. CORR.", type: "Pasivo" },
    { code: "2011101", name: "INGRESOS RECIBIDOS ADELANTADO", type: "Pasivo" },
    { code: "2011120", name: "ARRIENDOS RECIBIDOS GARANTIA", type: "Pasivo" },
    { code: "202", name: "PASIVO NO CORRIENTE", type: "Pasivo" },
    { code: "20201", name: "OTROS PASIVOS NO FINANC. CORR.", type: "Pasivo" },
    { code: "2020101", name: "DEUDAS CON BANCOS LARGO PLAZO", type: "Pasivo" },
    { code: "20202", name: "PASIVOS NO CORRIENTES", type: "Pasivo" },
    { code: "2020201", name: "ACREEDORES LEASING A L.P.", type: "Pasivo" },
    { code: "20203", name: "CXP ENTIDAD RELAC. NO CORR.", type: "Pasivo" },
    { code: "2020301", name: "CXP EMP. RELACIONADAS L.P.", type: "Pasivo" },
    { code: "2020302", name: "CXP SOCIOS A L.P.", type: "Pasivo" },
    { code: "20204", name: "OTRAS PROVISIONES A L.P.", type: "Pasivo" },
    { code: "20205", name: "PASIVOS IMPUESTOS DIFERIDOS", type: "Pasivo" },
    { code: "20206", name: "PROVISIONES NO CORR. BEN. EMP.", type: "Pasivo" },
    { code: "2020601", name: "PROVISION INDEM. AÑOS SERVICIO", type: "Pasivo" },
    { code: "20207", name: "OTROS PASIVOS NO FINAN NO CORR", type: "Pasivo" },
    // --- 3. PATRIMONIO ---
    { code: "3", name: "PATRIMONIO", type: "Patrimonio" },
    { code: "301", name: "CAPITAL EMITIDO", type: "Patrimonio" },
    { code: "30101", name: "CAPITAL SOCIAL", type: "Patrimonio" },
    { code: "30102", name: "CAPITAL PREFERENTE", type: "Patrimonio" },
    { code: "302", name: "GANANCIAS ACUMULADAS", type: "Patrimonio" },
    { code: "30201", name: "PERDIDAS ACUMULadas", type: "Patrimonio" },
    { code: "30202", name: "UTILIDADES ACUMULADAS", type: "Patrimonio" },
    { code: "30203", name: "PERDIDAS Y GANANCIAS EJERCICIO", type: "Patrimonio" },
    { code: "303", name: "CUENTAS CORRIENTES DE SOCIOS", type: "Patrimonio" },
    { code: "30301", name: "CTA CTE SOCIO 1", type: "Patrimonio" },
    { code: "30302", name: "CTA CTE SOCIO 2", type: "Patrimonio" },
    { code: "304", name: "ACCIONES PROPIAS EN CARTERA", type: "Patrimonio" },
    { code: "305", name: "OTRAS PARTICIP. PATRIMONIO", type: "Patrimonio" },
    { code: "306", name: "OTRAS RESERVAS", type: "Patrimonio" },
    { code: "30601", name: "REVALORIZACION CAPITAL PROPIO", type: "Patrimonio" },
    { code: "307", name: "PATRIMONIO DUEÑOS CONTROLADORA", type: "Patrimonio" },
    { code: "308", name: "PARTICIPACIONES NO CONTROLADOR", type: "Patrimonio" },
    // --- 4. RESULTADO ---
    { code: "4", name: "RESULTADO", type: "Resultado" },
    { code: "401", name: "ESTADO DE RESULTADOS", type: "Resultado" },
    { code: "40101", name: "INGRESOS ACTIVIDAD ORDINARIAS", type: "Resultado" },
    { code: "4010110", name: "VENTAS Y SERVICIOS AFECTOS", type: "Resultado" },
    { code: "4010120", name: "VENTAS Y SERVICIOS EXENTOS", type: "Resultado" },
    { code: "4010130", name: "EXPORTACIONES", type: "Resultado" },
    { code: "40102", name: "COSTO DE VENTAS", type: "Resultado" },
    { code: "4010210", name: "COSTO VENTAS AFECTAS", type: "Resultado" },
    { code: "4010220", name: "COSTO VENTAS EXENTAS", type: "Resultado" },
    { code: "4010230", name: "COSTO EXPORTACIONES", type: "Resultado" },
    { code: "4010250", name: "COSTOS DE COMISION EN VENTAS", type: "Resultado" },
    { code: "40105", name: "UTILIDAD BRUTA", type: "Resultado" },
    { code: "40106", name: "OTROS INGRESOS, POR FUNCION", type: "Resultado" },
    { code: "4010601", name: "OTROS INGRESOS, POR FUNCION", type: "Resultado" },
    { code: "40107", name: "COSTOS DE DISTRIBUCION", type: "Resultado" },
    { code: "4010701", name: "MOVILIZACION", type: "Resultado" },
    { code: "40108", name: "GASTOS DE ADMINISTRACION", type: "Resultado" },
    { code: "4010810", name: "GASTOS DE SUELDOS Y SALARIOS", type: "Resultado" },
    { code: "4010811", name: "GASTO APORTE PATRONAL AFP", type: "Resultado" },
    { code: "4010812", name: "GASTOS DE FONASA E ISAPRE", type: "Resultado" },
    { code: "4010813", name: "GASTOS DE AFC EMPLEADOR", type: "Resultado" },
    { code: "4010814", name: "GASTOS DE SEGURO DE INVALIDEZ", type: "Resultado" },
    { code: "4010815", name: "GASTOS DE SEGURO ACCIDENTE", type: "Resultado" },
    { code: "4010816", name: "GASTOS DE MOVILIZACION", type: "Resultado" },
    { code: "4010817", name: "GASTOS DE COLACION", type: "Resultado" },
    { code: "4010818", name: "BONOS E OUTROS", type: "Resultado" },
    { code: "4010822", name: "HONORARIOS", type: "Resultado" },
    { code: "4010890", name: "GASTOS GENERALES", type: "Resultado" },
    { code: "40109", name: "GASTOS DE MANTENIMIENTO Y REP", type: "Resultado" },
    { code: "4010915", name: "GASTOS DE MANTENIMIENTOS Y REP", type: "Resultado" },
    { code: "4010916", name: "OTROS GASTOS, POR FUNCION", type: "Resultado" },
    { code: "4010917", name: "GASTOS DE MANTENIMIENTO Y REP", type: "Resultado" },
    { code: "40110", name: "OTRAS GANANCIAS (PERDIDAS)", type: "Resultado" },
    { code: "4011010", name: "OTRAS GANANCIAS", type: "Resultado" },
    { code: "4011020", name: "OTRAS PERDIDAS", type: "Resultado" },
    { code: "40120", name: "GANANCIAS (PERDIDAS) OP. CONT.", type: "Resultado" },
    { code: "40121", name: "INGRESOS FINANCIEROS", type: "Resultado" },
    { code: "4012110", name: "INTERESES GANADOS", type: "Resultado" },
    { code: "40122", name: "COSTOS FINANCIEROS", type: "Resultado" },
    { code: "4012210", name: "COSTOS FINANCIEROS", type: "Resultado" },
    { code: "40124", name: "DIFERENCIAS DE CAMBIO", type: "Resultado" },
    { code: "4012410", name: "DIFERENCIAS DE CAMBIO", type: "Resultado" },
    { code: "40125", name: "RESULTADOS UNIDADES REAJUSTE", type: "Resultado" },
    { code: "4012501", name: "REAJUSTE CREDITO IVA Y PPM", type: "Resultado" },
    { code: "4012570", name: "REAJUSTE ACTIVOS EN UF", type: "Resultado" },
    { code: "4012590", name: "REAJUSTE PASIVOS EN UF", type: "Resultado" },
    { code: "40190", name: "GANANCIAS (PERDIDAS) ANTES IMP", type: "Resultado" },
    { code: "40191", name: "GASTO POR IMPUESTO GANANCIAS", type: "Resultado" },
    { code: "4019101", name: "IMPUESTO A LA RENTA", type: "Resultado" },
    { code: "40192", name: "GANANCIAS (PERDIDAS) OP. CONT.", type: "Resultado" },
    { code: "40193", name: "GANANCIA OPE. DISCONTINUADAS", type: "Resultado" },
    { code: "4019301", name: "GANANCIAS OPE. DISCONTINUADAS", type: "Resultado" },
    { code: "4019320", name: "PERDIDAS OPE. DISCONTINUADAS", type: "Resultado" },
    { code: "40199", name: "UTILIDAD CONSOLIDADA", type: "Resultado" },
];

const afpData2024 = [
    { name: "CAPITAL", mandatoryContribution: 11.44, previredCode: "33", provisionalRegime: "DL 3.500", dtCode: "02", employerContribution: 1.41 },
    { name: "CUPRUM", mandatoryContribution: 11.44, previredCode: "03", provisionalRegime: "DL 3.500", dtCode: "03", employerContribution: 1.41 },
    { name: "HABITAT", mandatoryContribution: 11.27, previredCode: "05", provisionalRegime: "DL 3.500", dtCode: "04", employerContribution: 1.41 },
    { name: "MODELO", mandatoryContribution: 10.58, previredCode: "34", provisionalRegime: "DL 3.500", dtCode: "08", employerContribution: 1.41 },
    { name: "PLANVITAL", mandatoryContribution: 11.16, previredCode: "08", provisionalRegime: "DL 3.500", dtCode: "05", employerContribution: 1.41 },
    { name: "PROVIDA", mandatoryContribution: 11.45, previredCode: "09", provisionalRegime: "DL 3.500", dtCode: "06", employerContribution: 1.41 },
    { name: "UNO", mandatoryContribution: 10.69, previredCode: "35", provisionalRegime: "DL 3.500", dtCode: "09", employerContribution: 1.41 }
];
const healthData2024 = [
    { name: "FONASA", mandatoryContribution: 7.00, previredCode: "01", dtCode: "01" },
    { name: "CONSALUD", mandatoryContribution: 7.00, previredCode: "18", dtCode: "02" },
    { name: "CRUZBLANCA", mandatoryContribution: 7.00, previredCode: "07", dtCode: "03" },
    { name: "NUEVA MASVIDA", mandatoryContribution: 7.00, previredCode: "31", dtCode: "04" },
    { name: "BANMEDICA", mandatoryContribution: 7.00, previredCode: "04", dtCode: "05" },
    { name: "VIDA TRES", mandatoryContribution: 7.00, previredCode: "17", dtCode: "06" },
    { name: "COLMENA", mandatoryContribution: 7.00, previredCode: "02", dtCode: "07" },
];

const afpData2025_JanMar = afpData2024.map(afp => ({ ...afp, employerContribution: 1.38 }));
const afpData2025_JunDec = afpData2024.map(afp => ({ ...afp, employerContribution: 1.78 }));


export const initialAfpEntities: Omit<AfpEntity, 'id'>[] = [
    // 2023
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        afpData2024.map(afp => ({ ...afp, year: 2023, month }))
    ),
    // 2024
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        afpData2024.map(afp => ({ ...afp, year: 2024, month }))
    ),
     // 2025
    ...Array.from({ length: 3 }, (_, i) => i + 1).flatMap(month => 
        afpData2025_JanMar.map(afp => ({ ...afp, year: 2025, month }))
    ),
    ...Array.from({ length: 7 }, (_, i) => i + 6).flatMap(month => 
        afpData2025_JunDec.map(afp => ({ ...afp, year: 2025, month }))
    ),
];

export const initialHealthEntities: Omit<HealthEntity, 'id'>[] = [
    // 2023
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        healthData2024.map(health => ({ ...health, year: 2023, month }))
    ),
    // 2024
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        healthData2024.map(health => ({ ...health, year: 2024, month }))
    ),
     // 2025
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        healthData2024.map(health => ({ ...health, year: 2025, month }))
    ),
];

const familyAllowanceJanToApr2023 = [
    { tramo: "A", desde: 0, hasta: 429899, monto: 16828 },
    { tramo: "B", desde: 429900, hasta: 627913, monto: 10327 },
    { tramo: "C", desde: 627914, hasta: 979330, monto: 3264 },
    { tramo: "D", desde: 979331, hasta: Infinity, monto: 0 }
];
const familyAllowanceMayToAug2023 = [
    { tramo: "A", desde: 0, hasta: 429899, monto: 20328 },
    { tramo: "B", desde: 429900, hasta: 627913, monto: 12475 },
    { tramo: "C", desde: 627914, hasta: 979330, monto: 3942 },
    { tramo: "D", desde: 979331, hasta: Infinity, monto: 0 }
];
const familyAllowanceSep2023onwards = [
    { tramo: "A", desde: 0, hasta: 515879, monto: 20328 },
    { tramo: "B", desde: 515880, hasta: 753496, monto: 12475 },
    { tramo: "C", desde: 753497, hasta: 1175096, monto: 3942 },
    { tramo: "D", desde: 1175097, hasta: Infinity, monto: 0 }
];

const familyAllowance2024 = [
    { tramo: "A", desde: 0, hasta: 539699, monto: 20328 },
    { tramo: "B", desde: 539700, hasta: 788249, monto: 12475 },
    { tramo: "C", desde: 788250, hasta: 1228614, monto: 3942 },
    { tramo: "D", desde: 1228615, hasta: Infinity, monto: 0 }
];

const familyAllowance2025 = familyAllowance2024;

export const initialFamilyAllowanceParameters: Omit<FamilyAllowanceParameter, 'id'>[] = [
    // 2023
    ...Array.from({ length: 4 }, (_, i) => i + 1).flatMap(month => 
        familyAllowanceJanToApr2023.map(param => ({ ...param, year: 2023, month }))
    ),
    ...Array.from({ length: 4 }, (_, i) => i + 5).flatMap(month => 
        familyAllowanceMayToAug2023.map(param => ({ ...param, year: 2023, month }))
    ),
    ...Array.from({ length: 4 }, (_, i) => i + 9).flatMap(month => 
        familyAllowanceSep2023onwards.map(param => ({ ...param, year: 2023, month }))
    ),
    // 2024
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        familyAllowance2024.map(param => ({ ...param, year: 2024, month }))
    ),
     // 2025
    ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => 
        familyAllowance2025.map(param => ({ ...param, year: 2025, month }))
    ),
];

export const initialTaxParameters: Omit<TaxParameter, 'id' | 'year' | 'month'>[] = [
    { tramo: "Exento", desdeUTM: 0, hastaUTM: 13.5, factor: 0, rebajaUTM: 0 },
    { tramo: "Tramo 1", desdeUTM: 13.5, hastaUTM: 30, factor: 0.04, rebajaUTM: 0.54 },
    { tramo: "Tramo 2", desdeUTM: 30, hastaUTM: 50, factor: 0.08, rebajaUTM: 1.74 },
    { tramo: "Tramo 3", desdeUTM: 50, hastaUTM: 70, factor: 0.135, rebajaUTM: 4.49 },
    { tramo: "Tramo 4", desdeUTM: 70, hastaUTM: 90, factor: 0.23, rebajaUTM: 11.14 },
    { tramo: "Tramo 5", desdeUTM: 90, hastaUTM: 120, factor: 0.304, rebajaUTM: 17.80 },
    { tramo: "Tramo 6", desdeUTM: 120, hastaUTM: 310, factor: 0.35, rebajaUTM: 23.32 },
    { tramo: "Tramo 7", desdeUTM: 310, hastaUTM: Infinity, factor: 0.40, rebajaUTM: 38.82 },
];


export const initialEconomicIndicators: Omit<EconomicIndicator, 'id' | 'uta' | 'gratificationCap'>[] = [
    // 2023
    { year: 2023, month: 1, uf: 35111.96, utm: 61769, minWage: 410000 },
    { year: 2023, month: 2, uf: 35277.83, utm: 61955, minWage: 410000 },
    { year: 2023, month: 3, uf: 35499.78, utm: 62450, minWage: 410000 },
    { year: 2023, month: 4, uf: 35688.19, utm: 62746, minWage: 410000 },
    { year: 2023, month: 5, uf: 35836.56, utm: 63059, minWage: 440000 },
    { year: 2023, month: 6, uf: 35948.30, utm: 63199, minWage: 440000 },
    { year: 2023, month: 7, uf: 36041.51, utm: 63263, minWage: 440000 },
    { year: 2023, month: 8, uf: 36173.23, utm: 63452, minWage: 440000 },
    { year: 2023, month: 9, uf: 36294.13, utm: 63515, minWage: 460000 },
    { year: 2023, month: 10, uf: 36471.60, utm: 63960, minWage: 460000 },
    { year: 2023, month: 11, uf: 36622.18, utm: 64115, minWage: 460000 },
    { year: 2023, month: 12, uf: 36768.91, utm: 64343, minWage: 460000 },
    // 2024
    { year: 2024, month: 1, uf: 36904.91, utm: 64666, minWage: 460000 },
    { year: 2024, month: 2, uf: 37042.82, utm: 64793, minWage: 460000 },
    { year: 2024, month: 3, uf: 37166.90, utm: 65182, minWage: 460000 },
    { year: 2024, month: 4, uf: 37302.35, utm: 65443, minWage: 460000 },
    { year: 2024, month: 5, uf: 37402.04, utm: 65770, minWage: 460000 },
    { year: 2024, month: 6, uf: 37482.52, utm: 65770, minWage: 460000 },
    { year: 2024, month: 7, uf: 37470.61, utm: 66395, minWage: 500000 },
    { year: 2024, month: 8, uf: 37508.43, utm: 66497, minWage: 500000 },
    { year: 2024, month: 9, uf: 37489.17, utm: 66524, minWage: 500000 },
    { year: 2024, month: 10, uf: 37489.17, utm: 66524, minWage: 500000 },
    { year: 2024, month: 11, uf: 37489.17, utm: 66524, minWage: 500000 },
    { year: 2024, month: 12, uf: 37489.17, utm: 66524, minWage: 500000 },
    // 2025
    { year: 2025, month: 1, uf: 38989.01, utm: 67429, minWage: 500000 },
    { year: 2025, month: 2, uf: 39081.90, utm: 67294, minWage: 500000 },
    { year: 2025, month: 3, uf: 39269.69, utm: 68034, minWage: 500000 },
    { year: 2025, month: 4, uf: 39485.65, utm: 68306, minWage: 500000 },
    { year: 2025, month: 5, uf: 39081.90, utm: 68648, minWage: 500000 },
    { year: 2025, month: 6, uf: 39189.45, utm: 68785, minWage: 500000 },
    { year: 2025, month: 7, uf: 39269.69, utm: 68923, minWage: 500000 },
    { year: 2025, month: 8, uf: 39265.22, utm: 68647, minWage: 500000 },
    { year: 2025, month: 9, uf: 39394.46, utm: 69265, minWage: 500000 },
    { year: 2025, month: 10, uf: 39485.65, utm: 69265, minWage: 500000 },
    { year: 2025, month: 11, uf: 39602.77, utm: 69542, minWage: 500000 },
    { year: 2025, month: 12, minWage: 500000 },
];

export const initialTaxableCaps: Omit<TaxableCap, 'id'>[] = [
    { year: 2023, afpCap: 81.6, afcCap: 122.6 },
    { year: 2024, afpCap: 84.3, afcCap: 126.6 },
    { year: 2025, afpCap: 87.8, afcCap: 126.6 }, 
];


    

    

    



