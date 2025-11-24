
// src/lib/types.ts

// --- COMPANY & EMPLOYEE ---

/**
 * Defines the granular accounting mappings for payroll processing.
 * Each property holds the ID of an account from the company's chart of accounts.
 */
export type PayrollAccountMappings = {
    // Expense Accounts (Haberes)
    expense_baseSalary?: string;
    expense_gratification?: string;
    expense_overtime?: string;
    expense_bonuses?: string;      // For both variable and fixed bonuses
    expense_transportation?: string; // Movilización
    expense_mealAllowance?: string;  // Colación
    
    // Liability Accounts (Descuentos)
    liability_afp?: string;
    liability_health?: string;
    liability_unemployment?: string;
    liability_tax?: string;          // Impuesto Único
    liability_advances?: string;     // Anticipos
    liability_ccaf?: string;         // CCAF Credits, etc.

    // Employer Contribution Expenses (Gasto Empleador)
    expense_sis?: string;            // Aporte SIS
    expense_unemployment?: string;   // Aporte Seguro Cesantía
};

export type Company = {
    id: string;
    name: string;
    rut: string;
    legalRepresentative: string;
    address: string;
    email: string;
    phone: string;
    createdAt: any; // Consider using a specific Date type or string
    mutual?: string;
    ccaf?: string;

    // DEPRECATED - General account mappings for payroll
    // To be replaced by payrollAccountMappings for granular control
    remunerationExpenseAccount?: string; 
    salariesPayableAccount?: string;
    afpPayableAccount?: string;
    healthPayableAccount?: string;
    unemploymentInsurancePayableAccount?: string;
    employerAfpContributionPayableAccount?: string;

    // NEW - Granular account mappings for payroll
    payrollAccountMappings?: PayrollAccountMappings;
};

export type Employee = {
    id: string;
    companyId: string;

    // Personal Data
    rut: string;
    firstName: string;
    lastName: string;
    birthDate: any; // Consider using a specific Date type or string
    nationality: string;
    address: string;
    region: string;
    commune: string;
    phone?: string;
    email?: string;
    gender: string;
    maritalStatus: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // Contractual Data
    status: 'Active' | 'Inactive';
    position: string;
    contractType: 'Indefinido' | 'Plazo Fijo' | 'Obra o Faena' | 'Trabajador de Casa Particular';
    contractStartDate: any; // Consider using a specific Date type or string
    contractEndDate?: any; // Consider using a specific Date type or string
    weeklyHours: number;
    workday: string;
    costCenterId?: string;

    // Compensation Data
    baseSalary: number;
    mobilization: number;
    collation: number;
    gratificationType: 'Sin Gratificación' | 'Tope Legal' | 'Automatico';
    bonosFijos?: Bono[];

    // Previsional Data
    healthSystem: string;
    healthContributionType: 'Porcentaje' | 'Monto Fijo';
    healthContributionValue: number;
    afp: string;
    isPensioner: boolean; // NEW: To exclude from AFP calculation if true
    hasUnemploymentInsurance: boolean;
    unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo' | 'Trabajador de Casa Particular';
    healthPlanType?: 'UF' | 'Pesos';
    healthPlanAmount?: number;

    // Family Allowance
    hasFamilyAllowance: boolean;
    familyDependents?: number;
    familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D'; // This is calculated, not stored

    // APV
    apvInstitution?: string;
    apvAmount?: number;
    apvRegime?: 'A' | 'B';

    // Payment Data
    paymentMethod: string;
    bank?: string;
    accountType?: string;
    accountNumber?: string;
    
    // Metadata
    createdAt: any; // Consider using a specific Date type or string
};

export type Bono = {
    glosa: string;
    monto: number;
    tipo: 'fijo' | 'variable';
    noImponible?: boolean;
}

// --- PAYROLL (Granular Structure) ---

export type PayrollEarningItem = {
    type: 'taxable' | 'non-taxable';
    name: string;
    amount: number;
    calculationDetail?: string; 
}

export type PayrollDiscountItem = {
    type: 'previsional' | 'tax' | 'other';
    name: string;
    amount: number;
    calculationDetail?: string;
}

// Represents the final, processed payroll record stored in the database.
export type Payroll = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    period: any; // Should be a Timestamp
    year: number;
    month: number;
    
    baseSalary: number;
    workedDays: number;
    absentDays: number;

    // Granular Earnings & Discounts
    earnings: PayrollEarningItem[];
    discounts: PayrollDiscountItem[];

    // Totals
    taxableEarnings: number;
    nonTaxableEarnings: number;
    totalEarnings: number;
    totalDiscounts: number;
    netSalary: number;
    
    // Specific values for reports
    afpDiscount: number;
    healthDiscount: number;
    unemploymentInsuranceDiscount: number;
    sisDiscount?: number;
    iut: number; 
    voluntaryAfpAmount?: number;
    additionalHealthDiscount?: number;
    employerUnemploymentInsurance?: number;
    ccafDiscount?: number;
    familyAllowance: number;
    advances: number;

    // Taxable bases
    afpTaxableBase: number;
    healthTaxableBase: number;
    unemploymentInsuranceTaxableBase: number;
    ccafTaxableBase?: number;

    createdAt: any; // Should be a Timestamp
};

// Represents the editable draft of a payroll before it's finalized.
export type PayrollDraft = Partial<Payroll> & {
    employeeId: string; 
    employeeName: string;
    variableBonos?: Bono[];
};


// --- ACCOUNTING & VOUCHERS ---

export type Account = {
    id: string;
    companyId: string;
    code: string;
    name: string;
    type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Resultado';
    balance: number;
    children?: Account[];
};

export type Voucher = {
    id: string;
    companyId: string;
    date: any; // Should be a Timestamp
    description: string;
    type: 'Ingreso' | 'Egreso' | 'Traspaso';
    status: 'Borrador' | 'Contabilizado' | 'Anulado';
    total: number;
    entries: VoucherEntry[];
    createdAt: any; // Should be a Timestamp
};

export type VoucherEntry = {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
};

// --- PREVISIONAL DATA & PARAMETERS ---

export type AfpEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number; 
    previredCode: string;
    provisionalRegime: string;
    dtCode: string;
    employerContribution: number; // SIS rate
};

export type HealthEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number; // Always 7%
    previredCode: string;
    dtCode: string;
};

export type EconomicIndicator = {
    id: string;
    year: number;
    month: number;
    uf?: number;
    utm: number;
    minWage: number;
    uta: number;
    gratificationCap: number;
};

export type FamilyAllowanceParameter = {
    id: string;
    year: number;
    month: number;
    tramo: 'A' | 'B' | 'C' | 'D';
    desde: number;
    hasta: number;
    monto: number;
};

export type TaxParameter = {
    id: string;
    year: number;
    month: number;
    tramo: string;
    desdeUTM: number;
    hastaUTM: number;
    factor: number;
    rebajaUTM: number;
};

export type TaxableCap = {
    id: string;
    year: number;
    afpCap: number; 
    afcCap: number; 
};
