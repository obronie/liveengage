import { GoogleGenAI, Type } from '@google/genai';
import { AIGeneratedQuestion, GenerateQuestionsRequest, CognitiveTargetLevel } from '@/types';

// Helper to remove markdown code fences if model accidentally includes them
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Fallback questions generator for occupational training if API key is absent or offline
export function getSampleOccupationalQuestions(topic: string = 'General', count: number = 6): AIGeneratedQuestion[] {
  const pool: AIGeneratedQuestion[] = [
    {
      format: 'MCQ',
      body: 'Order #409 requests 120 cartons of chilled beef. The supplier delivers 110 cartons with 2 cartons leaking. The delivery note states 120 cartons. What is the variance and what document must you immediately endorse?',
      additionalText: 'EISA Assessment Standard 1.1: Physical shortage (-10) plus damaged stock (-2) equals -12 cartons total variance. The receiving clerk must endorse the supplier Delivery Note before the driver departs and issue a Discrepancy Note.',
      options: [
        '-12 cartons; endorse Delivery Note & issue Discrepancy Note',
        '+10 cartons; sign delivery note as accepted',
        '-10 cartons; notify manager verbally without signing',
        '0 variance; accept total and adjust inventory tomorrow'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'EISA Focus Area 1: Receiving Variance Checks'
    },
    {
      format: 'MCQ',
      body: 'According to your Learner Guide, what is the minimum required clearance perimeter that must remain unobstructed around electrical distribution boards and emergency exit paths?',
      additionalText: 'Learner Guide Section 2.1 mandates a minimum 1.2-meter clear perimeter at all times to ensure unhindered emergency egress and rapid fire department access. Door swing alone (0.8m) is not sufficient.',
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
      body: 'When receiving Class 8 Corrosive Industrial Cleaning Chemicals into the warehouse, which safety controls are mandatory? (Select all that apply)',
      additionalText: 'EISA Criterion 1.2 & SDS protocols mandate storing corrosives in designated bunded chemical containment, ensuring eyewash stations are within 10 seconds, and wearing chemical splash goggles with nitrile PPE. Never store corrosives above eye level.',
      options: [
        'Secondary bunded containment pallets',
        'Accessible emergency eyewash station within 10 seconds',
        'Nitrile gloves (min 0.4mm thickness)',
        'Stacking on top rack level above dry food provisions'
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      guideTopicHint: 'EISA Criterion 1.2: Stock Characteristics & Hazchem'
    },
    {
      format: 'BINARY',
      body: 'True or False: Standard warehouse safety operating procedures permit pallets to be stacked up to 5 tiers high on open warehouse floor space without racking bays.',
      additionalText: 'False. Pallets must never be stacked more than 3 tiers high on open floors unless locked within calibrated drive-in racking bays to avoid tip-over hazard.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Pallet Stacking Limits'
    },
    {
      format: 'WORD_CLOUD',
      body: 'In one or two words, what is the very first standard action taken upon discovering an unidentified liquid chemical spill on the receiving bay?',
      additionalText: 'Barricade / Isolate / Contain! Immediate isolation with chevron warning cones protects other personnel before clean-up begins.',
      options: [],
      correctOptions: [],
      duration: 45,
      guideTopicHint: 'Spill Management Protocols'
    },
    {
      format: 'MCQ',
      body: 'What is the maximum allowable receiving core temperature for chilled dairy and fresh meat deliveries before mandatory quarantine or rejection?',
      additionalText: 'Cold-chain SOP: Chilled perishable stock must be received at or below +4°C (+5°C absolute maximum limit). Deliveries exceeding this threshold must be flagged for supervisor rejection.',
      options: [
        '+4°C (maximum +5°C threshold)',
        '+10°C (ambient room temperature)',
        '+15°C',
        'Any temperature as long as outer packaging is intact'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cold Chain Compliance'
    },
    {
      format: 'BINARY',
      body: 'True or False: The principle of "Clean-As-You-Go" requires warehouse clerks to clean up discarded plastic wrap and timber offcuts immediately, rather than waiting for end-of-shift sweeping.',
      additionalText: 'True. Clean-as-you-go prevents slip, trip, and forklift entanglement hazards in real time throughout operational shifts.',
      options: ['True', 'False'],
      correctOptions: [0],
      duration: 30,
      guideTopicHint: 'Five Pillars of Housekeeping'
    },
    {
      format: 'MULTIPLE',
      body: 'Which pieces of information MUST match between the Purchase Order (PO) and Supplier Delivery Note before signing receipt? (Select all that apply)',
      additionalText: 'Cross-document verification: Supplier name, Purchase Order number, product SKU/item codes, and ordered unit pack sizes must align precisely before goods acceptance.',
      options: [
        'Purchase Order (PO) Reference Number',
        'Product SKU / Item Codes and descriptions',
        'Supplier Business Entity Name',
        'Driver personal cell phone number'
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      guideTopicHint: 'Receiving Inbound Documentation'
    },
    {
      format: 'SCALE',
      body: 'On a scale of 1 to 5, rate the risk severity of staging empty wooden pallets in front of an emergency fire hose reel.',
      additionalText: 'Severity 5: Obstructing fire firefighting equipment is a direct statutory contravention under OHS regulations and carries zero tolerance.',
      options: ['1 - Negligible', '2 - Low Risk', '3 - Moderate Risk', '4 - High Risk', '5 - Critical OHS Violation'],
      correctOptions: [4],
      duration: 30,
      guideTopicHint: 'Fire Safety Compliance'
    },
    {
      format: 'MCQ',
      body: 'When managing perishable goods or pharmaceuticals with stamped expiry dates, which stock rotation method is strictly required?',
      additionalText: 'FEFO (First-Expired, First-Out) ensures stock closest to expiration is picked and dispatched first, preventing expired stock obsolescence.',
      options: [
        'FEFO (First-Expired, First-Out)',
        'LIFO (Last-In, First-Out)',
        'Random access storage',
        'Heaviest pallet first'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Stock Rotation Principles'
    },
    {
      format: 'MCQ',
      body: 'An inbound supplier arrives with goods, but no Delivery Note or Inbound Waybill is provided. What is the standard operating procedure?',
      additionalText: 'SOP Mandate: Inbound shipments without commercial delivery paperwork must not be received into general stock. Goods must be quarantined in the designated holding bay until paperwork is produced.',
      options: [
        'Move goods to quarantine bay and refuse receipt until documentation is provided',
        'Sign a blank piece of paper and unpack directly into picking bins',
        'Allow the driver to leave and search for the invoice next week',
        'Accept the delivery only if the driver seems trustworthy'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Receiving Discrepancies'
    },
    {
      format: 'MULTIPLE',
      body: 'Which PPE items are mandatory for all personnel walking through active forklift transit zones and container de-stuffing bays? (Select all that apply)',
      additionalText: 'Warehouse OHS standards mandate high-visibility reflective vests and steel-toe safety boots in all active mechanical equipment zones.',
      options: [
        'High-visibility reflective vest (Class 2)',
        'Steel-toe cap safety footwear',
        'Safety glasses / eye protection in designated zones',
        'Casual canvas trainers'
      ],
      correctOptions: [0, 1, 2],
      duration: 45,
      guideTopicHint: 'Warehouse PPE Standards'
    },
    {
      format: 'BINARY',
      body: 'True or False: A receiving clerk is legally permitted to endorse a delivery note with "Subject to Check" to release a hurried delivery driver.',
      additionalText: 'False. Modern logistics and EISA criteria disallow "Subject to Check" signatures. Physical count and carton integrity must be checked before signing.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Document Endorsement Legality'
    },
    {
      format: 'WORD_CLOUD',
      body: 'In one word or acronym, what technical document must accompany every hazardous chemical stored in the warehouse?',
      additionalText: 'SDS or MSDS (Safety Data Sheet / Material Safety Data Sheet).',
      options: [],
      correctOptions: [],
      duration: 45,
      guideTopicHint: 'Hazchem & Chemical Safety'
    },
    {
      format: 'MCQ',
      body: 'During physical unloading, you notice 3 cartons on a pallet are visibly crushed and leaking unknown liquid. What is the immediate correct step?',
      additionalText: 'Damaged stock must be photographed, segregated immediately into the quarantine bay, endorsed on the delivery note as damaged, and escalated to the receiving supervisor.',
      options: [
        'Isolate damaged cartons in quarantine bay, document with photos, and endorse discrepancy on Delivery Note',
        'Tape up the crushed cartons and place them in general picking bins',
        'Hide the cartons behind good stock on the bottom pallet tier',
        'Discard the cartons in the general garbage skip immediately'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Damaged Stock Quarantine'
    },
    {
      format: 'MCQ',
      body: 'In cross-docking operations, what is the maximum recommended staging dwell time for inbound cross-dock freight before outbound loading?',
      additionalText: 'True cross-docking requires rapid turnover, typically under 24 hours (and often under 4 hours for FMCG), with zero long-term storage putaway.',
      options: [
        'Under 24 hours (direct transfer without long-term storage)',
        '7 business days',
        '30 days',
        'Whenever warehouse staff have spare time'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cross-Docking Staging'
    },
    {
      format: 'MULTIPLE',
      body: 'Which of the following are direct indicators of pest or vermin infestation in a warehouse storage area? (Select all that apply)',
      additionalText: 'Housekeeping and health audit standards: Gnawed packaging, droppings along skirting boards, and nesting materials are immediate signs of pest non-conformance.',
      options: [
        'Droppings along walls or underneath pallet racking',
        'Gnawed corners on cardboard cartons or grain bags',
        'Shredded shrink-wrap and paper nesting material in corners',
        'Properly positioned ultrasonic pest repellent beacons'
      ],
      correctOptions: [0, 1, 2],
      duration: 45,
      guideTopicHint: 'Pest & Vermin Prevention'
    },
    {
      format: 'BINARY',
      body: 'True or False: Flammable liquids (Class 3) may be stored directly adjacent to Class 5 Oxidizing agents as long as both are on certified timber pallets.',
      additionalText: 'False. Oxidizers supply oxygen and intensify combustion; they must be physically segregated from flammable liquids by fire-rated partitions or statutory clearance distances.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Dangerous Goods Segregation'
    },
    {
      format: 'MCQ',
      body: 'Who is authorized to hold the physical keys or access tokens to high-value secured bond cages inside the distribution centre?',
      additionalText: 'High-value shrinkage control: Only nominated, vetted supervisors or authorized inventory controllers may hold keys, with a mandatory signed key-register logbook.',
      options: [
        'Designated and vetted supervisor recorded in the signed key-register logbook',
        'Any warehouse temporary casual worker',
        'External third-party delivery drivers',
        'Keys may be left hanging on the cage lock for convenience'
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Shrinkage & Loss Prevention'
    },
    {
      format: 'WORD_CLOUD',
      body: 'In one or two words, what is the primary business consequence of inaccurate receiving and dispatch discrepancies?',
      additionalText: 'Shrinkage, loss, stockouts, or customer dissatisfaction.',
      options: [],
      correctOptions: [],
      duration: 45,
      guideTopicHint: 'Loss Prevention & Customer Service'
    }
  ];

  return pool.slice(0, Math.min(count, pool.length));
}

// Model fallback cascade starting with 3.8 flash
const MODEL_CASCADE = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

export async function generateQuestionsWithGemini(
  request: GenerateQuestionsRequest
): Promise<AIGeneratedQuestion[]> {
  const count = request.questionCount || 6;
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini')) {
    console.warn('No Gemini API key provided. Using rich occupational curriculum fallback questions.');
    return getSampleOccupationalQuestions(request.clusterTitle || request.prompt, count);
  }

  // Determine cognitive level guidance
  const level: CognitiveTargetLevel = request.targetLevel || 'operational';
  let bloomDirective = '';
  if (level === 'foundational') {
    bloomDirective = 'COGNITIVE LEVEL (Foundational): ~70% Remember/Understand (definitions, terminology, regulatory thresholds), ~30% Apply (simple direct workplace choices). Keep language plain and accessible. Avoid multi-step traps.';
  } else if (level === 'advanced') {
    bloomDirective = 'COGNITIVE LEVEL (Advanced): ~40% Understand, ~40% Apply, ~20% Analyze/Evaluate (compare procedures, spot flawed step in SOP, audit non-conformance).';
  } else {
    // operational default
    bloomDirective = 'COGNITIVE LEVEL (Operational Workplace): ~55% Remember/Understand, ~35% Apply (single-step workplace decisions), ~10% short operational scenario. Ground questions in practical daily duties.';
  }

  const fsaDirective = request.isFsaMock
    ? `AUTHENTIC GENERIC IAC FSA MOCK EXAM MODE:
1. YOU ARE DESIGNING A MOCK FINAL SUMMATIVE ASSESSMENT (EISA EXAM SIMULATION) covering all Integrated Assessment Criteria (IAC) for the specified cluster.
2. CRITICAL QUANTITATIVE & PROCEDURAL CRITERIA TO TEST:
   - If Cluster 2.3 (Packing & Dispatch Advice): MANDATORY inclusion of South African 15% VAT calculation on Dispatch Advice (Subtotal + 15% VAT = Grand Total), line extensions, courier freight rate calculations (base carton + additional boxes + VAT), protective packaging combinations, and the 4 mandatory exterior container label details.
   - If Cluster 2.2 (Recording Dispatches & MHE): Test Material Handling Equipment selection (Forklift, Flatbed trolley, Roll cage trolley, Reach truck) and the 3-step Faulty Equipment Protocol (STOP, TAG OUT, REPORT).
   - If Cluster 1.3 (Receiving & Checking Deliveries): Test 3-way delivery note variance reconciliation (-11 total variance calculation: shortage + damage), standard procedure when documents differ from PO, and refusal of "Subject to Check".
   - If Cluster 1.2 (Prevent Shrinkage & Losses): Test the Retail Stocktake equation (Book Inventory - Physical Count = Shrinkage), Sales Recovery Revenue formula (Financial Loss / Net Profit Margin), and the C.R.A.V.E.D. hot product framework.
   - If Cluster 1.1 (Receiving & Dispatch Environment): Test the Cold-Chain 30-minute rule, 3PL requirements, and warehousing vs. cross-docking financial impacts.
   - If Cluster 2.4 (General Standards of Housekeeping): Test 1.2m DB clearances, Clean-As-You-Go, yellow safety cones, and chemical MSDS/SDS protocols.
3. STRICT FORMAT FOR "additionalText":
   Every question's "additionalText" MUST be structured in two distinct sections without using academic jargon like "rubric":
   🟢 Model Answer:
   [Provide the exact step-by-step mathematical calculations with line items or concrete step-by-step SOP procedures]

   📝 How the Assessor Marks This:
   [Detail point allocations, what the external national examiner awards marks for, and common learner traps or incorrect assumptions].`
    : `6. WORKPLACE RATIONALE & SCORING: In "additionalText", format with:
   🟢 Model Answer: [Exact answer/calculation steps]
   📝 How the Assessor Marks This: [Why correct & where marks are awarded].`;

  const systemInstruction = `YOU ARE: An Expert Occupational Curriculum & Live Classroom Assessment Designer.
YOUR OBJECTIVE: Generate high-impact live polling and quiz questions for adult workplace learners (teams and individuals).

${bloomDirective}

CRITICAL FRAMING RULES & STEM VARIETY:
1. BALANCED STEM DISTRIBUTION (Do NOT force every question to cite the Learner Guide):
   - ~30-35% Learner Guide Reference: Prompt learners to navigate their physical/digital guide or SOPs ("According to your Learner Guide, what is...", "In Section 2 of your guide, which symbol...").
   - ~45-50% EISA Exam Workplace Scenarios & Document Discrepancy Checks: Direct applied workplace problem-solving with numbers, stock characteristics, variance calculations, or shrinkage control risks (e.g. "Order #409 requests 120 cartons... delivery note states 110 cartons with 2 leaking... what is the variance?"). DO NOT mention "Learner Guide" in these scenario stems; test applied workplace judgment.
   - ~20% Rapid Diagnostic / Safety Checks: Direct, punchy compliance questions ("Which fire extinguisher class is strictly prohibited on an electrical DB fire?").
2. STRICT CONSTRAINT: DO NOT output explicit page numbers in the question stem or options! Learners must navigate by module headings, standard operating procedure titles, and table of contents.
3. PLAUSIBLE DISTRACTORS: For MCQ/MULTIPLE, wrong choices must represent genuine, realistic workplace misconceptions, calculation pitfalls, or commonly confused numbers/terms. Never use obvious joke options.
4. BALANCED POSITIONS: Distribute correct options roughly evenly across option positions (A, B, C, D). Avoid always making the second option correct.
5. STANDALONE STRINGS: Never include order prefixes like "1.", "2.", "A." or "Step 1:" in the options array.
${fsaDirective}
7. RECOMMENDED DURATION: 30s (Binary/True-False), 45s (Standard MCQ), 60s (Multiple Choice/Calculations), 90s (Complex Workplace Scenarios).
8. MARKS ALLOCATION: Allocate realistic integer marks per question: 1 mark for basic recall / SOP rules, 2 to 3 marks for multi-step math calculations (e.g. 15% VAT, delivery note variance, CRAVED shrinkage) or applied workplace scenarios.

Return ONLY a valid JSON array of question objects adhering strictly to the response schema.`;

  // Build the rich context from Curriculum Framework + Gemini Notebook modular extractions
  let contextParts: string[] = [];

  if (request.courseCode || request.courseTitle) {
    contextParts.push(`COURSE: ${request.courseCode || ''} - ${request.courseTitle || 'Occupational Training'}`);
  }
  if (request.clusterNumber || request.clusterTitle) {
    contextParts.push(`CLUSTER / MODULE: Cluster ${request.clusterNumber || ''} - ${request.clusterTitle || 'Core Competency'}`);
  }

  if (request.courseContext && request.courseContext.trim()) {
    contextParts.push(`\n=== 1. OFFICIAL CURRICULUM FRAMEWORK & OUTCOMES ===\n${request.courseContext.slice(0, 30000)}`);
  }

  if (request.learnerGuideNotes && request.learnerGuideNotes.trim()) {
    contextParts.push(`\n=== 2. LEARNER GUIDE CORE CONCEPTS & SOPS (From Gemini Notebook) ===\n${request.learnerGuideNotes}`);
  } else if (request.rawNotebookExtract && request.rawNotebookExtract.trim()) {
    contextParts.push(`\n=== 2. GEMINI NOTEBOOK / NOTEBOOKLM EXTRACT ===\n${request.rawNotebookExtract}`);
  }

  if (request.assessmentActivitiesNotes && request.assessmentActivitiesNotes.trim()) {
    contextParts.push(`\n=== 3. FORMATIVE ASSESSMENT ACTIVITIES & WORKBOOK EXERCISES ===\n${request.assessmentActivitiesNotes}`);
  }

  if (request.practicalActivitiesNotes && request.practicalActivitiesNotes.trim()) {
    contextParts.push(`\n=== 4. PRACTICAL WORKPLACE TASKS & CHECKLISTS ===\n${request.practicalActivitiesNotes}`);
  }

  if (request.customBackground && request.customBackground.trim()) {
    contextParts.push(`\n=== 5. CUSTOM CLIENT WORKPLACE REALITY ===\nTailor scenarios and terminology to this exact operational context:\n"${request.customBackground.trim()}"`);
  }

  if (request.isFsaMock) {
    contextParts.push(`\n=== 6. FSA MOCK EXAM SIMULATION MANDATE ===\nTarget all official Integrated Assessment Criteria (IAC) for this cluster. Include realistic numerical scenarios, South African regulatory standards (such as statutory 15% VAT for dispatch calculations), and concrete equipment/packaging decisions.`);
  }

  const promptText = `Generate exactly ${count} live assessment questions based on the provided curriculum and notebook extracts.
${contextParts.join('\n\n')}

Ensure each question connects the official Curriculum outcomes to the practical Formative Assessment activities.`;

  // Strict structured JSON response schema
  const responseSchema = {
    type: Type.ARRAY,
    description: 'A list of live polling quiz questions',
    items: {
      type: Type.OBJECT,
      properties: {
        format: {
          type: Type.STRING,
          enum: ['MCQ', 'MULTIPLE', 'BINARY', 'SCALE', 'WORD_CLOUD'],
          description: 'Question format enum',
        },
        body: {
          type: Type.STRING,
          description: 'Question stem prompting search in the learner guide without page numbers',
        },
        additionalText: {
          type: Type.STRING,
          description: 'Classroom debrief and workplace rationale explaining why the answer is correct and why the distractor was a trap',
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of option strings (empty for WORD_CLOUD)',
        },
        correctOptions: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER },
          description: 'Zero-based indices of correct options',
        },
        duration: {
          type: Type.INTEGER,
          description: 'Timer in seconds: 30, 45, 60, or 90',
        },
        marks: {
          type: Type.INTEGER,
          description: 'Mark allocation: 1 mark for recall/SOP identification, 2-3 marks for multi-step variance/math/applied scenarios',
        },
        guideTopicHint: {
          type: Type.STRING,
          description: 'Relevant heading or SOP title in the Learner Guide',
        },
      },
      required: ['format', 'body', 'additionalText', 'options', 'correctOptions', 'duration'],
    },
  };

  const ai = new GoogleGenAI({ apiKey });

  // Priority model queue starting with requested model or gemini-3.8-flash
  const requestedModel = request.model || 'gemini-3.8-flash';
  const modelsToTry = [requestedModel, ...MODEL_CASCADE.filter(m => m !== requestedModel)];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const rawText = response.text || '[]';
      const cleaned = cleanJsonResponse(rawText);
      const parsed = JSON.parse(cleaned) as AIGeneratedQuestion[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Post-processing normalizer
        return parsed.map((q, idx) => {
          // Normalise options
          if (!Array.isArray(q.options)) q.options = [];
          if (!Array.isArray(q.correctOptions)) q.correctOptions = [];
          q.options = q.options.map(o => String(o).trim()).filter(Boolean);

          if (q.format === 'BINARY') {
            if (q.options.length < 2) q.options = ['True', 'False'];
            if (q.correctOptions.length === 0) q.correctOptions = [0];
          }

          if (q.format === 'MCQ') {
            if (q.correctOptions.length === 0 && q.options.length > 0) q.correctOptions = [0];
          }

          if (q.format === 'WORD_CLOUD') {
            q.options = [];
            q.correctOptions = [];
          }

          // Enforce timing defaults
          if (!q.duration || q.duration <= 0) {
            if (q.format === 'BINARY') q.duration = 30;
            else if (q.format === 'MULTIPLE') q.duration = 60;
            else q.duration = 45;
          }

          return q;
        });
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or returned error:`, err?.message || err);
      // Continue to next model in cascade
    }
  }

  console.error('All Gemini Flash models in cascade failed. Falling back to preloaded occupational question bank.');
  return getSampleOccupationalQuestions(request.clusterTitle || request.prompt);
}
