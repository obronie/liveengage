import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { AIGeneratedQuestion, GenerateQuestionsRequest } from '@/types';

const SYSTEM_INSTRUCTION = `You are an Expert Occupational Curriculum & Assessment Designer.
Your objective is to generate live training quiz and polling questions directly based on provided course texts, learner guides, standard operating procedures, or notes.

CRITICAL FRAMING RULES:
1. When generating questions based on the learner guide or course text, explicitly phrase the questions to prompt learners to reference their physical or digital guide.
   Examples of good stems:
   - "According to your Learner Guide, what are the three mandatory clearance requirements for...?"
   - "How does your Learner Guide define the standard operating procedure for...?"
   - "In Section 2 of your guide, which symbol represents...?"
2. STRICT CONSTRAINT: DO NOT output explicit page numbers in the question text! Learners must navigate by table of contents, module headings, and concept indices.
3. For "MCQ" (Single Choice), provide 3 to 4 distinct options with exactly one correct option in correctOptions.
4. For "MULTIPLE" (Multiple Choice / Select all that apply), provide 4 options with 2 or more correct options in correctOptions.
5. For "BINARY" (True/False), provide options: ["True", "False"] and correctOptions: [0] or [1].
6. For "SCALE", provide options: ["1 - Strongly Disagree / Low", "2", "3 - Neutral", "4", "5 - Strongly Agree / High"], correctOptions: [0,1,2,3,4] (or opinion based).
7. For "WORD_CLOUD", provide an open-ended prompt (options: [], correctOptions: []).
8. Every question must include "additionalText" providing a clear, engaging explanation of the correct answer and practical workplace context.
9. Recommended duration should be 30, 45, 60, or 90 seconds depending on complexity.`;

// Fallback questions generator for occupational training if API key is absent or offline
export function getSampleOccupationalQuestions(topic: string = 'General'): AIGeneratedQuestion[] {
  return [
    {
      format: 'MCQ',
      body: 'According to your Learner Guide, what is the minimum required clearance perimeter that must remain unobstructed around electrical distribution boards and emergency exits?',
      additionalText: 'Section 2.1 mandates a minimum 1.2-meter clear perimeter at all times to ensure rapid egress and uninhibited access for emergency responders.',
      options: [
        '0.5 meters',
        '1.2 meters',
        '2.5 meters',
        'Only clearance for the door swing'
      ],
      correctOptions: [1],
      duration: 45,
      guideTopicHint: 'Section 2.1 - Core Workplace Housekeeping Duties'
    },
    {
      format: 'MULTIPLE',
      body: 'What does your Learner Guide designate as mandatory PPE when decanting industrial degreasers and servicing battery charging bays? (Select all that apply)',
      additionalText: 'Learner Guide Section 2.2 specifies nitrile gloves (>=0.4mm thickness) and chemical splash goggles with indirect ventilation to prevent eye and dermal chemical burns.',
      options: [
        'Nitrile gloves (min 0.4mm thickness)',
        'Chemical splash goggles with indirect ventilation',
        'Standard cotton garden gloves',
        'Closed steel-toe safety footwear'
      ],
      correctOptions: [0, 1, 3],
      duration: 60,
      guideTopicHint: 'Section 2.2 - Chemical Hazards & SDS'
    },
    {
      format: 'BINARY',
      body: 'True or False: According to the standard operating procedures in your guide, pallets may be stacked up to 5 tiers high on open warehouse floor space without racking bays.',
      additionalText: 'False. Pallets must never be stacked more than 3 tiers high unless locked within calibrated drive-in racking bays to avoid tip-over hazard.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Pallet Stacking Limits'
    },
    {
      format: 'WORD_CLOUD',
      body: 'In one or two words, what is the very first action your Learner Guide instructs you to take upon discovering an unidentified liquid spill?',
      additionalText: 'Barricade / Isolate / Contain! Immediate isolation with chevron warning cones protects other personnel before clean-up begins.',
      options: [],
      correctOptions: [],
      duration: 45,
      guideTopicHint: 'Spill Management Protocols'
    },
    {
      format: 'SCALE',
      body: 'On a scale of 1 to 5, how confident is your team in locating the correct GHS Safety Data Sheet (SDS) section within 30 seconds?',
      additionalText: 'Speed of reference during chemical incidents saves lives. Familiarity with the 16-section GHS layout is a core occupational competency.',
      options: ['1 - Not Confident', '2 - Low', '3 - Moderate', '4 - High', '5 - Completely Confident'],
      correctOptions: [0, 1, 2, 3, 4],
      duration: 30,
      guideTopicHint: 'SDS Navigation Competency'
    }
  ];
}

export async function generateQuestionsWithGemini(
  request: GenerateQuestionsRequest
): Promise<AIGeneratedQuestion[]> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini')) {
    console.warn('No Gemini API key provided. Using rich occupational curriculum fallback questions.');
    return getSampleOccupationalQuestions(request.prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash or gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          description: 'A list of generated quiz questions for live classroom polling.',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              format: {
                type: SchemaType.STRING,
                description: 'Question format enum: MCQ, MULTIPLE, BINARY, SCALE, or WORD_CLOUD',
              },
              body: {
                type: SchemaType.STRING,
                description: 'The question stem, referencing the learner guide or topic structure without explicit page numbers',
              },
              additionalText: {
                type: SchemaType.STRING,
                description: 'Clear workplace explanation and rationale for the answer',
              },
              options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Array of option choices (empty for WORD_CLOUD)',
              },
              correctOptions: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.INTEGER },
                description: 'Zero-based indices of correct options',
              },
              duration: {
                type: SchemaType.INTEGER,
                description: 'Countdown timer in seconds (30, 45, 60, or 90)',
              },
              guideTopicHint: {
                type: SchemaType.STRING,
                description: 'Relevant heading or module topic in the learner guide',
              },
            },
            required: ['format', 'body', 'additionalText', 'options', 'correctOptions', 'duration'],
          },
        },
      },
    });

    const contextSection = request.courseContext
      ? `\n\nCOURSE CURRICULUM / LEARNER GUIDE TEXT:\n"""\n${request.courseContext.slice(0, 15000)}\n"""`
      : '';

    const count = request.questionCount || 5;
    const requestedFormats = request.formats && request.formats.length > 0
      ? `Preferred Question Formats: ${request.formats.join(', ')}`
      : 'Mix of MCQ, MULTIPLE, BINARY, and WORD_CLOUD formats';

    const promptText = `Generate ${count} interactive live questions for workplace training participants.
Prompt / Focus: ${request.prompt}
${requestedFormats}
${contextSection}

Ensure each question prompts learners to search their Learner Guide or course materials. No page numbers.`;

    const result = await model.generateContent(promptText);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AIGeneratedQuestion[];

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getSampleOccupationalQuestions(request.prompt);
  } catch (error) {
    console.error('Gemini API call failed:', error);
    // Fall back gracefully rather than crashing the facilitator's session
    return getSampleOccupationalQuestions(request.prompt);
  }
}
