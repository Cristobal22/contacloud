'use server';
/**
 * @fileOverview Server action to process the SII honorarium registry file (REC), save the documents, and generate the accounting centralization voucher.
 */
import { Honorarium, Voucher, Company } from '@/lib/types';
import { format, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { adminFirestore } from '@/firebase/admin';
import { z } from 'zod';

// --- Zod Schemas for Input Validation ---
const CompanyConfigSchema = z.object({
  id: z.string(),
  feesExpenseAccount: z.string(),
  feesWithholdingAccount: z.string(),
  feesPayableAccount: z.string(),
});

const AccountingPeriodSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number(),
});

const CentralizeFeesInputSchema = z.object({
  fileContent: z.string(), // Base64 encoded file content
  companyConfig: CompanyConfigSchema,
  accountingPeriod: AccountingPeriodSchema,
});

export type CentralizeFeesInput = z.infer<typeof CentralizeFeesInputSchema>;

// Helper to generate a simple unique ID from Firestore
const generateId = () => adminFirestore.collection('_').doc().id;

// --- Manual CSV Parser for SII REC File ---
function parseREC(content: string): Record<string, string>[] {
    const lines = content.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
    if (lines.length < 3) return [];

    const headerLine = lines[1];
    const headers = headerLine.split(';').map(h => h.replace(/"/g, '').trim());
    
    const dataLines = lines.slice(2);

    return dataLines.map(line => {
        const values = line.split(';').map(v => v.replace(/"/g, '').trim());
        const entry: Record<string, string> = {};
        headers.forEach((header, index) => {
            const key = header === 'Nº' ? 'N° Boleta' : header;
            entry[key] = values[index];
        });
        return entry;
    });
}

const parseCurrency = (value: string): number => {
  if (!value) return 0;
  return parseInt(value.replace(/\$|\./g, '').trim(), 10) || 0;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 10) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

/**
 * Processes the fee centralization request, validates input, parses the file, 
 * creates the voucher, and saves everything to Firestore.
 */
export async function centralizeFees(input: CentralizeFeesInput) {
    // 1. Validate Input
    const validation = CentralizeFeesInputSchema.safeParse(input);
    if (!validation.success) {
        console.error('Invalid input for centralizeFees:', validation.error.flatten());
        throw new Error('La información proporcionada es inválida.');
    }

    console.log('Starting fees centralization for company:', input.companyConfig.id);
    const { fileContent, companyConfig, accountingPeriod } = input;

    // 2. Decode and Parse File
    const decodedContent = Buffer.from(fileContent, 'base64').toString('latin1');
    const rows = parseREC(decodedContent);
      
    if (rows.length === 0) {
        throw new Error('El archivo no contiene datos o el formato es incorrecto. Asegúrate de usar el archivo REC del SII.');
    }

    // 3. Process Honorarios
    const allHonorarios = rows.map((row) => {
      const grossAmount = parseCurrency(row['Monto Bruto']);
      if (!row['N° Boleta'] || !row['Fecha'] || !row['RUT Emisor'] || grossAmount === 0) {
        return null;
      }
      
      const honorarium: Honorarium = {
        id: generateId(),
        companyId: companyConfig.id,
        date: formatDate(row['Fecha']),
        documentNumber: row['N° Boleta'].toString(),
        issuerRut: row['RUT Emisor'],
        issuerName: row['Nombre Emisor'],
        isProfessionalSociety: row['Soc. Prof.']?.toUpperCase() === 'SI',
        grossAmount,
        retentionAmount: parseCurrency(row['Monto Retenido']),
        netAmount: parseCurrency(row['Monto Líquido']),
        status: row['Estado'] === 'Anulada' ? 'NULA' : 'Vigente',
        accountingPeriod: `${accountingPeriod.year}-${String(accountingPeriod.month).padStart(2, '0')}`,
      };
      return honorarium;
    });
    
    const totalProcessed = allHonorarios.length;
    const validHonorarios = allHonorarios.filter((h): h is Honorarium => h !== null && h.status !== 'NULA');

    // 4. Create Centralization Voucher
    const totalGrossAmount = validHonorarios.reduce((sum, h) => sum + h.grossAmount, 0);
    const totalRetentionAmount = validHonorarios.reduce((sum, h) => sum + h.retentionAmount, 0);
    const totalNetAmount = validHonorarios.reduce((sum, h) => sum + h.netAmount, 0);

    const periodDate = new Date(accountingPeriod.year, accountingPeriod.month - 1);
    const lastDay = lastDayOfMonth(periodDate);
    const monthName = format(periodDate, 'MMMM', { locale: es });
    const voucherId = generateId();

    const centralizationVoucher: Voucher = {
      id: voucherId,
      date: format(lastDay, 'yyyy-MM-dd'),
      description: `Centralización Honorarios ${monthName} ${accountingPeriod.year}`,
      companyId: companyConfig.id,
      status: 'Borrador',
      type: 'Traspaso',
      total: totalGrossAmount,
      entries: [
        { id: generateId(), account: companyConfig.feesExpenseAccount, description: 'Gasto por Honorarios del período', debit: totalGrossAmount, credit: 0 },
        { id: generateId(), account: companyConfig.feesWithholdingAccount, description: 'Retención Impuesto Honorarios', debit: 0, credit: totalRetentionAmount },
        { id: generateId(), account: companyConfig.feesPayableAccount, description: 'Honorarios por Pagar', debit: 0, credit: totalNetAmount },
      ],
    };
    
    validHonorarios.forEach(h => { h.voucherId = voucherId; });

    // 5. Save to Firestore
    try {
        const batch = adminFirestore.batch();

        const voucherRef = adminFirestore.collection(`companies/${companyConfig.id}/vouchers`).doc(centralizationVoucher.id!);
        batch.set(voucherRef, centralizationVoucher);

        processedHonorarios.forEach(honorarium => {
            const honorariumRef = adminFirestore.collection(`companies/${companyConfig.id}/honorarios`).doc(honorarium.id);
            batch.set(honorariumRef, honorarium);
        });

        await batch.commit();
        console.log(`Successfully saved ${processedHonorarios.length} honorarios and 1 voucher to Firestore.`);

    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        throw new Error('Ocurrió un error al guardar los datos en la base de datos.');
    }

    // 6. Return Summary
    const summary = {
      totalProcessed: totalProcessed,
      totalValid: validHonorarios.length,
      totalInvalid: totalProcessed - validHonorarios.length,
      voucherId: voucherId,
    };

    console.log('Fees centralization process completed successfully.');
    return {
      summary,
      processedHonorarios: validHonorarios
    };
}
