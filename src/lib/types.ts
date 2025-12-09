import { Timestamp } from 'firebase/firestore';

// --- Core Entities ---

export interface UserProfile {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  roles?: string[];
  onboarded?: boolean;
}

export interface Company {
  id: string;
  name: string;
  rut: string;
  ownerId: string;
  members?: string[];
  activity: string;
  address: string;
  commune: string;
  city: string;
  mutualName?: MutualEntityName;
  mutualContributionRate?: number;
  ccafName?: CcafEntityName;
  sisRatePercentage?: number;
  fullTimeWeeklyHours?: number;
}

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  rut: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  nationality: 'Chilena' | 'Extranjera';
  birthDate: Timestamp | Date | string;
  email: string;
  phoneNumber: string;
  address: string;
  commune: string;
  city: string;
  region: string;
  hireDate: Timestamp | Date | string;
  contractStartDate: Timestamp | Date | string;
  contractEndDate?: Timestamp | Date | string | null;
  regimenPrevisional?: RegimenPrevisional;
  afp?: AfpEntityName;
  hasUnemploymentInsurance?: boolean;
  healthSystem: HealthEntityName;
  contractType: ContractType;
  weeklyHours?: number;
  workdayType?: WorkdayType;
  position: string;
  salary: number;
  salaryType: 'Mensual' | 'Diario' | 'Por Hora';
  paymentMethod?: PaymentMethod;
  familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D';
  normalFamilyDependents?: number;
  invalidityFamilyDependents?: number;
  status: 'Active' | 'Inactive' | 'Pending';
  costCenter?: string;
  healthPlanAmount?: number;
  healthPlanType?: 'UF' | 'Pesos';
  healthContractNumber?: string;
  hasSubmittedSIL?: boolean;
  silFolio?: string;
  isPensioner?: boolean;
}

export interface Payroll {
  id: string;
  companyId: string;
  employeeId: string;
  month: number;
  year: number;
  workedDays: number;
  leaveDays: number;
  taxableEarnings: number;
  nonTaxableEarnings: number;
  totalEarnings: number;
  totalDiscounts: number;
  netPay: number;
  earnings: EarningItem[];
  discounts: DiscountItem[];
  employerContributions: EmployerContributionItem[];
  taxableHealth: number;
  taxableUnemploymentInsurance: number;
  employerUnemploymentInsurance?: number;
  retroactiveFamilyAllowance?: number;
  fonasaVoluntaryContribution?: number;
  gesContribution?: number;
  ccafLeasingDiscount?: number;
  ccafLifeInsuranceDiscount?: number;
  ccafOtherDiscounts?: number;
}

export interface MonthlyParameters {
  id?: string; // Format: 'YYYY-MM'
  year: number;
  month: number;
  ufValue: number;
  afpTopableIncomeUF: number;
  unemploymentTopableIncomeUF: number;
}

// --- Document & VAT Proportionality Types ---

export type SaleIvaClassification = 'Afecta' | 'Exenta';
export type PurchaseIvaClassification = 'Recuperable' | 'No Recuperable' | 'Uso Común';

export interface Sale {
    id: string;
    companyId: string;
    documentType: number; // 33: Factura Afecta, 34: Factura Exenta, 39: Boleta, etc.
    documentNumber: number;
    issueDate: Timestamp | Date | string;
    clientRut: string;
    clientName: string;
    netAmount: number;
    taxAmount: number;
    totalAmount: number;
    ivaClassification: SaleIvaClassification;
}

export interface Purchase {
    id: string;
    companyId: string;
    documentType: number;
    documentNumber: number;
    issueDate: Timestamp | Date | string;
    providerRut: string;
    providerName: string;
    netAmount: number;
    taxAmount: number;
    totalAmount: number;
    ivaClassification: PurchaseIvaClassification;
}


// --- Utility and Detail Types ---

export interface PayrollDraft extends Partial<Payroll> {}

export interface EarningItem {
  name: string;
  amount: number;
  isTaxable: boolean;
}

export interface DiscountItem {
  name: string;
  amount: number;
}

export interface EmployerContributionItem {
  name: string;
  amount: number;
}

export type RegimenPrevisional = 'AFP' | 'INP';

export type PaymentMethod = 'Efectivo' | 'Depósito en Cta. Cte./Vista' | 'Vale Vista' | 'Cheque';

export type AfpEntityName =
  | 'CAPITAL'
  | 'CUPRUM'
  | 'HABITAT'
  | 'MODELO'
  | 'PLANVITAL'
  | 'PROVIDA'
  | 'UNO'
  | 'OTRA';

export type HealthEntityName =
  | 'FONASA'
  | 'BANMEDICA'
  | 'COLMENA'
  | 'CONSALUD'
  | 'CRUZBLANCA'
  | 'NUEVA MASVIDA'
  | 'VIDA TRES'
  | 'ESENCIAL'
  | 'OTRA';

export type MutualEntityName = 'ACHS' | 'Mutual de Seguridad' | 'IST';

export type CcafEntityName = 'Los Andes' | 'La Araucana' | 'Caja 18 de Septiembre' | 'Los Héroes';

export type WorkdayType = 'Completa' | 'Parcial' | 'Sin Jornada';

export type ContractType = 'Indefinido' | 'Plazo Fijo' | 'Por Obra o Faena';
