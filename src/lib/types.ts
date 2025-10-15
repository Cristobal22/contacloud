

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
  name: string;
  rut: string;
  position: string;
  costCenter: string;
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


export type DashboardPageProps = {
    params: {};
    searchParams: { [key: string]: string | string[] | undefined };
};

export type SelectedCompanyContextType = {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
};
