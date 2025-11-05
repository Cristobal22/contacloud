
// src/lib/previred-generator.ts

import { Employee, Payroll, Company } from './types';

/**
 * Define la estructura para los errores de validación encontrados
 * durante la generación del archivo Previred.
 */
export interface PreviredValidationError {
  rut: string;
  fieldNumber: number;
  fieldName:string;
  error: string;
}

/**
 * Define la estructura de una fila de datos validada para Previred.
 * Los campos son un arreglo de strings/numbers que representan los 105 campos.
 */
export type PreviredRow = (string | number)[];

/**
 * Define la estructura del resultado de la validación.
 * Contiene los registros que pasaron la validación y los errores encontrados.
 */
export interface PreviredValidationResult {
  validRows: PreviredRow[];
  errors: PreviredValidationError[];
}

// Helper para validación de RUT (Módulo 11)
function validateRut(rut: string): boolean {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) {
        return false;
    }
    const [body, dv] = rut.split('-');
    let sum = 0;
    let multiple = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body.charAt(i), 10) * multiple;
        if (multiple < 7) {
            multiple++;
        } else {
            multiple = 2;
        }
    }
    const calculatedDv = 11 - (sum % 11);
    const expectedDv = calculatedDv === 11 ? '0' : calculatedDv === 10 ? 'K' : calculatedDv.toString();
    
    return expectedDv.toUpperCase() === dv.toUpperCase();
}


/**
 * Valida los datos de la nómina de una empresa para un período específico
 * y los prepara para la generación del archivo Previred.
 *
 * @param company - Los datos de la empresa.
 * @param employees - Un arreglo de todos los empleados de la empresa.
 * @param payrolls - Un arreglo de todas las liquidaciones del período.
 * @returns Un objeto que contiene las filas validadas y una lista de errores.
 */
export function validatePreviredData(
  company: Company,
  employees: Employee[],
  payrolls: Payroll[]
): PreviredValidationResult {

  const validRows: PreviredRow[] = [];
  const errors: PreviredValidationError[] = [];

  if (payrolls.length === 0) {
      errors.push({
          rut: 'N/A',
          fieldNumber: 0,
          fieldName: 'Nómina',
          error: 'No se encontraron liquidaciones para el período seleccionado.'
      });
      return { validRows, errors };
  }

  for (const payroll of payrolls) {
    const employee = employees.find(e => e.id === payroll.employeeId);
    
    if (!employee) {
        errors.push({
            rut: 'N/A',
            fieldNumber: 0,
            fieldName: 'Empleado',
            error: `No se encontró el empleado con ID ${payroll.employeeId} para la liquidación del período ${payroll.period}.`
        });
        continue; // Pasar a la siguiente liquidación
    }

    const recordErrors: PreviredValidationError[] = [];
    const previredFields = new Array(105).fill(''); // Inicializar los 105 campos

    // --- INICIO DE VALIDACIONES POR CAMPO ---

    // Campo 1 y 2: RUT y DV
    if (!employee.rut || !validateRut(employee.rut)) {
        recordErrors.push({ rut: employee.rut || 'Sin RUT', fieldNumber: 1, fieldName: 'RUT Trabajador', error: 'RUT inválido o faltante.' });
    } else {
        const [rutBody, dv] = employee.rut.split('-');
        previredFields[0] = rutBody.replace(/\./g, '');
        previredFields[1] = dv;
    }

    // Campo 13: Días Trabajados
    const workedDays = payroll.workedDays;
    if (workedDays === undefined || workedDays < 0 || workedDays > 30) {
        recordErrors.push({ rut: employee.rut, fieldNumber: 13, fieldName: 'Días Trabajados', error: `Valor '${workedDays}' no es válido. Debe estar entre 0 y 30.` });
    } else {
        previredFields[12] = workedDays;
    }
    
    // Campo 14: Tipo de Línea
    previredFields[13] = '00'; // Por ahora, solo línea principal

    // Campo 27: Renta Imponible AFP
    if (employee.afpEntity) { // Asume que si tiene entidad, cotiza
        if (payroll.taxableEarnings === undefined || payroll.taxableEarnings < 0) {
             recordErrors.push({ rut: employee.rut, fieldNumber: 27, fieldName: 'Renta Imponible AFP', error: 'Dato faltante o inválido.' });
        } else {
            previredFields[26] = payroll.taxableEarnings;
        }
    } else {
         previredFields[26] = 0;
    }

    // Campo 28: Cotización Obligatoria AFP
    if (employee.afpEntity) {
        if (payroll.afpDiscount === undefined || payroll.afpDiscount < 0) {
             recordErrors.push({ rut: employee.rut, fieldNumber: 28, fieldName: 'Cotización Obligatoria AFP', error: 'Cálculo de cotización AFP faltante o inválido.' });
        } else {
             previredFields[27] = payroll.afpDiscount;
        }
    } else {
        previredFields[27] = 0;
    }

     // Llenar campos numéricos vacíos con 0
    for(let i = 0; i < previredFields.length; i++) {
        const numericFields = [12, 26, 27]; // Ejemplo, agregar todos los campos numéricos
        if (numericFields.includes(i) && previredFields[i] === '') {
            previredFields[i] = 0;
        }
    }


    // --- FIN DE VALIDACIONES ---

    if (recordErrors.length > 0) {
      errors.push(...recordErrors);
    } else {
      validRows.push(previredFields);
    }
  }
  
  return {
    validRows,
    errors,
  };
}

/**
 * Genera el contenido del archivo de texto plano para Previred.
 * @param validRows - Un arreglo de filas que han pasado la validación.
 * @returns Una cadena de texto con el contenido del archivo.
 */
export function generatePreviredFileContent(validRows: PreviredRow[]): string {
    return validRows.map(row => row.join(';')).join('\r\n');
}
