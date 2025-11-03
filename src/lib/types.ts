
import { z } from 'zod';

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional().nullable(),
  photoURL: z.string().optional().nullable(),
  role: z.enum(['Admin', 'Accountant']),
  plan: z.string().optional(), // "Individual", "Team", "Enterprise"
  subscriptionEndDate: z.string().optional(), // The date until which the user's subscription is active.
  companyIds: z.array(z.string()).optional(),
  createdBy: z.string().optional(), // Added to track who created the user
});

export type UserProfile = z.infer<typeof UserProfileSchema>;


export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Accountant';
};

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
  // Contractual Data
  position?: string;
  contractType?: 'Indefinido' | 'Plazo Fijo' | 'Por Obra o Faena';
  workdayType?: 'Completa' | 'Parcial';
  isHeavyWork?: boolean; // Trabajo pesado
  contractStartDate?: string;
  contractEndDate?: string;
  unionized?: boolean; // Sindicalizado
  // Remuneration
  baseSalary?: number;
  gratificationType?: 'Automatico' | 'Manual' | 'Sin Gratificacion';
  gratification?: number;
  mobilization?: number;
  collation?: number;
  // Social Security
  healthSystem?: string;
  healthContributionType?: 'Porcentaje' | 'Monto Fijo';
  healthContributionValue?: number;
  afp?: string;
  isPensioner?: boolean;
  unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo' | 'Más de 11 años';
  hasUnemploymentInsurance?: boolean;
  // Family Allowances
  familyAllowancesNormal?: number; // Cargas normales
  familyAllowancesMaternal?: number; // Cargas maternales
  familyAllowancesInvalid?: number; // Cargas de invalidez
  // APV
  hasApvi?: boolean; // Tiene APV Individual
  apviInstitution?: string; // Institución APV
  apviContributionType?: 'Pesos' | 'UF';
  apviAmount?: number;
  hasApvc?: boolean; // Tiene APV Colectivo
  apvcInstitution?: string;
  apvcContributionType?: 'Pesos' | 'UF';
  apvcAmount?: number;
  // Other Discounts
  otherDiscounts?: { description: string; amount: number }[];
  // Payment Method
  paymentMethod?: 'Transferencia Bancaria' | 'Cheque' | 'Efectivo';
  bank?: string;
  accountType?: 'Cuenta Corriente' | 'Cuenta Vista' | 'Cuenta de Ahorro';
  accountNumber?: string;
  // Other
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
  assignedAccount?: string; // Cuenta de gasto/activo asignada
  voucherId?: string; // ID del comprobante de centralización
  paymentVoucherId?: string; // ID del comprobante de pago
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
  date: string; // Fecha de la boleta
  documentNumber: string; // Folio de la boleta
  issuerRut: string; // RUT del emisor
  issuerName: string; // Nombre del emisor
  isProfessionalSociety: boolean; // Soc. Prof.
  grossAmount: number; // Monto Bruto
  retentionAmount: number; // Monto Retenido
  netAmount: number; // Monto Pagado/Líquido
  status: 'Vigente' | 'NULA'; // Estado de la boleta
  accountingPeriod: string; // Ej: '2025-02'
  voucherId?: string; // ID del comprobante de centralización
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
  iut?: number; // Impuesto Único a los Trabajadores
  otherDiscounts: number;
  totalDiscounts: number;
  netSalary: number;
  companyId: string;
  iutFactor?: number;
  iutRebajaInCLP?: number;
  // --- Novedades del mes ---
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
    afpCap: number; // Tope para AFP, Salud y SIS en UF
    afcCap: number; // Tope para Seguro de Cesantía en UF
};

export type LegalDocument = {
    id: string;
    templateSlug: string;
    employeeId: string;
    lastSaved?: any; // Consider using a more specific type like firebase.firestore.Timestamp
};


export type SelectedCompanyContextType = {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
};
