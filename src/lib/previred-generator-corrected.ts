import { Employee, Payroll, Company, PaymentMethod, AfpEntityName, HealthEntityName, CcafEntityName, MutualEntityName, RegimenPrevisional } from './types';
import { format, startOfMonth, endOfMonth, isValid, differenceInYears } from 'date-fns';

export interface PreviredValidationError { rut: string; fieldNumber: number; fieldName: string; error: string; }
export type PreviredRow = (string | number)[];
export interface PreviredValidationResult { validRows: PreviredRow[]; errors: PreviredValidationError[]; }

const afpCodeMapping: Record<AfpEntityName, number> = { 'CAPITAL': 33, 'CUPRUM': 3, 'HABITAT': 5, 'MODELO': 34, 'PLANVITAL': 8, 'PROVIDA': 9, 'UNO': 35, 'OTRA': 99 };
const healthCodeMapping: Record<HealthEntityName, number> = { 'FONASA': 7, 'BANMEDICA': 78, 'COLMENA': 67, 'CONSALUD': 12, 'CRUZBLANCA': 76, 'NUEVA MASVIDA': 65, 'VIDA TRES': 81, 'ESENCIAL': 107, 'OTRA': 99 };
const ccafCodeMapping: Record<CcafEntityName, number> = { 'Los Andes': 3, 'La Araucana': 5, 'Caja 18 de Septiembre': 1, 'Los Héroes': 2 };
const mutualCodeMapping: Record<MutualEntityName, number> = { 'ACHS': 4, 'Mutual de Seguridad': 1, 'IST': 6 };
const regimenPrevisionalMapping: Record<RegimenPrevisional, string> = { 'AFP': 'AFP', 'INP': 'INP' };

const stringFieldIds = [1, 2, 3, 4, 5, 6, 9, 10, 11, 16, 17, 18, 25, 36, 39, 66, 80, 81, 82, 83, 84, 85, 86, 87, 93, 94];

const cleanAmount = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : Math.round(num);
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

function normalizeDate(dateInput: any): Date | null {
    if (!dateInput) return null;
    const date = (typeof dateInput === 'object' && dateInput.seconds) ? new Date(dateInput.seconds * 1000) : new Date(dateInput);
    return isValid(date) ? date : null;
}

function getMovementDates(startDate: Date | null, endDate: Date | null, periodStart: Date, periodEnd: Date): { code: number; from: string; to: string } {
    const df = 'dd/MM/yyyy';
    const startsIn = startDate && startDate >= periodStart && startDate <= periodEnd;
    const endsIn = endDate && endDate >= periodStart && endDate <= periodEnd;
    if (startsIn && endsIn) return { code: 3, from: format(startDate!, df), to: format(endDate!, df) };
    if (startsIn) return { code: 1, from: format(startDate!, df), to: '' };
    if (endsIn) return { code: 2, from: '', to: format(endDate!, df) };
    return { code: 0, from: '', to: '' };
}

export function validatePreviredData(company: Company, employees: Employee[], payrolls: Payroll[], year: number, month: number): PreviredValidationResult {
    const validRows: PreviredRow[] = [];
    const errors: PreviredValidationError[] = [];
    const periodDate = new Date(year, month - 1, 1);
    const periodStart = startOfMonth(periodDate);
    const periodEnd = endOfMonth(periodDate);

    for (const employee of employees) {
        const startDate = normalizeDate(employee.contractStartDate);
        const endDate = normalizeDate(employee.contractEndDate);
        
        if (!startDate || startDate > periodEnd || (endDate && endDate < periodStart)) {
            continue;
        }

        const payroll = payrolls.find(p => p.employeeId === employee.id && p.year === year && p.month === month);
        if (!payroll) {
            errors.push({ rut: employee.rut, fieldNumber: 0, fieldName: 'General', error: 'No se encontró el borrador de liquidación para este empleado.' });
            continue;
        }
        
        const validationErrors: string[] = [];
        if (!employee.rut || !validateRut(employee.rut)) { 
            errors.push({ rut: employee.rut || 'N/A', fieldNumber: 1, fieldName: 'RUT', error: 'RUT inválido.' }); 
            continue;
        }
        if (!employee.regimenPrevisional) validationErrors.push('Régimen Previsional');
        if (!employee.afp && employee.regimenPrevisional === 'AFP') validationErrors.push('AFP');
        if (!employee.healthSystem) validationErrors.push('Sistema de Salud');

        if (validationErrors.length > 0) {
            errors.push({ rut: employee.rut, fieldNumber: 0, fieldName: 'Ficha de Personal', error: `Faltan datos obligatorios: ${validationErrors.join(', ')}.` });
            continue;
        }

        try {
            const p = new Array(105).fill('');
            p.forEach((_, i) => { if (!stringFieldIds.includes(i + 1)) { p[i] = 0; } });

            const [rutBody, dv] = employee.rut.split('-');
            const [paterno, ...maternoParts] = (employee.lastName || '').split(' ');
            const movement = getMovementDates(startDate, endDate, periodStart, periodEnd);
            const birthDate = normalizeDate(employee.birthDate);
            const age = birthDate ? differenceInYears(periodDate, birthDate) : 0;
            const isPensioner = employee.isPensioner ?? (birthDate && ((employee.gender === 'F' && age >= 60) || (employee.gender !== 'F' && age >= 65)));

            p[0] = rutBody.replace(/\./g, ''); 
            p[1] = dv.toUpperCase();
            p[2] = paterno;
            p[3] = maternoParts.join(' ');
            p[4] = employee.firstName;
            p[5] = employee.gender === 'Masculino' ? 'M' : 'F';
            p[6] = employee.nationality === 'Chilena' ? 1 : 2;
            p[7] = 1; 
            p[8] = format(periodDate, 'MMyyyy');
            p[9] = format(periodDate, 'MMyyyy');
            p[10] = regimenPrevisionalMapping[employee.regimenPrevisional!];
            p[11] = isPensioner ? 2 : 1;
            p[12] = cleanAmount(payroll.workedDays);
            p[13] = 1;
            p[14] = movement.code;
            p[15] = movement.from;
            p[16] = movement.to;
            p[17] = employee.familyAllowanceBracket ?? '';
            p[18] = cleanAmount(employee.normalFamilyDependents);
            p[20] = cleanAmount(employee.invalidityFamilyDependents);
            p[21] = cleanAmount(payroll.earnings?.find(e => e.name.includes('Asignación Familiar'))?.amount);
            p[22] = cleanAmount(payroll.retroactiveFamilyAllowance);
            
            if (employee.regimenPrevisional === 'AFP' && employee.afp) {
                p[25] = afpCodeMapping[employee.afp];
                p[26] = cleanAmount(payroll.taxableEarnings);
                p[27] = cleanAmount(payroll.discounts?.find(d => d.name.includes('Cotización Obligatoria AFP'))?.amount);
                p[28] = cleanAmount(payroll.employerContributions?.find(c => c.name === 'SIS')?.amount);
                p[29] = cleanAmount(payroll.discounts?.find(d => d.name === 'Ahorro Voluntario AFP')?.amount);
            }
            
            p[37] = healthCodeMapping[employee.healthSystem!];
            p[38] = '' // FUN, not available
            p[39] = cleanAmount(payroll.taxableHealth);
            p[40] = cleanAmount(payroll.discounts?.find(d => d.name.includes('Cotización Salud'))?.amount);
            
            if (employee.regimenPrevisional === 'AFP') {
                const unemploymentInsurance = payroll.discounts?.find(d => d.name.includes('Seguro de Cesantía'));
                const employerUnemployment = payroll.employerContributions?.find(c => c.name === 'Seguro Cesantía Empleador');
                p[51] = cleanAmount(payroll.taxableUnemploymentInsurance);
                p[52] = cleanAmount(unemploymentInsurance?.amount);
                p[53] = cleanAmount(employerUnemployment?.amount);
            }

            if (company.mutualName) {
                p[54] = mutualCodeMapping[company.mutualName];
                p[55] = cleanAmount(payroll.taxableEarnings);
                p[56] = cleanAmount(payroll.employerContributions?.find(c => c.name === 'Mutual de Seguridad')?.amount);
            }

            if (company.ccafName) {
                p[45] = ccafCodeMapping[company.ccafName];
                p[46] = cleanAmount(payroll.taxableEarnings);
                p[47] = cleanAmount(payroll.discounts?.find(d => d.name === 'Crédito CCAF')?.amount);
            }

            validRows.push(p);

        } catch (e: any) {
            errors.push({ rut: employee.rut, fieldNumber: 0, fieldName: 'General', error: `Error inesperado al procesar la fila: ${e.message}` });
        }
    }
    return { validRows, errors };
}

export function generatePreviredFileContent(validRows: PreviredRow[]): string {
    const content = validRows.map(row => {
        return row.map((val, i) => {
            if (typeof val === 'number') {
                return val.toFixed(0);
            }
            return val;
        }).join(';');
    }).join('\r\n');
    return content + (validRows.length > 0 ? '\r\n' : '');
}
