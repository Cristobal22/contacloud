

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Accountant';
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  active: boolean;
  isDistributor?: boolean;
  startYear?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  profitAccount?: string;
  lossAccount?: string;
  salesInvoicesReceivableAccount?: string;
  salesNotesReceivableAccount?: string;
  salesVatAccount?: string;
  salesOtherTaxesAccount?: string;
  proportionalVat?: boolean;
  purchasesInvoicesPayableAccount?: string;
  purchasesNotesPayableAccount?: string;
  purchasesVatAccount?: string;
  purchasesOtherTaxesAccount?: string;
  feesPayableAccount?: string;
  feesWithholdingAccount?: string;
  incomeFeesReceivableAccount?: string;
  incomeFeesWithholdingAccount?: string;
};

export type Account = {
  id:string;
  code: string;
  name: string;
  type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Resultado';
  balance: number;
  companyId?: string;
};

export type AccountGroup = {
    id: string;
    name: string;
};

export type CostCenter = {
    id: string;
    name: string;
    description: string;
    companyId?: string;
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
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  civilStatus?: 'Soltero/a' | 'Casado/a' | 'Viudo/a' | 'Divorciado/a' | 'Conviviente Civil';
  contractType?: 'Indefinido' | 'Plazo Fijo' | 'Por Obra o Faena' | 'Part-Time' | 'Honorarios';
  position: string;
  contractStartDate?: string;
  contractEndDate?: string;
  baseSalary?: number;
  healthSystem?: 'Fonasa' | 'Consalud' | 'CruzBlanca' | 'Colmena' | 'Banmédica' | 'Vida Tres' | 'Nueva Masvida';
  afp?: 'Capital' | 'Cuprum' | 'Habitat' | 'Modelo' | 'Planvital' | 'Provida' | 'Uno';
  hasUnemploymentInsurance?: boolean;
  paymentMethod?: 'Transferencia Bancaria' | 'Cheque' | 'Efectivo';
  bank?: 'Banco de Chile' | 'Banco Internacional' | 'Scotiabank Chile' | 'BCI' | 'Banco Bice' | 'HSBC Bank (Chile)' | 'Banco Santander-Chile' | 'Itaú Corpbanca' | 'Banco Security' | 'Banco Falabella' | 'Banco Ripley' | 'Banco Consorcio' | 'Scotiabank Azul (Ex-BBVA)' | 'BancoEstado';
  accountType?: 'Cuenta Corriente' | 'Cuenta Vista' | 'Cuenta de Ahorro';
  accountNumber?: string;
  costCenter?: string;
  status: 'Active' | 'Inactive';
  companyId?: string;
};


export type Subject = {
  id: string;
  name: string;
  rut: string;
  type: 'Cliente' | 'Proveedor' | 'Otro';
  status: 'Active' | 'Inactive';
  companyId?: string;
};

export type Voucher = {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso' | 'Traspaso';
  description: string;
  status: 'Borrador' | 'Posteado';
  total: number;
  entries: VoucherEntry[];
  companyId?: string;
};

export type VoucherEntry = {
    id: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
};

export type Purchase = {
  id: string;
  date: string;
  documentNumber: string;
  supplier: string;
  total: number;
  status: 'Pendiente' | 'Pagada' | 'Vencida';
};

export type Sale = {
  id: string;
  date: string;
  documentNumber: string;
  customer: string;
  total: number;
  status: 'Pendiente' | 'Pagada' | 'Vencida';
};

export type Fee = {
  id: string;
  date: string;
  documentNumber: string;
  issuer: string;
  total: number;
  status: 'Pendiente' | 'Pagada' | 'Vencida';
};

export type Institution = {
    id: string;
    name: string;
    type: 'AFP' | 'Salud' | 'Mutual' | 'Caja de Compensación';
};

export type FamilyAllowanceParameter = {
    id: string;
    tramo: string;
    desde: number;
    hasta: number;
    monto: number;
};

export type TaxParameter = {
    id: string;
    tramo: string;
    desde: number;
    hasta: number;
    factor: number;
    rebaja: number;
};

export type HealthEntity = {
    id: string;
    code: string;
    name: string;
    mandatoryContribution: number;
    previredCode: string;
    dtCode: string;
};

export type AfpEntity = {
    id: string;
    code: string;
    name: string;
    mandatoryContribution: number;
    previredCode: string;
    provisionalRegime: string;
    dtCode: string;
};


export type DashboardPageProps = {
    params: {};
    searchParams: { [key: string]: string | string[] | undefined };
};

export type SelectedCompanyContextType = {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
};
