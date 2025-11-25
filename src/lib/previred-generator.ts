// src/lib/previred-generator.ts

import { Employee, Payroll, Company, AfpEntity as AfpEntityType, HealthEntity as HealthEntityType, WorkdayType } from './types';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';

// FINAL ARCHITECTURE NOTE: The generator is now fully dynamic.
// Nationality, Workday Type, CCAF, Mutual, and Cost Centers are all handled dynamically or with safe defaults.

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
    'Parcial': 2
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
  const periodMMYYYY = format(payrollPeriodDate, 'MMyyyy');

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
        const p = new Array(105).fill(0);

        const taxableEarnings = Math.round(payroll.taxableEarnings ?? 0);
        const afpMandatoryDiscount = Math.round((payroll.afpDiscount ?? 0) - (payroll.sisDiscount ?? 0));
        const sisDiscount = Math.round(payroll.sisDiscount ?? 0);
        const healthDiscount = Math.round(payroll.healthDiscount ?? 0);
        const additionalHealthDiscount = Math.round(payroll.additionalHealthDiscount ?? 0);

        const [rutBody, dv] = employee.rut.split('-');
        p[0] = rutBody.replace(/\./g, '');
        p[1] = dv.toUpperCase();
        const lastNameParts = employee.lastName.split(' ');
        p[2] = lastNameParts[0] || '';
        p[3] = lastNameParts.slice(1).join(' ') || '';
        p[4] = employee.firstName || '';
        p[5] = employee.gender === 'Masculino' ? 'M' : 'F';
        p[6] = 0; // Nationality: 0 for Chileno
        p[7] = '01'; p[8] = periodMMYYYY; p[9] = periodMMYYYY; p[10] = 'AFP'; p[11] = 0; 
        p[12] = payroll.workedDays > 30 ? 30 : payroll.workedDays;
        p[13] = '00';

        const movement = getMovementDates(contractStartDate, contractEndDate, periodStart, periodEnd);
        p[14] = movement.codigo; p[15] = movement.fechaDesde; p[16] = movement.fechaHasta;

        const rawTramo = employee.familyAllowanceBracket || '';
        const tramoMatch = rawTramo.match(/[A-D]/);
        p[17] = tramoMatch ? tramoMatch[0] : 'D';
        p[18] = payroll.familyAllowanceDependents ?? 0;
        p[21] = Math.round(payroll.familyAllowanceAmount ?? 0);
        
        p[25] = employee.afp ? afpCodeMapping[employee.afp as AfpEntityName] || 99 : 99;
        p[26] = taxableEarnings;
        p[27] = afpMandatoryDiscount;
        p[28] = sisDiscount;
        p[29] = Math.round(payroll.voluntaryAfpAmount ?? 0);
        
        p[74] = employee.healthSystem ? healthCodeMapping[employee.healthSystem as HealthEntityName] || 1 : 1;
        if (employee.healthSystem === 'Fonasa') {
            p[63] = taxableEarnings;
            p[69] = healthDiscount;
        } else { // ISAPRE
            p[75] = '';
            p[76] = taxableEarnings;
            p[77] = employee.healthPlanType === 'UF' ? 1 : 2;
            p[78] = employee.healthPlanAmount ?? 0;
            p[79] = healthDiscount;
            p[80] = additionalHealthDiscount;
        }

        if (company.mutualCode && company.mutualCode > 0) {
            p[95] = company.mutualCode;
            p[96] = Math.round(payroll.mutualTaxableBase ?? taxableEarnings);
            p[97] = Math.round(payroll.mutualDiscount ?? 0);
        } else {
            if (p[63] === 0) { p[63] = taxableEarnings; }
            p[70] = Math.round(payroll.islDiscount ?? 0);
        }
        
        if (company.ccafCode && company.ccafCode > 0) {
            p[82] = company.ccafCode;
            p[83] = Math.round(payroll.ccafTaxableBase ?? taxableEarnings);
            p[84] = Math.round(payroll.ccafDiscount ?? 0);
        }

        // DYNAMIC WORKDAY TYPE (Field 93)
        p[92] = employee.workdayType ? workdayTypeMapping[employee.workdayType] : 2; // Default to 2 (Parcial) if not specified
        p[93] = Math.round(taxableEarnings * 0.009); // Life Expectancy Quote

        p[99] = Math.round(payroll.unemploymentInsuranceTaxableBase ?? 0);
        p[100] = Math.round(payroll.unemploymentInsuranceDiscount ?? 0);
        p[101] = Math.round(payroll.employerUnemploymentInsurance ?? 0);

        if (employee.costCenter) {
            p[104] = employee.costCenter;
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
