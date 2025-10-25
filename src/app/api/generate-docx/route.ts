
import { NextRequest, NextResponse } from 'next/server';
import htmlToDocx from 'html-to-docx';

export async function POST(req: NextRequest) {
  try {
    const { htmlString } = await req.json();

    if (!htmlString) {
      return new NextResponse(JSON.stringify({ error: 'HTML content is missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const fileBuffer = await htmlToDocx(htmlString, undefined, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="document.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return new NextResponse(JSON.stringify({ error: 'Error generating document' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
