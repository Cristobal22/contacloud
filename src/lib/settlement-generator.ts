
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generarTextoFiniquito } from '@/templates/finiquito';
import NumeroALetras from 'numero-a-letras';
import type { Company, Employee } from '@/lib/types';

// NOTE: This interface must be kept in sync with the form in finiquito/page.tsx
export interface FiniquitoFormData {
  nombreTrabajador: string;
  rutTrabajador: string;
  nombreEmpleador: string;
  rutEmpleador: string;
  fechaInicio: Date | undefined;
  fechaTermino: Date | undefined;
  causalTermino: string;
  baseIndemnizacion: number;
  anosServicio: number;
  diasFeriado: number;
  indemnizacionAnos: number;
  indemnizacionSustitutiva: number;
  feriadoLegal: number;
  totalHaberes: number;
  descuentosPrevisionales: number;
  otrosDescuentos: number;
  totalDescuentos: number;
  totalAPagar: number;
  // Added fields to match template
  incluyeMesAviso: boolean;
  remuneracionesPendientes: number;
  otrosHaberes: number;
  causalHechos: string;
  formaPago: string;
  fechaPago: Date | undefined;
  ciudadFirma: string;
  ministroDeFe: string;
}

// Helper to format numbers as CLP currency
const formatCurrency = (value: number = 0): string => {
  return new Intl.NumberFormat('es-CL').format(value);
};

// Helper to format dates into a long string format (e.g., "21 de junio de 2024")
const formatDateToLongString = (date: Date | undefined): string => {
  if (!date) return ''
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export async function generateSettlementPDF(
  formData: FiniquitoFormData,
  employee: Employee | null | undefined, 
  company: Company | null | undefined
): Promise<Uint8Array> {

  const totalEnPalabras = NumeroALetras(formData.totalAPagar);

  // Map form data to the template data structure, providing fallbacks
  const templateData = {
    empleador_nombre: company?.name || formData.nombreEmpleador,
    empleador_rut: company?.rut || formData.rutEmpleador,
    empleador_domicilio: company?.address || '',
    trabajador_nombre: employee ? `${employee.firstName} ${employee.lastName}` : formData.nombreTrabajador,
    trabajador_rut: employee?.rut || formData.rutTrabajador,
    trabajador_domicilio: employee?.address || '',
    trabajador_oficio: employee?.position || '',
    trabajador_fecha_inicio: formatDateToLongString(formData.fechaInicio),
    trabajador_fecha_termino: formatDateToLongString(formData.fechaTermino),
    trabajador_cargo: employee?.position || '',
    causal_articulo_y_nombre: formData.causalTermino,
    causal_hechos_fundamento: formData.causalHechos || 'Hechos no especificados.',
    monto_indemnizacion_anios_servicio: formatCurrency(formData.indemnizacionAnos),
    monto_indemnizacion_aviso_previo: formatCurrency(formData.indemnizacionSustitutiva),
    dias_feriado_proporcional: String(formData.diasFeriado),
    monto_feriado_proporcional: formatCurrency(formData.feriadoLegal),
    monto_remuneraciones_pendientes: formatCurrency(formData.remuneracionesPendientes),
    monto_otros_haberes: formatCurrency(formData.otrosHaberes),
    monto_total_numerico: formatCurrency(formData.totalAPagar),
    monto_total_en_palabras: totalEnPalabras,
    forma_pago: formData.formaPago || 'Transferencia Electrónica',
    fecha_pago: formatDateToLongString(formData.fechaPago) || formatDateToLongString(new Date()),
    fecha_documento_larga: `${formData.ciudadFirma || company?.commune || ''}, a ${formatDateToLongString(new Date())}`,
    ministro_de_fe: formData.ministroDeFe || 'Notario Público',
  };

  const fullText = generarTextoFiniquito(templateData as any);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const margin = 50;

  page.drawText(fullText, {
    x: margin,
    y: height - 40, // Start a bit lower
    font,
    size: fontSize,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: width - 2 * margin,
    lineHeight: 14,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
