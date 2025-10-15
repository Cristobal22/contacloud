
import { z } from 'zod';
import { UserProfileSchema } from '@/lib/types';

// Create User Schemas
export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const CreateUserOutputSchema = UserProfileSchema;
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;


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

const AccountSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    type: z.enum(['Activo', 'Pasivo', 'Patrimonio', 'Resultado']),
    balance: z.number(),
});

const CompanyConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    purchasesInvoicesPayableAccount: z.string().optional().describe('Cuenta para facturas por pagar (proveedores)'),
    purchasesVatAccount: z.string().optional().describe('Cuenta para IVA Crédito Fiscal'),
    salesInvoicesReceivableAccount: z.string().optional().describe('Cuenta para facturas por cobrar (clientes)'),
    salesVatAccount: z.string().optional().describe('Cuenta para IVA Débito Fiscal'),
});

const PeriodSchema = z.object({
  month: z.number(),
  year: z.number(),
});

export const CentralizeRcvInputSchema = z.object({
  rcvSummary: RcvSummarySchema,
  accounts: z.array(AccountSchema),
  companyConfig: CompanyConfigSchema,
  period: PeriodSchema,
});
export type CentralizeRcvInput = z.infer<typeof CentralizeRcvInputSchema>;


const VoucherEntrySchema = z.object({
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

export const CentralizeRcvOutputSchema = z.array(VoucherSchema);
export type CentralizeRcvOutput = z.infer<typeof CentralizeRcvOutputSchema>;
