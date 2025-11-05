export type Company = {
    id: string;
    name: string;
    rut: string;
    legalRepresentative: string;
    address: string;
    email: string;
    phone: string;
    createdAt: any; // Opcional: podrías usar un tipo más específico como firebase.firestore.Timestamp
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
    hireDate: any; // Opcional: firebase.firestore.Timestamp
    terminationDate?: any; // Opcional
    status: 'Active' | 'Inactive';
    baseSalary: number;
    gratificationType: 'Sin Gratificación' | 'Tope Legal' | 'Automatico';
    weeklyHours: number;
    bankAccount?: string;
    bankName?: string;
    afp: string;
    healthSystem: 'Fonasa' | 'Isapre';
    healthContributionType: 'Porcentaje' | 'Monto Fijo'; // Porcentaje (7%) o Monto Fijo en UF
    healthContributionValue: number; // Porcentaje o monto en UF
    hasUnemploymentInsurance: boolean;
    unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo';
    hasFamilyAllowance: boolean; // Nuevo campo para indicar si aplica asignación familiar
    familyDependents: number; // Campo para cargas familiares
    familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D'; // Nuevo campo para el tramo seleccionado
    bonosFijos?: Bono[];
    mobilization?: number;
    collation?: number;
    createdAt: any; // Opcional: firebase.firestore.Timestamp
};

export type Bono = {
    glosa: string;
    monto: number;
    tipo: 'fijo' | 'variable';
}

export type Payroll = {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    period: string; // Ejemplo: "2024-07"
    year: number;
    month: number;
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
    iut: number; // Impuesto Único de Segunda Categoría
    familyAllowance: number; // Nuevo campo para Asignación Familiar
    advances: number;
    totalDiscounts: number;
    netSalary: number;
    createdAt: any; // Opcional: firebase.firestore.Timestamp
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
    date: any; // Opcional: firebase.firestore.Timestamp
    description: string;
    type: 'Ingreso' | 'Egreso' | 'Traspaso';
    status: 'Borrador' | 'Contabilizado' | 'Anulado';
    total: number;
    entries: VoucherEntry[];
    createdAt: any; // Opcional: firebase.firestore.Timestamp
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
    mandatoryContribution: number; // Tasa de cotización obligatoria
    previredCode: string;
    provisionalRegime: string;
    dtCode: string;
    employerContribution: number; // Tasa SIS
};

export type HealthEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number; // 7%
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
    afpCap: number; // UF
    afcCap: number; // UF
};