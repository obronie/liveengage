import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithGemini } from '@/lib/gemini';
import { GenerateQuestionsRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: GenerateQuestionsRequest = await req.json();

    if (!body.prompt && !body.courseContext && !body.learnerGuideNotes && !body.rawNotebookExtract && !body.clusterTitle) {
      return NextResponse.json(
        { error: 'Please provide course context, cluster information, or Gemini Notebook extracts' },
        { status: 400 }
      );
    }

    const questions = await generateQuestionsWithGemini(body);
    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error in /api/generate-questions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
