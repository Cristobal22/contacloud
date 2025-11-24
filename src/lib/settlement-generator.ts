
import { PDFDocument, rgb, StandardFonts, PDFFont, PageSizes, PDFPage } from 'pdf-lib';
import { generarContenidoFiniquito, FiniquitoData } from '@/templates/finiquito';
import { numeroAFrase } from '@/lib/number-to-words';

// --- Interfaces and Helpers ---
export interface FiniquitoFormData {
    nombreTrabajador: string; rutTrabajador: string; domicilioTrabajador: string; cargoTrabajador: string; oficioTrabajador: string; nombreEmpleador: string; rutEmpleador: string; domicilioEmpleador: string; fechaInicio: Date | undefined; fechaTermino: Date | undefined; causalTermino: string; baseIndemnizacion: number; anosServicio: number; diasFeriado: number; incluyeMesAviso: boolean; causalHechos: string; remuneracionesPendientes: number; otrosHaberes: number; descuentosPrevisionales: number; otrosDescuentos: number; formaPago: string; fechaPago: Date | undefined; ciudadFirma: string; ministroDeFe: string; indemnizacionAnos: number; indemnizacionSustitutiva: number; feriadoLegal: number; totalHaberes: number; totalDescuentos: number; totalAPagar: number;
}
const formatCurrency = (value: number = 0): string => new Intl.NumberFormat('es-CL').format(Math.round(value));
const formatDateToLongString = (date: Date | undefined): string => {
    if (!date) return '';
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
};

// --- ROBUST, MULTI-PAGE AWARE PDF DRAWING ENGINE ---

type Fonts = { normal: PDFFont; bold: PDFFont };
type RenderContext = {
    pdfDoc: PDFDocument;
    currentPage: PDFPage;
    cursor: { y: number };
    width: number;
    height: number;
    margin: number;
    contentWidth: number;
    fonts: Fonts;
    colors: { text: any; light: any; };
};

const createRenderContext = async (pdfDoc: PDFDocument): Promise<RenderContext> => {
    const page = pdfDoc.addPage(PageSizes.Letter);
    const { width, height } = page.getSize();
    const margin = 50;
    return {
        pdfDoc,
        currentPage: page,
        cursor: { y: height - margin },
        width,
        height,
        margin,
        contentWidth: width - 2 * margin,
        fonts: {
            normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
            bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        },
        colors: { text: rgb(0.1, 0.1, 0.1), light: rgb(0.5, 0.5, 0.5) },
    };
};

const ensureSpace = (ctx: RenderContext, requiredHeight: number) => {
    if (ctx.cursor.y - requiredHeight < ctx.margin) {
        ctx.currentPage = ctx.pdfDoc.addPage(PageSizes.Letter);
        ctx.cursor.y = ctx.height - ctx.margin;
    }
};

const getRichTextHeight = (text: string, size: number, font: PDFFont, boldFont: PDFFont, maxWidth: number, lineHeight: number): number => {
    if (!text) return 0;
    const lines: any[] = [];
    text.split('\n').forEach(lineText => {
        let currentLine = '';
        const words = lineText.split(' ');
        for (const word of words) {
            const wordWithSpace = currentLine === '' ? word : `${currentLine} ${word}`;
            const isBold = word.startsWith('**');
            const currentFont = isBold ? boldFont : font;
            const width = currentFont.widthOfTextAtSize(wordWithSpace, size);
            if (width > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = wordWithSpace;
            }
        }
        lines.push(currentLine);
    });
    return lines.length * lineHeight;
};


const drawRichText = (ctx: RenderContext, text: string, options: { size: number; lineHeight: number; color?: any }) => {
    if (!text) return;
    const { size, lineHeight, color = ctx.colors.text } = options;
    const height = getRichTextHeight(text, size, ctx.fonts.normal, ctx.fonts.bold, ctx.contentWidth, lineHeight);
    ensureSpace(ctx, height);

    const parts = text.split(/(\*\*.*?\*\*)|(\n)/g).filter(p => p);
    let x = ctx.margin;
    for (const part of parts) {
        if (part === '\n') {
            x = ctx.margin;
            ctx.cursor.y -= lineHeight;
            continue;
        }
        const isBold = part.startsWith('**') && part.endsWith('**');
        const content = isBold ? part.slice(2, -2) : part;
        const font = isBold ? ctx.fonts.bold : ctx.fonts.normal;
        const words = content.split(' ');
        for (const word of words) {
            const wordWidth = font.widthOfTextAtSize(word, size);
            if (x > ctx.margin && x + wordWidth > ctx.width - ctx.margin) {
                x = ctx.margin;
                ctx.cursor.y -= lineHeight;
            }
            ctx.currentPage.drawText(word, { x, y: ctx.cursor.y, font, size, color });
            x += font.widthOfTextAtSize(word + ' ', size);
        }
    }
    ctx.cursor.y -= lineHeight;
};


export async function generateSettlementPDF(formData: FiniquitoFormData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const ctx = await createRenderContext(pdfDoc);

    const totalEnPalabras = numeroAFrase(formData.totalAPagar);
    const templateData: FiniquitoData = {
        empleador_nombre: formData.nombreEmpleador,
        empleador_rut: formData.rutEmpleador,
        empleador_domicilio: formData.domicilioEmpleador,
        trabajador_nombre: formData.nombreTrabajador,
        trabajador_rut: formData.rutTrabajador,
        trabajador_domicilio: formData.domicilioTrabajador,
        trabajador_oficio: formData.oficioTrabajador,
        trabajador_cargo: formData.cargoTrabajador,
        trabajador_fecha_inicio: formatDateToLongString(formData.fechaInicio),
        trabajador_fecha_termino: formatDateToLongString(formData.fechaTermino),
        causal_articulo_y_nombre: formData.causalTermino,
        causal_hechos_fundamento: formData.causalHechos || 'Hechos no especificados.',
        monto_indemnizacion_anios_servicio: formatCurrency(formData.indemnizacionAnos),
        monto_indemnizacion_aviso_previo: formatCurrency(formData.indemnizacionSustitutiva),
        dias_feriado_proporcional: (formData.diasFeriado || 0).toFixed(2),
        monto_feriado_proporcional: formatCurrency(formData.feriadoLegal),
        monto_remuneraciones_pendientes: formatCurrency(formData.remuneracionesPendientes),
        monto_otros_haberes: formatCurrency(formData.otrosHaberes),
        monto_total_haberes: formatCurrency(formData.totalHaberes),
        monto_descuento_previsional: formatCurrency(formData.descuentosPrevisionales),
        monto_otros_descuentos: formatCurrency(formData.otrosDescuentos),
        monto_total_descuentos: formatCurrency(formData.totalDescuentos),
        monto_total_numerico: formatCurrency(formData.totalAPagar),
        monto_total_en_palabras: totalEnPalabras,
        forma_pago: formData.formaPago,
        fecha_pago: formatDateToLongString(formData.fechaPago || new Date()),
        ciudadFirma: formData.ciudadFirma,
        ministro_de_fe: formData.ministroDeFe,
    };
    const content = generarContenidoFiniquito(templateData);

    // --- Draw Document Content ---
    ensureSpace(ctx, 30);
    const titleWidth = ctx.fonts.bold.widthOfTextAtSize(content.title, 14);
    ctx.currentPage.drawText(content.title, { x: (ctx.width - titleWidth) / 2, y: ctx.cursor.y, font: ctx.fonts.bold, size: 14 });
    ctx.cursor.y -= 30;

    ctx.cursor.y -= 15;
    drawRichText(ctx, content.comparecencia, { size: 10, lineHeight: 15 });

    for (const clausula of content.clausulas) {
        ctx.cursor.y -= 20;
        ensureSpace(ctx, 50); // Title + one line of content
        ctx.currentPage.drawText(clausula.titulo, { x: ctx.margin, y: ctx.cursor.y, font: ctx.fonts.bold, size: 11 });
        ctx.cursor.y -= 22;

        drawRichText(ctx, clausula.contenido, { size: 10, lineHeight: 15 });

        if (clausula.titulo.includes('LIQUIDACIÓN')) {
            ctx.cursor.y -= 15;
            drawLiquidationTable(ctx, content.liquidacion);
        }
    }

    ctx.cursor.y -= 20;
    drawSignatures(ctx, content.firmas);

    return await pdfDoc.save();
}

function drawLiquidationTable(ctx: RenderContext, liquidacion: any) {
    const col1X = ctx.margin + 15;
    const col2X = ctx.contentWidth - 100;

    const tableHeight = (liquidacion.haberes.length + liquidacion.descuentos.length + 6) * 15 + 60;
    ensureSpace(ctx, tableHeight);

    ctx.currentPage.drawText('-- HABERES --', { x: col1X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10 });
    ctx.cursor.y -= 20;

    liquidacion.haberes.forEach((item: any) => {
        ctx.currentPage.drawText(item.label, { x: col1X, y: ctx.cursor.y, font: ctx.fonts.normal, size: 10, color: ctx.colors.light });
        ctx.currentPage.drawText(item.value, { x: col2X, y: ctx.cursor.y, font: ctx.fonts.normal, size: 10, align: 'right', width: 100 + 15 });
        ctx.cursor.y -= 15;
    });

    ctx.cursor.y -= 5;
    ctx.currentPage.drawLine({ start: { x: col1X, y: ctx.cursor.y }, end: { x: ctx.width - ctx.margin, y: ctx.cursor.y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    ctx.cursor.y -= 20;

    ctx.currentPage.drawText('TOTAL HABERES', { x: col1X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10 });
    ctx.currentPage.drawText(liquidacion.totalHaberes, { x: col2X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10, align: 'right', width: 100 + 15 });
    ctx.cursor.y -= 25;

    if (liquidacion.descuentos.length > 0) {
        ctx.currentPage.drawText('-- DESCUENTOS --', { x: col1X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10 });
        ctx.cursor.y -= 20;
        liquidacion.descuentos.forEach((item: any) => {
            ctx.currentPage.drawText(item.label, { x: col1X, y: ctx.cursor.y, font: ctx.fonts.normal, size: 10, color: ctx.colors.light });
            ctx.currentPage.drawText(item.value, { x: col2X, y: ctx.cursor.y, font: ctx.fonts.normal, size: 10, align: 'right', width: 100 + 15 });
            ctx.cursor.y -= 15;
        });
        ctx.cursor.y -= 5;
        ctx.currentPage.drawLine({ start: { x: col1X, y: ctx.cursor.y }, end: { x: ctx.width - ctx.margin, y: ctx.cursor.y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        ctx.cursor.y -= 20;
        ctx.currentPage.drawText('TOTAL DESCUENTOS', { x: col1X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10 });
        ctx.currentPage.drawText(liquidacion.totalDescuentos, { x: col2X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 10, align: 'right', width: 100 + 15 });
        ctx.cursor.y -= 25;
    }

    // --- CORRECTED TOTAL LINE ---
    ctx.cursor.y -= 8;
    ctx.currentPage.drawLine({ start: { x: col1X, y: ctx.cursor.y }, end: { x: ctx.width - ctx.margin, y: ctx.cursor.y }, thickness: 1.5, color: ctx.colors.text });
    ctx.cursor.y -= 20;

    ctx.currentPage.drawText(liquidacion.totalAPagar.label, { x: col1X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 12 });
    ctx.currentPage.drawText(liquidacion.totalAPagar.value, { x: col2X, y: ctx.cursor.y, font: ctx.fonts.bold, size: 12, align: 'right', width: 100 + 15 });
    ctx.cursor.y -= 20;
}

// --- NEW HELPER FUNCTIONS for text wrapping and centering ---
function getTextBlockHeight(text: string, font: PDFFont, size: number, maxWidth: number, lineHeight: number): number {
    if (!text) return 0;
    const words = text.split(' ');
    let line = '';
    let lineCount = 1;

    for (const word of words) {
        const testLine = line === '' ? word : `${line} ${word}`;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && line !== '') {
            lineCount++;
            line = word;
        } else {
            line = testLine;
        }
    }
    return lineCount * lineHeight;
}

function drawCenteredWrappedText(
    ctx: RenderContext,
    text: string,
    x: number, // Center of the text block
    y: number, // Top of the text block
    maxWidth: number,
    options: { font: PDFFont; size: number; lineHeight: number; color?: any }
) {
    if (!text) return;
    const { font, size, lineHeight, color = ctx.colors.text } = options;
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    const lines: string[] = [];
    for (const word of words) {
        const testLine = line === '' ? word : `${line} ${word}`;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && line !== '') {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (const l of lines) {
        const lineWidth = font.widthOfTextAtSize(l, size);
        const lineX = x - lineWidth / 2;
        ctx.currentPage.drawText(l, {
            x: lineX,
            y: currentY,
            font,
            size,
            color,
        });
        currentY -= lineHeight;
    }
}

// --- REVISED SIGNATURE DRAWING FUNCTION ---
function drawSignatures(ctx: RenderContext, firmas: any) {
    const signatureBlockWidth = 200;
    const lineHeight = 12;
    const nameSize = 9;
    const rutSize = 9;

    const trabajadorNameHeight = getTextBlockHeight(firmas.trabajador.nombre, ctx.fonts.bold, nameSize, signatureBlockWidth, lineHeight);
    const empleadorNameHeight = getTextBlockHeight(firmas.empleador.nombre, ctx.fonts.bold, nameSize, signatureBlockWidth, lineHeight);
    
    const requiredHeight = Math.max(trabajadorNameHeight, empleadorNameHeight) + (lineHeight * 2) + 60;

    ensureSpace(ctx, requiredHeight);
    ctx.cursor.y -= 60;

    const signatureLineY = ctx.cursor.y;
    const nameY = signatureLineY - 15;

    const sig1X_center = ctx.margin + (signatureBlockWidth / 2) + 25;
    const sig2X_center = ctx.width - ctx.margin - (signatureBlockWidth / 2) - 25;

    ctx.currentPage.drawLine({ start: { x: sig1X_center - 100, y: signatureLineY }, end: { x: sig1X_center + 100, y: signatureLineY }, thickness: 0.8 });
    ctx.currentPage.drawLine({ start: { x: sig2X_center - 100, y: signatureLineY }, end: { x: sig2X_center + 100, y: signatureLineY }, thickness: 0.8 });

    drawCenteredWrappedText(ctx, firmas.trabajador.nombre, sig1X_center, nameY, signatureBlockWidth, {
        font: ctx.fonts.bold,
        size: nameSize,
        lineHeight,
    });
    const trabajadorBlockHeight = getTextBlockHeight(firmas.trabajador.nombre, ctx.fonts.bold, nameSize, signatureBlockWidth, lineHeight);
    const trabajadorRutY = nameY - trabajadorBlockHeight;
    ctx.currentPage.drawText(`R.U.T.: ${firmas.trabajador.rut}`, { x: sig1X_center, y: trabajadorRutY, font: ctx.fonts.normal, size: rutSize, align: 'center' });

    drawCenteredWrappedText(ctx, firmas.empleador.nombre, sig2X_center, nameY, signatureBlockWidth, {
        font: ctx.fonts.bold,
        size: nameSize,
        lineHeight,
    });
    const empleadorBlockHeight = getTextBlockHeight(firmas.empleador.nombre, ctx.fonts.bold, nameSize, signatureBlockWidth, lineHeight);
    const empleadorRutY = nameY - empleadorBlockHeight;
    ctx.currentPage.drawText(`R.U.T.: ${firmas.empleador.rut}`, { x: sig2X_center, y: empleadorRutY, font: ctx.fonts.normal, size: rutSize, align: 'center' });
}
