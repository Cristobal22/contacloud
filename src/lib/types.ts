
import { z } from 'zod';

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional().nullable(),
  photoURL: z.string().optional().nullable(),
  role: z.enum(['Admin', 'Accountant']),
  plan: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
  companyIds: z.union([z.array(z.string()), z.record(z.boolean())]).optional(),
  createdBy: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export type TaxAccountMapping = {
  taxCode: string;
  name: string;
  accountCode: string;
};

export type Company = {
  id: string;
  name: string;
  rut: string;
  address: string;
  giro: string;
  active: boolean;
  ownerId: string;
  isDistributor?: boolean;
  startYear?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  lastClosedDate?: string;
  profitAccount?: string;
  lossAccount?: string;
  salesInvoicesReceivableAccount?: string;
  salesNotesReceivableAccount?: string;
  salesVatAccount?: string;
  salesOtherTaxesAccounts?: TaxAccountMapping[];
  proportionalVat?: boolean;
  purchasesInvoicesPayableAccount?: string;
  purchasesNotesPayableAccount?: string;
  purchasesVatAccount?: string;
  vatRemanentAccount?: string;
  purchasesOtherTaxesAccounts?: TaxAccountMapping[];
  feesExpenseAccount?: string;
  feesPayableAccount?: string;
  feesWithholdingAccount?: string;
  incomeFeesReceivableAccount?: string;
  incomeFeesWithholdingAccount?: string;
  remunerationExpenseAccount?: string;
  salariesPayableAccount?: string;
  afpPayableAccount?: string;
  healthPayableAccount?: string;
  unemploymentInsurancePayableAccount?: string;
  employerAfpContributionPayableAccount?: string;
};

export type Account = {
  id:string;
  code: string;
  name: string;
  type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto';
  balance: number;
  companyId: string;
};

export type AccountGroup = {
    id: string;
    name: string;
};

export type CostCenter = {
    id: string;
    name: string;
    description: string;
    companyId: string;
};

export type Employee = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  nationality?: string;
  address?: string;
  commune?: string;
  region?: string;
  phone?: string;
  email?: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  civilStatus: 'Soltero/a' | 'Casado/a' | 'Viudo/a' | 'Divorciado/a' | 'Conviviente Civil';
  jobTitle?: string;
  contractType?: 'Indefinido' | 'Plazo Fijo' | 'Por Obra o Faena';
  workdayType?: 'Completa' | 'Parcial';
  isHeavyWork?: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  unionized?: boolean;
  baseSalary?: number;
  gratificationType?: 'Automatico' | 'Manual' | 'Sin Gratificacion';
  gratification?: number;
  mobilization?: number;
  collation?: number;
  healthSystem?: string;
  healthContributionType?: 'Porcentaje' | 'Monto Fijo';
  healthContributionValue?: number;
  afp?: string;
  isPensioner?: boolean;
  unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo' | 'Más de 11 años';
  hasUnemploymentInsurance?: boolean;
  familyDependents?: number;
  hasFamilyAllowance?: boolean;
  familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D';
  apvInstitution?: string;
  apvAmount?: number;
  apvRegime?: 'A' | 'B';
  otherDiscounts?: { description: string; amount: number }[];
  paymentMethod?: 'Transferencia Bancaria' | 'Cheque' | 'Efectivo';
  bank?: string;
  accountType?: 'Cuenta Corriente' | 'Cuenta Vista' | 'Cuenta de Ahorro';
  accountNumber?: string;
  costCenterId?: string;
  status: 'Active' | 'Inactive';
  companyId: string;
};


export type Subject = {
  id: string;
  name: string;
  rut: string;
  type: 'Cliente' | 'Proveedor' | 'Otro';
  status: 'Active' | 'Inactive';
  companyId: string;
};

export type Voucher = {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso' | 'Traspaso';
  description: string;
  status: 'Borrador' | 'Contabilizado';
  total: number;
  entries: VoucherEntry[];
  companyId: string;
};

export type VoucherEntry = {
    id: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
};

export type OtherTax = {
  code: string;
  name: string;
  amount: number;
};

export type Purchase = {
  id: string;
  date: string;
  documentType: string;
  documentNumber: string;
  supplierRut: string;
  supplier: string;
  exemptAmount: number;
  netAmount: number;
  taxAmount: number;
  otherTaxes?: OtherTax[];
  total: number;
  status: 'Pendiente' | 'Contabilizado' | 'Pagado';
  assignedAccount?: string;
  voucherId?: string;
  paymentVoucherId?: string;
  companyId: string;
};


export type Sale = {
  id: string;
  date: string;
  documentType: string;
  documentNumber: string;
  customer: string;
  customerRut: string;
  exemptAmount: number;
  netAmount: number;
  taxAmount: number;
  otherTaxes?: OtherTax[];
  total: number;
  status: 'Pendiente' | 'Contabilizado' | 'Cobrado';
  companyId: string;
  isSummary?: boolean;
  voucherId?: string;
  collectionVoucherId?: string;
};

export type Honorarium = {
  id: string;
  companyId: string;
  date: string;
  documentNumber: string;
  issuerRut: string;
  issuerName: string;
  isProfessionalSociety: boolean;
  grossAmount: number;
  retentionAmount: number;
  netAmount: number;
  status: 'Vigente' | 'NULA';
  accountingPeriod: string;
  voucherId?: string;
};


export type Payroll = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  year: number;
  month: number;
  baseSalary: number;
  gratification: number;
  taxableEarnings: number;
  baseIndemnizacion: number;
  nonTaxableEarnings: number;
  otherTaxableEarnings: number;
  totalEarnings: number;
  afpDiscount: number;
  healthDiscount: number;
  unemploymentInsuranceDiscount: number;
  employerAfpContribution?: number;
  iut?: number;
  otherDiscounts: number;
  totalDiscounts: number;
  netSalary: number;
  companyId: string;
  iutFactor?: number;
  iutRebajaInCLP?: number;
  diasAusencia?: number;
  diasLicencia?: number;
  sueldoBaseProporcional?: number;
  horasExtra?: number;
  bonos?: number;
  anticipos?: number;
};


export type FamilyAllowanceParameter = {
    id: string;
    year: number;
    month: number;
    tramo: string;
    desde: number;
    hasta: number;
    monto: number;
};

export type TaxParameter = {
    id: string;
    tramo: string;
    desdeUTM: number;
    hastaUTM: number;
    factor: number;
    rebajaUTM: number;
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

export type AfpEntity = {
    id: string;
    year: number;
    month: number;
    name: string;
    mandatoryContribution: number;
    employerContribution?: number;
    previredCode: string;
    provisionalRegime: string;
    dtCode: string;
};

export type EconomicIndicator = {
    id: string; // YYYY-MM
    year: number;
    month: number;
    uf?: number;
    utm?: number;
    uta?: number;
    minWage?: number;
    gratificationCap?: number;
};

export type TaxableCap = {
    id: string; // YYYY
    year: number;
    afpCap: number;
    afcCap: number;
};

export type LegalDocument = {
    id: string;
    templateSlug: string;
    employeeId: string;
    lastSaved?: any;
};


export type SelectedCompanyContextType = {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
};
