// src/lib/previred-generator-corrected.ts

import { Employee, Payroll, Company, AfpEntity as AfpEntityType, HealthEntity as HealthEntityType, WorkdayType } from './types';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';

export interface PreviredValidationError {
  rut: string;
  fieldNumber: number;
  fieldName:string;
  error: string;
}

export type PreviredRow = (string | number)[];

export interface PreviredValidationResult {
  validRows: PreviredRow[];
  errors: PreviredValidationError[];
}

export type AfpEntityName = 'Capital' | 'Cuprum' | 'Habitat' | 'Modelo' | 'Planvital' | 'Provida' | 'Uno' | 'Otra';
export type HealthEntityName = 'Fonasa' | 'Banmédica' | 'Colmena' | 'Consalud' | 'CruzBlanca' | 'Nueva Masvida' | 'Vida Tres' | 'Esencial' | 'Otra';

const afpCodeMapping: Record<AfpEntityName, number> = {
    'Capital': 33, 'Cuprum': 3, 'Habitat': 5, 'Modelo': 34, 'Planvital': 8, 'Provida': 9, 'Uno': 35, 'Otra': 99
};

const healthCodeMapping: Record<HealthEntityName, number> = {
    'Fonasa': 1, 'Banmédica': 78, 'Colmena': 67, 'Consalud': 99, 'CruzBlanca': 76, 'Nueva Masvida': 65, 'Vida Tres': 81, 'Esencial': 107, 'Otra': 999
};

const workdayTypeMapping: Record<WorkdayType, number> = {
    'Completa': 1,
    'Parcial': 2,
    'Sin Jornada': 3 // Added as per Previred documentation
};

function validateRut(rut: string): boolean {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
    const [body, dv] = rut.split('-');
    let sum = 0, multiple = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body.charAt(i), 10) * multiple;
        multiple = multiple < 7 ? multiple + 1 : 2;
    }
    const calculatedDv = 11 - (sum % 11);
    const expectedDv = calculatedDv === 11 ? '0' : calculatedDv === 10 ? 'K' : calculatedDv.toString();
    return expectedDv.toUpperCase() === dv.toUpperCase();
}

const isNumber = (value: any): value is number => typeof value === 'number' && !isNaN(value);

function normalizeDate(dateInput: any): Date | null {
    if (!dateInput) return null;
    let date: Date;
    if (typeof dateInput === 'object' && dateInput !== null && isNumber(dateInput.seconds)) {
        date = new Date(dateInput.seconds * 1000);
    } else {
        date = new Date(dateInput);
    }
    return isValid(date) ? date : null;
}

function getMovementDates(
    contractStartDate: Date | null,
    contractEndDate: Date | null,
    periodStart: Date,
    periodEnd: Date
): { codigo: number; fechaDesde: string; fechaHasta: string } {
    let codigo = 0;
    let fechaDesde = '';
    let fechaHasta = '';

    const startsInPeriod = contractStartDate && contractStartDate >= periodStart && contractStartDate <= periodEnd;
    const endsInPeriod = contractEndDate && contractEndDate >= periodStart && contractEndDate <= periodEnd;

    if (startsInPeriod && endsInPeriod) {
        codigo = 3; // Contratación y Cese
        fechaDesde = format(contractStartDate!, 'dd-MM-yyyy');
        fechaHasta = format(contractEndDate!, 'dd-MM-yyyy');
    } else if (startsInPeriod) {
        codigo = 1; // Contratación
        fechaDesde = format(contractStartDate!, 'dd-MM-yyyy');
    } else if (endsInPeriod) {
        codigo = 2; // Cese
        fechaHasta = format(contractEndDate!, 'dd-MM-yyyy');
    }

    return { codigo, fechaDesde, fechaHasta };
}

export function validatePreviredData(
  company: Company,
  employees: Employee[],
  payrolls: Payroll[],
  year: number,
  month: number
): PreviredValidationResult {

  const validRows: PreviredRow[] = [];
  const errors: PreviredValidationError[] = [];
  
  const payrollPeriodDate = new Date(year, month - 1, 1);
  const periodStart = startOfMonth(payrollPeriodDate);
  const periodEnd = endOfMonth(payrollPeriodDate);
  
  // Corrected date format for fields 9 and 10
  const periodFromDate = format(periodStart, 'dd-MM-yyyy');
  const periodToDate = format(periodEnd, 'dd-MM-yyyy');


  for (const payroll of payrolls) {
    const employee = employees.find(e => e.id === payroll.employeeId);
    if (!employee) continue;

    const contractStartDate = normalizeDate(employee.contractStartDate);
    const contractEndDate = normalizeDate(employee.contractEndDate);

    if (!contractStartDate || contractStartDate > periodEnd || (contractEndDate && contractEndDate < periodStart)) {
      continue;
    }

    if (!employee.rut || !validateRut(employee.rut)) {
      errors.push({ rut: employee.rut || 'N/A', fieldNumber: 1, fieldName: 'RUT', error: 'RUT inválido o no especificado.' });
      continue;
    }
    
    try {
        // Corrected array size to 106 as per Previred specification. Indices will be 0-105.
        const p = new Array(106).fill('');
        p.forEach((_, i) => {
            const numericFields = [21, 22, 23, 27, 28, 29, 30, 32, 33, 39, 43, 44, 48, 49, 59, 60, 64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 77, 78, 80, 81, 84, 85, 86, 87, 88, 89, 90, 91, 92, 97, 98, 100, 101, 102];
            if (numericFields.includes(i)) {
                p[i] = 0;
            }
        });


        const taxableEarnings = Math.round(payroll.taxableEarnings ?? 0);
        const afpMandatoryDiscount = Math.round((payroll.afpDiscount ?? 0) - (payroll.sisDiscount ?? 0));
        const sisDiscount = Math.round(payroll.sisDiscount ?? 0);
        const healthDiscount = Math.round(payroll.healthDiscount ?? 0);
        const additionalHealthDiscount = Math.round(payroll.additionalHealthDiscount ?? 0);

        const [rutBody, dv] = employee.rut.split('-');
        p[0] = rutBody.replace(/\./g, '');                                  // 1: RUT Trabajador
        p[1] = dv.toUpperCase();                                            // 2: DV Trabajador
        const lastNameParts = employee.lastName.split(' ');
        p[2] = lastNameParts[0] || '';                                      // 3: Apellido Paterno
        p[3] = lastNameParts.slice(1).join(' ') || '';                      // 4: Apellido Materno
        p[4] = employee.firstName || '';                                    // 5: Nombres
        p[5] = employee.gender === 'Masculino' ? 'M' : 'F';                 // 6: Sexo
        p[6] = 'CHL';                                                       // 7: Nacionalidad (Using standard ISO 3166-1 alpha-3 code)
        p[7] = 1; // Tipo Pago (1: Mensual)                                 // 8: Tipo Pago
        p[8] = periodFromDate;                                              // 9: Período (Desde)
        p[9] = periodToDate;                                                // 10: Período (Hasta)
        p[10] = 'AFP';                                                      // 11: Régimen Previsional
        p[11] = 1; // Tipo Trabajador (1: Activo)                           // 12: Tipo Trabajador
        p[12] = payroll.workedDays > 30 ? 30 : payroll.workedDays;          // 13: Días Trabajados
        p[13] = '00'; // Tipo de Línea (00: Normal)                         // 14: Tipo de Línea

        const movement = getMovementDates(contractStartDate, contractEndDate, periodStart, periodEnd);
        p[14] = movement.codigo;                                            // 15: Código Movimiento de Personal
        p[15] = movement.fechaDesde;                                        // 16: Fecha Desde
        p[16] = movement.fechaHasta;                                        // 17: Fecha Hasta

        const rawTramo = employee.familyAllowanceBracket || '';
        const tramoMatch = rawTramo.match(/[A-D]/);
        p[17] = tramoMatch ? tramoMatch[0] : 'D';                           // 18: Tramo Asignación Familiar
        p[18] = payroll.familyAllowanceDependents ?? 0;                     // 19: N°Cargas Simples
        // p[19] = 0;                                                       // 20: N° Cargas Maternales (Data not available)
        // p[20] = 0;                                                       // 21: N°Cargas Inválidas (Data not available)
        p[21] = Math.round(payroll.familyAllowanceAmount ?? 0);             // 22: Asignación Familiar
        // p[22] = 0;                                                       // 23: Asignación Familiar Retroactiva (Data not available)
        // p[23] = 0;                                                       // 24: Reintegro Cargas Familiares (Data not available)
        // p[24] = 'N';                                                     // 25: Solicitud Trabajador Joven (N: No)

        // AFP Section
        p[25] = employee.afp ? afpCodeMapping[employee.afp as AfpEntityName] || 99 : 99; // 26: Código de la AFP
        p[26] = taxableEarnings;                                            // 27: Renta Imponible AFP
        p[27] = afpMandatoryDiscount;                                       // 28: Cotización Obligatoria AFP
        p[28] = sisDiscount;                                                // 29: Cotización Seguro de Invalidez y Sobrevivencia (SIS)
        p[29] = Math.round(payroll.voluntaryAfpAmount ?? 0);                // 30: Cuenta de Ahorro Voluntario AFP

        // Health Section
        p[75] = employee.healthSystem ? healthCodeMapping[employee.healthSystem as HealthEntityName] || 1 : 1; // 76: Código Institución de Salud
        if (employee.healthSystem === 'Fonasa') {
            p[64] = taxableEarnings;                                        // 65: Renta Imponible IPS / ISL / Fonasa
            p[70] = healthDiscount;                                         // 71: Cotización Fonasa
        } else { // ISAPRE
            p[77] = taxableEarnings;                                        // 78: Renta Imponible Isapre
            p[78] = employee.healthPlanType === 'UF' ? 'UF' : '$';          // 79: Moneda del plan pactado Isapre
            p[79] = employee.healthPlanAmount ?? 0;                         // 80: Cotización Pactada
            p[80] = healthDiscount;                                         // 81: Cotización Obligatoria Isapre
            p[81] = additionalHealthDiscount;                               // 82: Cotización Adicional Isapre
        }

        // Mutual / ISL Section
        if (company.mutualCode && company.mutualCode > 0) {
            p[96] = company.mutualCode;                                     // 97: Código Mutualidad
            p[97] = Math.round(payroll.mutualTaxableBase ?? taxableEarnings); // 98: Renta Imponible Mutual
            p[98] = Math.round(payroll.mutualDiscount ?? 0);                // 99: Cotización Accidente del Trabajo (MUTUAL)
        } else {
            // If no mutual, use ISL (part of IPS)
            if (p[64] === 0) { p[64] = taxableEarnings; }                    // 65: Renta Imponible IPS / ISL / Fonasa (if not already set)
            p[71] = Math.round(payroll.islDiscount ?? 0);                   // 72: Cotización Acc. Trabajo (ISL)
        }
        
        // CCAF Section
        if (company.ccafCode && company.ccafCode > 0) {
            p[83] = company.ccafCode;                                       // 84: Código CCAF
            p[84] = Math.round(payroll.ccafTaxableBase ?? taxableEarnings); // 85: Renta Imponible CCAF
            p[85] = Math.round(payroll.ccafDiscount ?? 0);                  // 86: Créditos Personales CCAF (Assuming this is the total CCAF discount)
        }
        
        // RIMA and Workday Type
        // p[92] = 0; // 93: Renta Imponible Mes Anterior a la Licencia (RIMA) (Data not available)
        p[93] = employee.workdayType ? workdayTypeMapping[employee.workdayType] : 2; // 94: Tipo de Jornada (Default to 2 'Parcial')
        
        // Unemployment Insurance Section
        p[100] = Math.round(payroll.unemploymentInsuranceTaxableBase ?? 0); // 101: Renta Imponible Seguro Cesantía
        p[101] = Math.round(payroll.unemploymentInsuranceDiscount ?? 0);    // 102: Aporte Trabajador Seguro Cesantía
        p[102] = Math.round(payroll.employerUnemploymentInsurance ?? 0);    // 103: Aporte Empleador Seguro Cesantía

        // Cost Center
        if (employee.costCenter) {
            p[105] = employee.costCenter;                                   // 106: Centro de Costos, Sucursal...
        }

        validRows.push(p);

    } catch (e: any) {
        errors.push({ rut: employee.rut, fieldNumber: 0, fieldName: 'General', error: `Error procesando empleado: ${e.message}` });
    }
  }
  
  return { validRows, errors };
}

export function generatePreviredFileContent(validRows: PreviredRow[]): string {
    const content = validRows.map(row => row.join(';')).join('\r\n');
    return content + (validRows.length > 0 ? '\r\n' : '');
}
