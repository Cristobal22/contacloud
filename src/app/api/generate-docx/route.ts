
import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Footer,
  PageNumber,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

// FIX: The interface now expects 'nombre' to match the incoming data from the frontend.
interface Signature {
  nombre: string;
  rut: string;
}

interface DocxRequestBody {
  mainContent: string;
  signatures?: {
    trabajador: Signature;
    empleador: Signature;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: DocxRequestBody = await req.json();
    const { mainContent, signatures } = body;

    if (!mainContent) {
      return new NextResponse(JSON.stringify({ error: 'Main content is missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mainParagraphs = mainContent.split('\n').map(
      (textLine) =>
        new Paragraph({
          children: [new TextRun(textLine)],
          spacing: { after: 120 },
        })
    );

    const docChildren: (Paragraph | Table)[] = [...mainParagraphs];

    if (signatures) {
      const signatureTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        columnWidths: [4500, 4500],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
          new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: '\n\n\n', border: { bottom: { color: "auto", size: 1, space: 1, style: "single" } } })] }),
                new TableCell({ children: [new Paragraph({ text: '\n\n\n', border: { bottom: { color: "auto", size: 1, space: 1, style: "single" } } })] }),
            ],
          }),
          // FIX: Use 'nombre' to correctly access the name property from the request.
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: signatures.trabajador.nombre, alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                children: [new Paragraph({ text: signatures.empleador.nombre, alignment: AlignmentType.CENTER })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: `RUT: ${signatures.trabajador.rut}`, alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                children: [new Paragraph({ text: `RUT: ${signatures.empleador.rut}`, alignment: AlignmentType.CENTER })],
              }),
            ],
          }),
        ],
      });
      
      docChildren.push(new Paragraph({ text: '\n\n' }));
      docChildren.push(signatureTable);
    }

    const doc = new Document({
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                }),
              ],
            }),
          ],
        }),
      },
      sections: [
        {
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="finiquito.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ error: 'Error generating document', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
