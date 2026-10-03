import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileName.toLowerCase().endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md')) {
      extractedText = buffer.toString('utf-8');
    } else {
      // Attempt UTF-8 string read
      extractedText = buffer.toString('utf-8');
    }

    // Clean up excessive whitespace
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      success: true,
      fileName,
      charCount: cleanedText.length,
      extractedText: cleanedText,
    });
  } catch (error: any) {
    console.error('Error in /api/extract-document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract text from document' },
      { status: 500 }
    );
  }
}
