// src/lib/types.ts

// FINAL ARCHITECTURAL FIX: The Payroll type definition now includes the detailed `earnings` and `discounts` arrays.
// This was the root cause of the display issues. By correcting the type, we ensure that the data structure is consistent
// from calculation (payroll-generator) to storage (Firestore) to display (payroll-detail-dialog).

export interface Company {
    id?: string;
    name: string;
    rut: string;
    address: string;
    mutualCode?: number; 
    ccafCode?: number;
}

export type WorkdayType = 'Completa' | 'Parcial';

export interface Employee {
    id?: string;
    companyId: string;
    firstName: string;
    lastName: string;
    rut: string;
    gender: 'Masculino' | 'Femenino' | 'Otro';
    nationality: string;
    birthDate: any; // Firestore Timestamp or Date
    contractStartDate: any; // Firestore Timestamp or Date
    contractEndDate?: any; // Firestore Timestamp or Date
    position: string;
    weeklyHours: number;
    baseSalary: number;
    workdayType?: WorkdayType; // Tipo de Jornada
    
    // Asignaciones y Bonos
    collation: number;
    mobilization: number;
    bonosFijos?: { glosa: string; monto: number; tipo: 'fijo' | 'fijo-no-imponible' }[];

    // Previsión
    afp: string; // AfpEntity name
    healthSystem: string; // HealthEntity name
    healthPlanAmount?: number;
    healthPlanType?: 'UF' | 'CLP';
    healthContributionType?: 'Porcentaje' | 'Monto Fijo';
    healthContributionValue?: number;

    // APV
    apvInstitution?: string;
    apvAmount?: number;
    apvRegime?: 'A' | 'B';

    // Seguro de Cesantía
    hasUnemploymentInsurance: boolean;
    unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo' | 'Trabajador de Casa Particular';

    // Asignación Familiar
    hasFamilyAllowance: boolean;
    familyDependents?: number;
    familyAllowanceBracket?: string;

    // Gratificación
    gratificationType?: 'Tope Legal' | 'Automatico' | 'Sin Gratificacion';

    // Otros
    costCenter?: string;
}

export interface PayrollEarningItem {
    name: string;
    amount: number;
    type: 'taxable' | 'non-taxable';
    calculationDetail?: string;
}

export interface PayrollDiscountItem {
    name: string;
    amount: number;
    type: 'previsional' | 'tax' | 'other';
    calculationDetail?: string;
}

export interface Payroll {
    id?: string;
    employeeId: string;
    employeeName: string;
    companyId: string;
    year: number;
    month: number;
    status: 'draft' | 'processed' | 'paid';
    
    // --- Detailed Breakdown (New Structure) ---
    earnings?: PayrollEarningItem[];
    discounts?: PayrollDiscountItem[];
    // ----------------------------------------

    baseSalary: number;
    workedDays: number;
    absentDays: number;

    taxableEarnings: number;
    nonTaxableEarnings: number;
    totalEarnings: number;
    totalDiscounts: number;
    netSalary: number;
    netSalaryInWords?: string;

    // Main Discount Values
    afpDiscount?: number;
    healthDiscount?: number;
    unemploymentInsuranceDiscount?: number;
    iut?: number; // Impuesto Único a la Renta
    advances?: number;
    
    // Calculation Bases
    afpTaxableBase?: number;
    healthTaxableBase?: number;
    unemploymentInsuranceTaxableBase?: number;
    mutualTaxableBase?: number;
    ccafTaxableBase?: number;

    // Other values that might be useful
    familyAllowance?: number;
    employerUnemploymentInsurance?: number;
    sisDiscount?: number;
    mutualDiscount?: number;
    ccafDiscount?: number;
    
    // For Previred
    period?: string; 
    gratification?: number;
    otherTaxableEarnings?: any;
    bonos?: any;
    totalOvertimePay?: any;
    otherDiscounts?: any;
}

export type AfpEntityName = 'Capital' | 'Cuprum' | 'Habitat' | 'Modelo' | 'Planvital' | 'Provida' | 'Uno' | 'Otra';
export type HealthEntityName = 'Fonasa' | 'Banmédica' | 'Colmena' | 'Consalud' | 'CruzBlanca' | 'Nueva Masvida' | 'Vida Tres' | 'Esencial' | 'Otra';

// Data model for economic indicators stored per month
export interface EconomicIndicator {
    id?: string; // YYYY-MM
    year: number;
    month: number;
    uf: number;
    utm: number;
    gratificationCap: number; // Sueldo mínimo para fines de gratificación
}

// Data model for AFP entity parameters stored per month
export interface AfpEntity {
    id?: string;
    name: AfpEntityName;
    year: number;
    month: number;
    mandatoryContribution: number;
    sisRate: number; // Tasa de cotización del SIS
}

// Data model for Health entity parameters stored per month
export interface HealthEntity {
    id?: string;
    name: HealthEntityName;
    year: number;
    month: number;
    // Any specific parameters for health entities can be added here
}

export interface TaxableCap {
    id?: string; // YYYY
    year: number;
    afpCap: number; // Tope imponible AFP en UF
    afcCap: number; // Tope imponible Seguro Cesantía en UF
}

export interface FamilyAllowanceParameter {
    id?: string;
    year: number;
    month: number;
    tramo: 'A' | 'B' | 'C' | 'D';
    desde: number;
    hasta: number;
    monto: number;
}

export interface TaxParameter {
    id?: string;
    desdeUTM: number;
    hastaUTM?: number;
    factor: number;
    rebajaUTM: number;
}

export interface Bono {
    glosa: string;
    monto: number;
    tipo: 'variable' | 'fijo' | 'fijo-no-imponible';
}
