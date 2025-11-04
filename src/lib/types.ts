// src/lib/types.ts

import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  role: 'Admin' | 'Accountant';
  companyIds: { [key: string]: boolean };
  displayName?: string;
  photoURL?: string;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
  plan?: string;
}

export interface Company {
  id: string;
  name: string;
  rut: string;
  ownerId: string;
  periodStartDate?: string; 
  periodEndDate?: string;
  address?: string;
  commune?: string;
  city?: string;
  region?: string;
  mutual?: string;
  compensationFund?: string;
}

export interface Bono {
  glosa: string;
  monto: number;
}

export interface Account {
    id: string;
    code: number;
    name: string;
    type: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Costo' | 'Gasto';
    category: string;
    isAuxiliary: boolean;
    parentAccountId?: string;
    companyId: string;
}

export interface Voucher {
    id: string;
    companyId: string;
    date: string;
    type: 'Ingreso' | 'Egreso' | 'Traspaso';
    description: string;
    entries: VoucherEntry[];
    isCentralization?: boolean;
}

export interface VoucherEntry {
    accountId: string;
    debit: number;
    credit: number;
}

export interface Subject {
    id: string;
    companyId: string;
    rut: string;
    name: string;
    address: string;
    commune: string;
    city: string;
    region: string;
    phone?: string;
    email?: string;
    type: 'Cliente' | 'Proveedor';
}

export interface CostCenter {
    id: string;
    companyId: string;
    name: string;
    description?: string;
}

export interface Employee {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    rut: string;
    nationality: string;
    birthDate: Timestamp;
    gender: 'Masculino' | 'Femenino' | 'Otro';
    address: string;
    commune: string;
    city: string;
    phone: string;
    email: string;
    maritalStatus: 'Soltero(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viudo(a)';
    emergencyContactName: string;
    emergencyContactPhone: string;
    
    position: string;
    contractType: 'Indefinido' | 'Plazo Fijo' | 'Por Obra o Faena';
    contractStartDate: Timestamp;
    contractEndDate?: Timestamp;
    weeklyHours: number;
    workday: 'Completa' | 'Parcial';
    costCenterId?: string;
    
    baseSalary: number;
    bonosFijos?: Bono[];
    collation: number;
    mobilization: number;
    gratificationType: 'Sin Gratificación' | 'Tope Legal' | 'Automatico';
    
    afp: string;
    healthSystem: 'Fonasa' | 'Isapre';
    healthContributionType?: 'Porcentaje' | 'Monto Fijo';
    healthContributionValue?: number;
    hasUnemploymentInsurance: boolean;
    unemploymentInsuranceType?: 'Indefinido' | 'Plazo Fijo';

    // Restored Fields
    hasFamilyAllowance?: boolean;
    familyDependents?: number;
    familyAllowanceBracket?: 'A' | 'B' | 'C' | 'D';
    apvInstitution?: string;
    apvAmount?: number;
    apvRegime?: 'A' | 'B';

    // Payment Details
    paymentMethod?: 'Transferencia Bancaria' | 'Cheque' | 'Efectivo';
    bank?: string;
    accountType?: 'Cuenta Corriente' | 'Cuenta Vista' | 'Cuenta de Ahorro';
    accountNumber?: string;

    status: 'Active' | 'Inactive';
}

export interface Payroll {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    year: number;
    month: number;
    period: string;

    baseSalary: number;
    sueldoBaseProporcional?: number;
    gratification?: number;
    
    bonos?: (Bono & { tipo: 'fijo' | 'variable' })[]; 
    
    overtimeHours50?: number;
    overtimeHours100?: number;
    otherTaxableEarnings?: number;
    taxableEarnings?: number;
    nonTaxableEarnings?: number;
    totalEarnings?: number;
    
    afpDiscount?: number;
    healthDiscount?: number;
    unemploymentInsuranceDiscount?: number;
    iut?: number;
    iutFactor?: number;
    iutRebajaInCLP?: number;
    advances?: number;
    otherDiscounts?: number;
    totalDiscounts?: number;
    
    netSalary?: number;
    absentDays?: number;
}

export interface AfpEntity {
    id: string;
    name: string;
    mandatoryContribution: number;
    sisContribution: number;
    year: number;
    month: number;
}

export interface HealthEntity {
    id: string;
    name: string;
}

export interface EconomicIndicator {
    id: string; // YYYY-MM
    uf: number;
    utm: number;
    minWage: number;
    cpi?: number;
}

export interface TaxableCap {
    id: string;
    year: number;
    afpCap: number; // In UF
    afcCap: number; // In UF
}

export interface SelectedCompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company) => void;
}

export interface LegalDocument {
    id: string;
    companyId: string;
    employeeId: string;
    templateSlug: string;
    formData: any;
    lastSaved: Timestamp;
}
