

import { z } from 'zod';

// Helper Schemas
const AccountSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    type: z.enum(['Activo', 'Pasivo', 'Patrimonio', 'Resultado']),
    balance: z.number(),
});

const PeriodSchema = z.object({
  month: z.number(),
  year: z.number(),
});

const VoucherEntrySchema = z.object({
    id: z.string().optional(),
    account: z.string().describe("El código de la cuenta contable a utilizar."),
    description: z.string().describe("La descripción para el asiento contable."),
    debit: z.number().describe("El monto para el Debe."),
    credit: z.number().describe("El monto para el Haber."),
});

const VoucherSchema = z.object({
    date: z.string(),
    type: z.enum(['Ingreso', 'Egreso', 'Traspaso']),
    description: z.string(),
    status: z.enum(['Borrador', 'Contabilizado']),
    total: z.number(),
    entries: z.array(VoucherEntrySchema),
    companyId: z.string(),
});

// Centralize RCV Schemas
const RcvSummarySchema = z.object({
  purchases: z.object({
    netAmount: z.number(),
    taxAmount: z.number(),
    totalAmount: z.number(),
  }),
  sales: z.object({
    netAmount: z.number(),
    taxAmount: z.number(),
    totalAmount: z.number(),
  }),
});

const CompanyConfigRcvSchema = z.object({
    id: z.string(),
    name: z.string(),
    purchasesInvoicesPayableAccount: z.string().optional().describe('Cuenta para facturas por pagar (proveedores)'),
    purchasesVatAccount: z.string().optional().describe('Cuenta para IVA Crédito Fiscal'),
    salesInvoicesReceivableAccount: z.string().optional().describe('Cuenta para facturas por cobrar (clientes)'),
    salesVatAccount: z.string().optional().describe('Cuenta para IVA Débito Fiscal'),
});

export const CentralizeRcvInputSchema = z.object({
  rcvSummary: RcvSummarySchema,
  accounts: z.array(AccountSchema),
  companyConfig: CompanyConfigRcvSchema,
  period: PeriodSchema,
});
export type CentralizeRcvInput = z.infer<typeof CentralizeRcvInputSchema>;

export const CentralizeRcvOutputSchema = z.array(VoucherSchema);
export type CentralizeRcvOutput = z.infer<typeof CentralizeRcvOutputSchema>;


// Centralize Remunerations Schemas
const PayrollSummarySchema = z.object({
    totalBaseSalary: z.number().describe("Suma total de sueldos base."),
    totalAfpDiscount: z.number().describe("Suma total de descuentos de AFP."),
    totalHealthDiscount: z.number().describe("Suma total de descuentos de salud."),
    totalUnemploymentInsuranceDiscount: z.number().describe("Suma total de descuentos de seguro de cesantía."),
    totalNetSalary: z.number().describe("Suma total de sueldos líquidos a pagar."),
});

const CompanyConfigRemunerationsSchema = z.object({
    id: z.string(),
    name: z.string(),
    remunerationExpenseAccount: z.string().optional().describe('Cuenta de gasto para sueldos.'),
    salariesPayableAccount: z.string().optional().describe('Cuenta de pasivo para sueldos por pagar.'),
    afpPayableAccount: z.string().optional().describe('Cuenta de pasivo para AFP por pagar.'),
    healthPayableAccount: z.string().optional().describe('Cuenta de pasivo para salud (Fonasa/Isapre) por pagar.'),
    unemploymentInsurancePayableAccount: z.string().optional().describe('Cuenta de pasivo para seguro de cesantía por pagar.'),
});

export const CentralizeRemunerationsInputSchema = z.object({
    payrollSummary: PayrollSummarySchema,
    accounts: z.array(AccountSchema),
    companyConfig: CompanyConfigRemunerationsSchema,
    period: PeriodSchema,
});
export type CentralizeRemunerationsInput = z.infer<typeof CentralizeRemunerationsInputSchema>;

export const CentralizeRemunerationsOutputSchema = VoucherSchema;
export type CentralizeRemunerationsOutput = z.infer<typeof CentralizeRemunerationsOutputSchema>;
