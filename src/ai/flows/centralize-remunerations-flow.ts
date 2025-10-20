
'use server';
/**
 * @fileOverview A flow to generate the accounting voucher for payroll centralization.
 */

import { ai } from '@/ai/genkit';
import { format, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CentralizeRemunerationsInputSchema,
    CentralizeRemunerationsOutputSchema,
    type CentralizeRemunerationsInput,
    type CentralizeRemunerationsOutput
} from './schemas';


export async function centralizeRemunerations(input: CentralizeRemunerationsInput): Promise<CentralizeRemunerationsOutput> {
  return centralizeRemunerationsFlow(input);
}


const centralizeRemunerationsPrompt = ai.definePrompt({
  name: 'centralizeRemunerationsPrompt',
  input: { schema: CentralizeRemunerationsInputSchema },
  output: { schema: CentralizeRemunerationsOutputSchema },
  prompt: `Eres un contador experto en la legislación laboral y tributaria chilena. Tu tarea es generar el comprobante contable de centralización de remuneraciones.

Recibirás un resumen de la nómina, el plan de cuentas de la empresa y la configuración de cuentas por defecto para remuneraciones. Debes generar UN comprobante contable de tipo "Traspaso" en estado "Borrador".

La fecha del comprobante debe ser el último día del mes y año proporcionados.

El asiento contable debe seguir esta estructura:

- DEBE:
  - El Gasto en Sueldos (total sueldo base) debe ir a una cuenta de resultado pérdida. Utiliza la cuenta definida en 'remunerationExpenseAccount' si está disponible. Si no, busca la cuenta más apropiada como 'Sueldos y Salarios' en el plan de cuentas.

- HABER:
  - El total de descuentos de AFP debe ir a la cuenta de pasivo definida en 'afpPayableAccount'.
  - El total de descuentos de Salud debe ir a la cuenta de pasivo definida en 'healthPayableAccount'.
  - El total de descuentos del Seguro de Cesantía debe ir a la cuenta de pasivo definida en 'unemploymentInsurancePayableAccount'.
  - El sueldo líquido total por pagar debe ir a la cuenta de pasivo definida en 'salariesPayableAccount'.

Asegúrate de que el comprobante esté perfectamente balanceado (Total Debe = Total Haber). Cada línea del asiento debe tener una descripción clara.

DATOS:
- Período: Mes {{period.month}}, Año {{period.year}}
- Resumen Nómina: {{{JSON.stringify payrollSummary}}}
- Plan de Cuentas: {{{JSON.stringify accounts}}}
- Configuración de la Empresa: {{{JSON.stringify companyConfig}}}
`,
});

const centralizeRemunerationsFlow = ai.defineFlow(
  {
    name: 'centralizeRemunerationsFlow',
    inputSchema: CentralizeRemunerationsInputSchema,
    outputSchema: CentralizeRemunerationsOutputSchema,
  },
  async (input) => {
    const { output } = await centralizeRemunerationsPrompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    
    const periodDate = new Date(input.period.year, input.period.month - 1);
    const lastDay = lastDayOfMonth(periodDate);
    const monthName = format(periodDate, 'MMMM', { locale: es });
    
    const finalVoucher: CentralizeRemunerationsOutput = {
      ...output,
      date: format(lastDay, 'yyyy-MM-dd'),
      description: `Centralización Remuneraciones ${monthName} ${input.period.year}`,
      companyId: input.companyConfig.id,
      status: 'Borrador',
      type: 'Traspaso'
    };

    return finalVoucher;
  }
);
