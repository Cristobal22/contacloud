
// src/lib/previred-generator.ts

import { Employee, Payroll, Company, AfpEntity as AfpEntityType, HealthEntity as HealthEntityType } from './types';
import { format } from 'date-fns';

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

// --- MAPPINGS and HELPERS ---

// Corrected: Using string literal types for better type checking
export type AfpEntityName = 'Capital' | 'Cuprum' | 'Habitat' | 'Modelo' | 'Planvital' | 'Provida' | 'Uno' | 'Otra';
export type HealthEntityName = 'Fonasa' | 'Banmédica' | 'Colmena' | 'Consalud' | 'CruzBlanca' | 'Nueva Masvida' | 'Vida Tres' | 'Esencial' | 'Otra';


const afpCodeMapping: Record<AfpEntityName, number> = {
    'Capital': 33, 'Cuprum': 3, 'Habitat': 5, 'Modelo': 34, 'Planvital': 8, 'Provida': 9, 'Uno': 35, 'Otra': 99
};

const healthCodeMapping: Record<HealthEntityName, number> = {
    'Fonasa': 1000, 'Banmédica': 78, 'Colmena': 67, 'Consalud': 99, 'CruzBlanca': 76, 'Nueva Masvida': 65, 'Vida Tres': 81, 'Esencial': 107, 'Otra': 999
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
    if (typeof dateInput === 'object' && dateInput !== null && isNumber(dateInput.seconds) && isNumber(dateInput.nanoseconds)) {
        return new Date(dateInput.seconds * 1000);
    }
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}

const formatDate = (date: Date | null): string => date ? format(date, 'dd-MM-yyyy') : '          ';

const NUMERIC_FIELDS = new Set([12, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104]);

export function validatePreviredData(
  company: Company,
  employees: Employee[],
  payrolls: Payroll[]
): PreviredValidationResult {

  const validRows: PreviredRow[] = [];
  const errors: PreviredValidationError[] = [];

  if (payrolls.length === 0) {
      errors.push({ rut: 'N/A', fieldNumber: 0, fieldName: 'Nómina', error: 'No se encontraron liquidaciones para el período seleccionado.' });
      return { validRows, errors };
  }

  for (const payroll of payrolls) {
    const employee = employees.find(e => e.id === payroll.employeeId);
    
    if (!employee) {
        errors.push({ rut: 'N/A', fieldNumber: 0, fieldName: 'Empleado', error: `No se encontró el empleado con ID ${payroll.employeeId}.` });
        continue;
    }

    const recordErrors: PreviredValidationError[] = [];
    const p = new Array(105).fill(null); // Use null as a placeholder

    // --- FIELD MAPPING ---
    if (employee.rut && validateRut(employee.rut)) {
        const [rutBody, dv] = employee.rut.split('-');
        p[0] = rutBody.replace(/\./g, '');
        p[1] = dv.toUpperCase();
    } else {
        recordErrors.push({ rut: employee.rut || 'Sin RUT', fieldNumber: 1, fieldName: 'RUT Trabajador', error: 'RUT inválido o faltante.' });
    }

    const nameParts = employee.lastName.split(' ');
    p[2] = nameParts[0] || ' ';
    p[3] = nameParts.slice(1).join(' ') || ' ';
    p[4] = employee.firstName || ' ';
    p[5] = employee.gender === 'Masculino' ? 'M' : employee.gender === 'Femenino' ? 'F' : ' ';
    p[6] = employee.nationality === 'Chilena' ? 152 : 999; // 152: Chile, 999: Extranjero
    p[7] = 1; // Tipo de Pago: 1 (Efectivo / Cheque / Vale Vista / Depósito Cta Cte)
    p[8] = formatDate(normalizeDate(payroll.period));
    p[9] = formatDate(normalizeDate(payroll.period));
    p[10] = employee.afp ? 'AFP' : 'INP';
    p[11] = 0; // Tipo de trabajador: 0 (Activo)
    p[12] = payroll.workedDays > 30 ? 30 : payroll.workedDays;
    p[13] = '00'; // Tipo de Línea
    p[14] = ' '; // Movimiento: I, R, ' '
    p[15] = formatDate(normalizeDate(employee.contractStartDate));
    p[16] = formatDate(normalizeDate(employee.contractEndDate));
    
    p[25] = employee.afp ? afpCodeMapping[employee.afp as AfpEntityName] || 99 : 99; 
    p[26] = payroll.taxableEarnings ?? 0;
    p[27] = payroll.afpDiscount ?? 0;
    p[28] = payroll.sisDiscount ?? 0; 
    p[29] = payroll.voluntaryAfpAmount ?? 0;

    p[37] = employee.healthSystem ? healthCodeMapping[employee.healthSystem as HealthEntityName] || 999 : 1000; // Fonasa por defecto
    p[38] = ' '; // Nro. FUN
    p[39] = payroll.healthTaxableBase ?? 0;
    p[40] = payroll.healthDiscount ?? 0; // 7%
    p[41] = payroll.additionalHealthDiscount ?? 0; // Adicional
    p[42] = (payroll.healthDiscount ?? 0) + (payroll.additionalHealthDiscount ?? 0); // Suma del 7% y el adicional
    p[43] = employee.healthPlanType === 'UF' ? 1 : 2; // 1: UF, 2: Pesos
    p[44] = employee.healthPlanAmount ?? 0;

    p[45] = 18; // Caja de compensacion, hardcode Los Andes
    p[46] = payroll.ccafTaxableBase ?? 0;
    p[47] = payroll.ccafDiscount ?? 0;

    p[51] = payroll.unemploymentInsuranceTaxableBase ?? 0;
    p[52] = payroll.unemploymentInsuranceDiscount ?? 0; 
    p[53] = payroll.employerUnemploymentInsurance ?? 0;

    // --- FINALIZATION ---
    if (recordErrors.length > 0) {
      errors.push(...recordErrors);
    } else {
      // Replace placeholders with format-correct defaults
      for (let i = 0; i < p.length; i++) {
        if (p[i] === null || p[i] === undefined) {
          p[i] = NUMERIC_FIELDS.has(i) ? 0 : ' ';
        }
      }
      validRows.push(p);
    }
  }
  
  return { validRows, errors };
}

/**
 * Genera el contenido del archivo de texto plano para Previred.
 * @param validRows - Un arreglo de filas que han pasado la validación.
 * @returns Una cadena de texto con el contenido del archivo.
 */
export function generatePreviredFileContent(validRows: PreviredRow[]): string {
    return validRows.map(row => row.join(';')).join('\r\n');
}
