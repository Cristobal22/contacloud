'use server';
/**
 * @fileOverview Flow de Genkit para crear un comprobante contable desde un prompt.
 * 
 * - createVoucherFromPrompt - La función principal que invoca el flow.
 * - CreateVoucherFromPromptInput - El tipo de entrada para el flow.
 * - CreateVoucherFromPromptOutput - El tipo de salida para el flow.
 */
import { ai } from '@/ai/genkit';
import type { Account, Company, VoucherEntry } from '@/lib/types';
import { z } from 'genkit';


const VoucherEntrySchema = z.object({
    account: z.string().describe('El código de la cuenta contable a utilizar. Debe existir en el plan de cuentas proporcionado.'),
    description: z.string().describe('Una descripción para el asiento contable.'),
    debit: z.number().describe('El monto en el Debe. Si es un crédito, este valor debe ser 0.'),
    credit: z.number().describe('El monto en el Haber. Si es un débito, este valor debe ser 0.'),
});

export const CreateVoucherFromPromptInputSchema = z.object({
  prompt: z.string().describe('La descripción en lenguaje natural de la transacción a contabilizar.'),
  chartOfAccounts: z.array(z.any()).describe('El plan de cuentas completo de la empresa. Úsalo como referencia para seleccionar las cuentas correctas.'),
  companySettings: z.any().describe('La configuración de la empresa, que puede contener cuentas por defecto para ciertas operaciones (IVA, facturas por pagar, etc.).'),
});

export const CreateVoucherFromPromptOutputSchema = z.object({
    description: z.string().describe('Una descripción general y concisa para el comprobante, basada en el prompt del usuario.'),
    entries: z.array(VoucherEntrySchema).describe('Un array de asientos contables que representan la transacción. El total del Debe debe ser igual al total del Haber.'),
});


export type CreateVoucherFromPromptInput = z.infer<typeof CreateVoucherFromPromptInputSchema>;
export type CreateVoucherFromPromptOutput = z.infer<typeof CreateVoucherFromPromptOutputSchema>;


export async function createVoucherFromPrompt(input: CreateVoucherFromPromptInput): Promise<CreateVoucherFromPromptOutput> {
    return createVoucherFlow(input);
}

const creationPrompt = ai.definePrompt({
    name: 'createVoucherPrompt',
    input: { schema: CreateVoucherFromPromptInputSchema },
    output: { schema: CreateVoucherFromPromptOutputSchema },
    prompt: `Eres un asistente experto en contabilidad para Chile. Tu tarea es analizar la descripción de una transacción y generar un comprobante contable balanceado (total Debe = total Haber) utilizando el plan de cuentas proporcionado.

Contexto:
1.  **Transacción del Usuario**: {{{prompt}}}
2.  **Plan de Cuentas Disponible**: {{{json chartOfAccounts}}}
3.  **Configuración de Cuentas por Defecto de la Empresa**: {{{json companySettings}}}

Instrucciones:
1.  **Analiza el Prompt**: Identifica la naturaleza de la transacción (compra, venta, pago, etc.), los montos involucrados y las posibles cuentas afectadas.
2.  **Calcula el IVA**: Si la transacción corresponde a una compra o venta afecta a IVA (19% en Chile), calcula el valor neto y el IVA por separado. Usa las cuentas de IVA definidas en la configuración de la empresa (ej. \`purchasesVatAccount\` para compras, \`salesVatAccount\` para ventas). Si no se especifica una cuenta de IVA, busca una apropiada en el plan de cuentas.
3.  **Selecciona las Cuentas Correctas**: Basado en el análisis, elige las cuentas contables más adecuadas del "Plan de Cuentas Disponible". Presta especial atención a las cuentas por defecto definidas en "Configuración de Cuentas por Defecto de la Empresa" (ej. para facturas por pagar, IVA, etc.).
4.  **Genera los Asientos**: Crea los asientos contables correspondientes en la propiedad \`entries\`.
    *   Cada asiento debe tener \`account\`, \`description\`, \`debit\`, y \`credit\`.
    *   Asegúrate de que el comprobante esté **cuadrado**: la suma de todos los débitos debe ser exactamente igual a la suma de todos los créditos.
5.  **Crea una Descripción Global**: Genera una descripción clara y concisa para el comprobante general en la propiedad \`description\`.

Ejemplo de Razonamiento:
Si el usuario dice "Compra de mercadería por $119.000 con factura", tu razonamiento sería:
- Es una compra con factura, probablemente afecta a IVA.
- Total: $119.000. IVA (19%): $19.000. Neto: $100.000.
- Asiento 1 (Debe): Aumenta el inventario (Activo). Busco una cuenta como "Mercadería". Debe = $100.000.
- Asiento 2 (Debe): Aumenta el crédito fiscal (Activo). Busco la cuenta de IVA Compras (ej. '123001'). Debe = $19.000.
- Asiento 3 (Haber): Aumenta la deuda con el proveedor (Pasivo). Busco la cuenta de Facturas por Pagar (ej. '201001'). Haber = $119.000.
- Total Debe ($100.000 + $19.000) = Total Haber ($119.000). El comprobante está cuadrado.

Responde únicamente con el objeto JSON que se adhiere al esquema de salida.
`,
});

const createVoucherFlow = ai.defineFlow(
    {
        name: 'createVoucherFlow',
        inputSchema: CreateVoucherFromPromptInputSchema,
        outputSchema: CreateVoucherFromPromptOutputSchema,
    },
    async (input) => {
        const { output } = await creationPrompt(input);
        if (!output) {
            throw new Error("La IA no pudo generar un comprobante válido.");
        }
        return output;
    }
);
