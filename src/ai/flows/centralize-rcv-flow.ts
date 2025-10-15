'use server';
/**
 * @fileOverview A flow to centralize the RCV (Registro de Compras y Ventas) from SII.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import type { Account, Company, VoucherEntry } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Schemas
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


export async function centralizeRcv(input: CentralizeRcvInput): Promise<CentralizeRcvOutput> {
  return centralizeRcvFlow(input);
}


const centralizeRcvPrompt = ai.definePrompt({
  name: 'centralizeRcvPrompt',
  input: { schema: CentralizeRcvInputSchema },
  output: { schema: CentralizeRcvOutputSchema },
  prompt: `Eres un contador experto en la legislación tributaria chilena. Tu tarea es generar los asientos de centralización para el Registro de Compras y Ventas (RCV) de una empresa.

Recibirás un resumen del RCV, el plan de cuentas de la empresa y la configuración de cuentas por defecto. Debes generar DOS comprobantes contables de tipo "Traspaso" en estado "Borrador":
1. Uno para la centralización de las COMPRAS.
2. Uno para la centralización de las VENTAS.

La fecha de ambos comprobantes debe ser el último día del mes y año proporcionados.

Para la centralización de COMPRAS:
- El IVA Crédito Fiscal debe ir al Debe.
- El Neto de la compra debe ir a una cuenta de resultado (ej: Mercadería, Gastos Generales). Usa la primera cuenta de resultado que encuentres si no hay una específica.
- El Total debe ir al Haber, usando la cuenta de proveedores (facturas por pagar) definida en la configuración.

Para la centralización de VENTAS:
- El IVA Débito Fiscal debe ir al Haber.
- El Neto de la venta debe ir a una cuenta de resultado (ej: Ingresos por Ventas). Usa la primera cuenta de resultado que encuentres si no hay una específica.
- El Total debe ir al Debe, usando la cuenta de clientes (facturas por cobrar) definida en la configuración.

Asegúrate de que cada comprobante esté perfectamente balanceado (Debe = Haber).

DATOS:
- Período: Mes {{period.month}}, Año {{period.year}}
- Resumen RCV: {{{JSONstringify rcvSummary}}}
- Plan de Cuentas: {{{JSONstringify accounts}}}
- Configuración de la Empresa: {{{JSONstringify companyConfig}}}
`,
});

const centralizeRcvFlow = ai.defineFlow(
  {
    name: 'centralizeRcvFlow',
    inputSchema: CentralizeRcvInputSchema,
    outputSchema: CentralizeRcvOutputSchema,
  },
  async (input) => {
    const { output } = await centralizeRcvPrompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    
    // Set date to the last day of the month for both vouchers
    const lastDayOfMonth = new Date(input.period.year, input.period.month, 0).toISOString().substring(0, 10);
    const monthName = format(new Date(input.period.year, input.period.month -1), 'MMMM', { locale: es });
    
    const finalVouchers = output.map(voucher => {
      // Find the purchase or sale voucher based on description logic
      const isPurchase = voucher.description.toLowerCase().includes('compra');
      
      return {
        ...voucher,
        date: lastDayOfMonth,
        description: isPurchase ? `Centralización Compras ${monthName} ${input.period.year}` : `Centralización Ventas ${monthName} ${input.period.year}`,
        companyId: input.companyConfig.id,
      };
    });

    return finalVouchers;
  }
);
