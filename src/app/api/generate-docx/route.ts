
import { NextRequest, NextResponse } from 'next/server';
// Replaced html-to-docx with the 'docx' package to resolve security vulnerabilities.
import { Document, Packer, Paragraph, TextRun, Footer, PageNumber, AlignmentType } from 'docx';

export async function POST(req: NextRequest) {
  try {
    // Note: The input is expected to be a plain string.
    // The previous variable name `htmlString` is kept for compatibility, but HTML tags will be ignored.
    const { htmlString: content } = await req.json();

    if (!content) {
      return new NextResponse(JSON.stringify({ error: 'Content is missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The 'docx' package works by building a document from paragraphs.
    // We split the incoming text by newlines to create separate paragraphs.
    // This mimics the structure of a plain text document.
    const paragraphs = content.split('\n').map(
      (textLine) =>
        new Paragraph({
          children: [new TextRun(textLine)],
        })
    );

    const doc = new Document({
      // Re-implementing footer and page number functionality from the previous version.
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
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="document.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return new NextResponse(JSON.stringify({ error: 'Error generating document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
