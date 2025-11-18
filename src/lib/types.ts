export type Company = {
    id: string;
    name: string;
    rut: string;
    legalRepresentative: string;
    address: string;
    email: string;
    phone: string;
    createdAt: any;
};

export type Employee = {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    rut: string;
    email: string;
    phone: string;
    address: string;
    contractType: 'Indefinido' | 'Plazo Fijo' | 'Por Obra';
    position: string;
    hireDate: any; 
    terminationDate?: any; 
    status: 'Active' | 'Inactive';
    baseSalary: number;
    gratificationType: 'Sin Gratificación' | 'Tope Legal' | 'Automatico';
    weeklyHours: number;
    bankAccount?: string;
    bankName?: string;
    afp: string;
    healthSystem: 'Fonasa' | 'Isapre';
    healthContributionType: 'Porcentaje' | 'Monto Fijo'; 
    healthContributionValue: number; 
    hasUnemploymentInsurance: boolean;
    unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo';
    hasFamilyAllowance: boolean; 
    familyDependents: number; 
    familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D'; 
    bonosFijos?: Bono[];
    mobilization?: number;
    collation?: number;
    createdAt: any; 
};

export type Bono = {
    glosa: string;
    monto: number;
    tipo: 'fijo' | 'variable';
}

// Represents the final, processed payroll record stored in the database.
export type Payroll = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    period: string; 
    year: number;
    month: number;
    workedDays: number; // NEWLY ADDED FIELD
    baseSalary: number;
    absentDays: number;
    proportionalBaseSalary: number;
    overtimeHours50: number;
    overtimeHours100: number;
    totalOvertimePay: number;
    bonos: Bono[];
    gratification: number;
    taxableEarnings: number;
    nonTaxableEarnings: number;
    totalEarnings: number;
    afpDiscount: number;
    healthDiscount: number;
    unemploymentInsuranceDiscount: number;
    iut: number; 
    familyAllowance: number; 
    advances: number;
    totalDiscounts: number;
    netSalary: number;
    createdAt: any; 
};

// NEWLY DEFINED: Represents the editable draft of a payroll before it's finalized.
// This is the type used in the payroll management UI.
export type PayrollDraft = Partial<Payroll> & {
    employeeId: string;      // Required for identification
    employeeName: string;    // Required for display
    variableBonos?: Bono[]; // Used for temporary, editable bonuses
};


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
    date: any; 
    description: string;
    type: 'Ingreso' | 'Egreso' | 'Traspaso';
    status: 'Borrador' | 'Contabilizado' | 'Anulado';
    total: number;
    entries: VoucherEntry[];
    createdAt: any; 
};

export type VoucherEntry = {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
};

// --- Previsional Data ---

export type AfpEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number; 
    previredCode: string;
    provisionalRegime: string;
    dtCode: string;
    employerContribution: number; 
};

export type HealthEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number; 
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