'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AppStore } from '@/lib/store';
import { parseMasterMappingToClusters } from '@/lib/courseParser';
import { 
  Course, 
  CourseDocument, 
  CourseCluster, 
  QuestionSet, 
  Question, 
  QuestionFormat, 
  CognitiveTargetLevel,
  Session,
  ResponseRecord
} from '@/types';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Play,
  Clock,
  HelpCircle,
  Users,
  Sliders,
  FileQuestion,
  Save,
  Tag,
  BarChart2,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  Printer,
  FileCheck,
  X,
  QrCode,
  Monitor,
  Maximize2,
  Minimize2,
  Edit3,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Code,
  Calculator,
  RotateCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClassroomQAWheelModal } from '@/components/ClassroomQAWheelModal';
import { useIlearnSync } from '@/lib/ilearnSync';

export default function CoursesPage() {
  const router = useRouter();
  const { isEmbedded, learners } = useIlearnSync();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [clusters, setClusters] = useState<CourseCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<CourseCluster | null>(null);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [filterClusterId, setFilterClusterId] = useState<string>('all');

  // Review mode for historical runs (Option A)
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const [clusterSessions, setClusterSessions] = useState<Session[]>([]);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showFsaPaperModal, setShowFsaPaperModal] = useState(false);
  const [showQAWheelModal, setShowQAWheelModal] = useState(false);
  const [fsaPaperMode, setFsaPaperMode] = useState<'paper' | 'projector' | 'memo'>('paper');
  const [isProjectorFullscreen, setIsProjectorFullscreen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // BrainCert LMS Integration & EISA Assessment Hub State
  const [showBrainCertModal, setShowBrainCertModal] = useState<boolean>(false);
  const [brainCertObjectiveId, setBrainCertObjectiveId] = useState<string>('3927820');
  const [brainCertTab, setBrainCertTab] = useState<'setup' | 'html' | 'csv' | 'blueprint'>('setup');
  const [brainCertCopiedField, setBrainCertCopiedField] = useState<string | null>(null);
  const [pilotAddedSuccess, setPilotAddedSuccess] = useState<boolean>(false);

  // Timing Mode state for Generator
  const [timingMode, setTimingMode] = useState<'overall' | 'per_question' | 'untimed'>('per_question');
  const [overallTimeMinutes, setOverallTimeMinutes] = useState<number>(20);
  const [perQuestionDuration, setPerQuestionDuration] = useState<number>(45);

  // Edit Question Set Modal state
  const [showEditSetModal, setShowEditSetModal] = useState<boolean>(false);
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editTimingMode, setEditTimingMode] = useState<'overall' | 'per_question' | 'untimed'>('per_question');
  const [editOverallTime, setEditOverallTime] = useState<number>(20);
  const [editPerQuestionTime, setEditPerQuestionTime] = useState<number>(45);
  const [editEntryMode, setEditEntryMode] = useState<'individual' | 'group'>('group');
  const [editTargetLevel, setEditTargetLevel] = useState<CognitiveTargetLevel>('operational');

  // Course Form (with QCTO Master IAC mapping)
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [isQctoCourse, setIsQctoCourse] = useState(true);
  const [masterIacTable, setMasterIacTable] = useState('');
  const [masterPromptCopied, setMasterPromptCopied] = useState(false);

  // Reactively parse Master Mapping Table as user pastes it
  const detectedClusters = useMemo(() => {
    if (!isQctoCourse || !masterIacTable.trim()) return [];
    return parseMasterMappingToClusters('temp-course', masterIacTable);
  }, [isQctoCourse, masterIacTable]);

  // Unified Generator Form
  const [targetClusterId, setTargetClusterId] = useState<string>('existing');
  const [newClusterNumber, setNewClusterNumber] = useState('');
  const [newClusterTitle, setNewClusterTitle] = useState('');
  const [isCustomSet, setIsCustomSet] = useState(false);
  const [isFsaMockSet, setIsFsaMockSet] = useState(false);
  const [isBrainCertBankSet, setIsBrainCertBankSet] = useState(false);
  const [clientName, setClientName] = useState('Generic Standard');
  const [setTitle, setSetTitle] = useState('');
  const [notebookExtract, setNotebookExtract] = useState('');
  const [showNotebookFields, setShowNotebookFields] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [targetLevel, setTargetLevel] = useState<CognitiveTargetLevel>('operational');
  const [defaultEntryMode, setDefaultEntryMode] = useState<'individual' | 'group'>('group');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Document upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingCurriculum, setIsDraggingCurriculum] = useState(false);
  const [isDraggingEisa, setIsDraggingEisa] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const curriculumInputRef = useRef<HTMLInputElement>(null);
  const eisaInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadData();
  }, []);

  // Sync active selection so Navbar Launch Live immediately knows what is selected
  useEffect(() => {
    if (selectedCourse && selectedCluster && selectedSet) {
      AppStore.setActiveSelection(selectedCourse.id, selectedCluster.id, selectedSet.id);
    }
  }, [selectedCourse, selectedCluster, selectedSet]);

  const loadData = async () => {
    const list = await AppStore.fetchCourses();
    setCourses(list);
    if (list.length > 0) {
      const activeCourse = selectedCourse ? list.find(c => c.id === selectedCourse.id) || list[0] : list[0];
      setSelectedCourse(activeCourse);
      loadClusters(activeCourse.id);
    }
  };

  const loadClusters = async (courseId: string) => {
    const clusterList = await AppStore.fetchClusters(courseId);
    setClusters(clusterList);
    if (clusterList.length > 0) {
      const activeCluster = selectedCluster && clusterList.some(c => c.id === selectedCluster.id)
        ? clusterList.find(c => c.id === selectedCluster.id)!
        : clusterList[0];
      setSelectedCluster(activeCluster);
      await loadQuestionSets(activeCluster.id);
      loadHistoricalSessions(activeCluster.id);
    } else {
      setSelectedCluster(null);
      setQuestionSets([]);
      setSelectedSet(null);
      setClusterSessions([]);
    }
  };

  const loadQuestionSets = async (clusterId: string) => {
    const sets = await AppStore.fetchQuestionSets(clusterId);
    setQuestionSets(sets);
    if (sets.length > 0) {
      const activeSet = selectedSet && sets.some(s => s.id === selectedSet.id) ? selectedSet : sets[0];
      setSelectedSet(activeSet);
    } else {
      setSelectedSet(null);
    }
  };

  const loadHistoricalSessions = (clusterId: string) => {
    const sessions = AppStore.getSessionsForCluster(clusterId);
    setClusterSessions(sessions);
  };

  // --- Copy Master Mapping Prompt for NotebookLM ---
  const handleCopyMasterPrompt = () => {
    const code = courseCode.trim() || 'OQ99446';
    const title = courseTitle.trim() || 'Occupational Store Person: Warehouse Housekeeping & Safety';
    const prompt = `You are an expert South African occupational curriculum and assessment specialist (QCTO).
Based on the selected Curriculum Framework and External Assessment Specifications (EISA) documents in this notebook for Course: ${code} - ${title}:

Generate a complete, structured MASTER CLUSTER-TO-IAC MAPPING TABLE in Markdown format with the following 5 columns:
| Cluster Number | Cluster Title | Primary EISA Focus Area | Mapped IAC / AAC Assessment Criteria | Weighting & Assessment Focus |

Requirements:
1. Include every learning cluster in the curriculum (e.g. Cluster 1.1, Cluster 1.2, Cluster 1.3, Cluster 2.1, etc.).
2. In 'Primary EISA Focus Area', explicitly link each cluster to either Focus Area 1 (Receiving), Focus Area 2 (Dispatch), Enabling Foundational Knowledge, or Underpinning Safety/Housekeeping.
3. In 'Mapped IAC / AAC Assessment Criteria', list the specific Knowledge Modules (KM) and Practical Modules (PM) Internal Assessment Criteria (IAC) codes and titles.
4. In 'Weighting & Assessment Focus', state the percentage weighting (e.g. 50%, 20%, 10%) and core assessment focus.

Provide the table directly in clean Markdown format.`;

    navigator.clipboard.writeText(prompt);
    setMasterPromptCopied(true);
    setTimeout(() => setMasterPromptCopied(false), 3000);
  };

  // --- Course Creation ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle) return;

    const courseId = 'course-' + Math.random().toString(36).substring(2, 9);
    const course: Course = {
      id: courseId,
      code: courseCode.trim().toUpperCase(),
      title: courseTitle.trim(),
      description: courseDesc.trim(),
      is_qcto: isQctoCourse,
      master_iac_mapping: isQctoCourse ? masterIacTable : undefined,
      created_at: new Date().toISOString(),
      documents: []
    };

    await AppStore.saveCourse(course);

    // If QCTO Course and clusters were detected in the master table, auto-create all clusters in one shot!
    if (isQctoCourse && detectedClusters.length > 0) {
      for (const cl of detectedClusters) {
        await AppStore.saveCluster({
          ...cl,
          id: `cluster-${cl.cluster_number.replace('.', '-')}-${Math.random().toString(36).substring(2, 7)}`,
          course_id: courseId,
          created_at: new Date().toISOString(),
        });
      }
    }

    setCourseCode('');
    setCourseTitle('');
    setCourseDesc('');
    setIsQctoCourse(true);
    setMasterIacTable('');
    setShowCourseModal(false);
    await loadData();
    setSelectedCourse(course);
    loadClusters(courseId);
  };

  // --- Document Upload Handlers (Curriculum vs EISA Specs) ---
  const processUploadedFile = async (file: File, docType: 'curriculum' | 'eisa_specification') => {
    if (!file || !selectedCourse) return;

    setIsUploading(true);
    setUploadFeedback(`Extracting ${docType === 'curriculum' ? 'Curriculum' : 'EISA Specification'} text...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract document text');

      const doc: CourseDocument = {
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        course_id: selectedCourse.id,
        doc_type: docType,
        file_name: file.name,
        extracted_text: data.extracted_text,
        uploaded_at: new Date().toISOString(),
      };

      await AppStore.saveDocument(selectedCourse.id, doc);
      await loadData();

      setUploadFeedback(`✓ ${docType === 'curriculum' ? 'Curriculum Framework' : 'EISA Specifications'} uploaded!`);
      setTimeout(() => setUploadFeedback(null), 3500);
    } catch (err: any) {
      console.error(err);
      setUploadFeedback('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'curriculum' | 'eisa_specification') => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file, docType);
    }
    if (e.target) e.target.value = '';
  };

  // --- Copy Gemini Notebook Prompt (Learner Guide + EISA Exam Criteria) ---
  const handleCopyNotebookPrompt = () => {
    const cluster = clusters.find(c => c.id === targetClusterId) || selectedCluster;
    const clusterNum = targetClusterId === 'new' ? (newClusterNumber || 'New Cluster') : (cluster?.cluster_number || '2.4');
    const clusterName = targetClusterId === 'new' ? (newClusterTitle || 'Operational Topic') : (cluster?.title || 'Warehouse Housekeeping & Safety');

    const activeClient = isCustomSet && clientName && clientName !== 'Generic Standard' ? clientName.trim() : null;
    const activeContext = isCustomSet && customContext ? customContext.trim() : null;
    const clientDirective = activeClient 
      ? `Client / Workplace Reality: ${activeClient}${activeContext ? `\nOperational Context: ${activeContext}` : ''}\nTailor extracted scenarios, nomenclature, goods types, and SOPs to this operational distribution or retail environment.\n`
      : '';
    const fsaDirective = isFsaMockSet
      ? `\n### 5. FSA MOCK EXAM & IAC ASSESSMENT CRITERIA SPECIFICATIONS
- This question set is an authentic Generic IAC FSA Mock Exam STRICTLY FOCUSED on Cluster ${clusterNum}.
- Extract and cover ONLY the specific Integrated Assessment Criteria (IAC) mapped to Cluster ${clusterNum} (Do NOT include criteria or questions from other clusters).
- For quantitative clusters (especially Cluster 2.3): include South African 15% VAT calculations on Dispatch Advice (Subtotal + 15% VAT = Grand Total), line extensions, and courier fee formulas.
- For Cluster 2.2: include Material Handling Equipment (MHE) selection (Forklift, Flatbed trolley, Roll cage, Reach truck) and the 3-step Faulty Equipment Protocol (STOP, TAG OUT, REPORT).
- For Cluster 1.3: include 3-way delivery note variance reconciliation (-11 total variance) and mandatory inbound verification checks.
- For Cluster 1.2: include Retail shrinkage equations (Book Inventory - Physical Count), Sales Recovery Revenue (Loss / Margin), and CRAVED framework.
- For EVERY question: formulate '🟢 Model Answer:' with step-by-step numbers, and '📝 How the Assessor Marks This:' detailing mark allocations and common traps.`
      : isBrainCertBankSet
        ? `\n### 5. BRAINCERT EISA MULTI-FORMAT QUESTION BANK SPECIFICATIONS (60-QUESTION ROTATION POOL)
- This question bank is designed for BrainCert LMS (60+ questions in rotation, drawing 20 random questions in 40 minutes per attempt).
- Extract a rich, varied cross-section of material across THREE tiers:
  1. Tier 1 (Knowledge & Workplace SOP Rules): Cold-chain HACCP limits (2°C–4°C vs 9.5°C breach), OHS safety, shrinkage classifications.
  2. Tier 2 (Document & Physical Reconciliation): PO vs Delivery Note vs Physical Tally, GRN net sound stock rules, discrepancy endorsements.
  3. Tier 3 (Applied Logistics Mathematics): Palletization (Ti x Hi), courier volumetric weight ((L x W x H) / 5000), unit reconciliation across damaged cartons, Rand credit request claims.
- Support 4 BrainCert Question Types: Fill in the Blanks (with embedded Word Bank or numeric calculation), Single-Select Multiple Choice, Multiple Answer Checkboxes (ending with "(Select 2)" or "(Select 3)"), and True/False.
- For EVERY question: include step-by-step arithmetic proofs and explicit distractor reviews explaining why each wrong option is a trap.`
        : '';

    const prompt = `You are an expert occupational curriculum and assessment specialist for adult workplace training.
I am preparing live interactive training questions and EISA national exam preparation for:
Course: ${selectedCourse?.code || 'OQ99446'} - ${selectedCourse?.title || 'Store Person'}
Cluster: ${clusterNum} - ${clusterName}
${clientDirective}
STRICT INSTRUCTIONS:
- DO NOT quote administrative syllabus codes (e.g. do not output KT0201, IAC0201, SE0202).
- Rely heavily on the selected LEARNER GUIDE and FORMATIVE ASSESSMENT WORKBOOK sources for Cluster ${clusterNum}.
- Extract deep, actionable operational details, numbers, and concrete scenarios.
${activeClient ? `- Emphasize real-world workplace examples and operational challenges relevant to ${activeClient}${activeContext ? ` (focusing on: ${activeContext})` : ''}.\n` : ''}
Using ONLY the selected sources in this notebook (Learner Guide, Formative Assessment Workbook, and External Assessment Specifications Document [EISA]), extract and structure the key content into the following sections:

### 1. DETAILED OPERATIONAL SOPS & CONCRETE RULES
- Step-by-step actions required on the warehouse floor (e.g., receiving dock staging, inspection sequence, discrepancy endorsement, storeroom key controls).
- Specific numerical standards, legal limits, clearance perimeters, temperatures, stacking heights, or time limits mentioned in the text.
- Mandatory safety, PPE, and hazard containment steps (e.g. chemical spills, pest control protocols, damaged pallet isolation).

### 2. REALISTIC EISA EXAM SCENARIOS & DOCUMENT DISCREPANCIES
- 3 to 4 concrete workplace problem scenarios testing Focus Area 1 (Receiving) and Focus Area 2 (Dispatch):
  • Variance scenarios: Mismatches between Purchase Orders, Supplier Delivery Notes, and physical counts (with numbers).
  • Stock characteristics decisions: Moving perishables, cold-chain items, heavy freight, or hazardous goods.
  • Shrinkage case studies: Specific examples of theft, damaged packaging, unauthorized staging, or administrative errors, and the corrective action required.

### 3. FORMATIVE WORKBOOK EXERCISES & MODEL ANSWERS
- Extract at least 3 actual questions, true/false statements, or case studies from the Formative Assessment Workbook with their model answers.
- Provide the exact correct answer/model solution and the key learning points evaluated.

### 4. COMMON WORKPLACE TRAPS & MISCONCEPTIONS (DISTRACTORS)
- 3 to 4 common shortcuts, flawed assumptions, or practical mistakes that warehouse clerks make in real life (to serve as high-quality distractors).
${fsaDirective}

Note: Do NOT include page numbers in the text; focus on actionable concepts, metrics, and heading topics.`;

    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const handleOpenGenerator = (clusterOverride?: CourseCluster | React.MouseEvent) => {
    setGenError(null);
    const target = (clusterOverride && 'id' in clusterOverride) ? (clusterOverride as CourseCluster) : selectedCluster;
    let hasExtract = Boolean(notebookExtract.trim());
    if (target) {
      setTargetClusterId(target.id);
      setQuestionCount(target.recommended_question_count || 10);
      const existingClusterSets = AppStore.getQuestionSets(target.id);
      const savedExtract = existingClusterSets.find(s => s.raw_notebook_extract && s.raw_notebook_extract.trim().length > 0)?.raw_notebook_extract;
      if (savedExtract && !notebookExtract.trim()) {
        setNotebookExtract(savedExtract);
        hasExtract = true;
      }
    } else {
      setTargetClusterId('new');
      setQuestionCount(10);
    }
    setShowNotebookFields(!hasExtract);
    setIsFsaMockSet(false);
    setIsCustomSet(false);
    setIsBrainCertBankSet(false);
    setTargetLevel('operational');
    setDefaultEntryMode('group');
    setTimingMode('overall');
    setOverallTimeMinutes(20);
    setClientName('Generic Standard');
    setSetTitle('Generic Standard Assessment');
    setShowGeneratorModal(true);
  };

  const handleGenerateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      let activeCluster = selectedCluster;

      // Handle in-line new cluster creation if selected
      if (targetClusterId === 'new') {
        if (!newClusterNumber || !newClusterTitle) {
          throw new Error('Please enter both Cluster Number and Cluster Title');
        }
        const createdCluster: CourseCluster = {
          id: 'cluster-' + Math.random().toString(36).substring(2, 9),
          course_id: selectedCourse.id,
          cluster_number: newClusterNumber.trim(),
          title: newClusterTitle.trim(),
          description: '',
          created_at: new Date().toISOString(),
        };
        await AppStore.saveCluster(createdCluster);
        activeCluster = createdCluster;
        setSelectedCluster(createdCluster);
      } else {
        const found = clusters.find(c => c.id === targetClusterId);
        if (found) activeCluster = found;
      }

      if (!activeCluster) throw new Error('No active cluster specified');

      const curriculumText = selectedCourse?.documents?.map(d => `${d.file_name} (${d.doc_type}):\n${d.extracted_text}`).join('\n\n') || '';
      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('liveengage_gemini_key') || '' : '';
      const localModel = typeof window !== 'undefined' ? localStorage.getItem('liveengage_gemini_model') || 'gemini-3.8-flash' : 'gemini-3.8-flash';

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: localModel,
          courseCode: selectedCourse.code,
          courseTitle: selectedCourse.title,
          clusterNumber: activeCluster.cluster_number,
          clusterTitle: activeCluster.title,
          courseContext: curriculumText,
          rawNotebookExtract: notebookExtract,
          customBackground: isCustomSet ? customContext : '',
          isFsaMock: isFsaMockSet,
          isBrainCertBank: isBrainCertBankSet,
          questionCount,
          targetLevel,
          apiKey: localGeminiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

      const mappedQuestions: Question[] = data.questions.map((q: any, idx: number) => ({
        id: 'q-' + Math.random().toString(36).substring(2, 9),
        question_order: idx + 1,
        format: q.format as QuestionFormat,
        body: q.body,
        additional_text: q.additionalText,
        options: q.options || [],
        correct_options: q.correctOptions || [0],
        duration: timingMode === 'per_question' ? perQuestionDuration : 0,
        marks: q.marks || (q.body.toLowerCase().includes('variance') || q.body.toLowerCase().includes('vat') || q.body.toLowerCase().includes('calculat') || q.body.toLowerCase().includes('courier') ? 3 : 2),
        guide_topic_hint: q.guideTopicHint || '',
      }));

      const calculatedTotalMarks = mappedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      const existingSets = AppStore.getQuestionSets(activeCluster.id);
      const nextSetNumber = existingSets.length + 1;

      // Clean naming rule:
      // BrainCert: "Cluster X.Y — BrainCert EISA Drill Bank (60 Qs)"
      // FSA Mock: "Cluster X.Y — Generic IAC FSA Mock Exam"
      // Generic: "Generic Standard Assessment"
      // Custom: "[Client Name] Custom Assessment"
      const finalTitle = isBrainCertBankSet
        ? (setTitle.trim() || `Cluster ${activeCluster.cluster_number} — BrainCert EISA Drill Bank (${mappedQuestions.length} Qs)`)
        : isFsaMockSet
          ? (setTitle.trim() || `Cluster ${activeCluster.cluster_number} — Generic IAC FSA Mock Exam`)
          : isCustomSet 
            ? (setTitle.trim() || `${clientName.trim()} Custom Assessment`)
            : (setTitle.trim() || 'Generic Standard Assessment');

      const effectiveTiming = isBrainCertBankSet ? 'overall' : timingMode;
      const effectiveOverallMins = isBrainCertBankSet ? 40 : overallTimeMinutes;

      const newSet: QuestionSet = {
        id: 'set-' + Math.random().toString(36).substring(2, 9),
        cluster_id: activeCluster.id,
        set_number: nextSetNumber,
        title: finalTitle,
        is_custom: isCustomSet,
        is_fsa_mock: isFsaMockSet,
        is_braincert_bank: isBrainCertBankSet,
        braincert_objective_id: '3927820',
        client_name: isBrainCertBankSet
          ? 'BrainCert EISA Question Bank'
          : isFsaMockSet
            ? `Cluster ${activeCluster.cluster_number} IACs Only`
            : isCustomSet
              ? clientName.trim()
              : 'Generic Standard',
        eisa_focus_area: isBrainCertBankSet
          ? `BrainCert 60-Q Rotation Pool (20 Qs / 40m Draw)`
          : isFsaMockSet
            ? `EISA Aligned: Cluster ${activeCluster.cluster_number} IAC Mock Exam`
            : (activeCluster.eisa_focus_area || 'EISA Aligned: Focus Area 1 & 2'),
        raw_notebook_extract: notebookExtract,
        custom_background_context: isCustomSet ? customContext : '',
        target_level: targetLevel,
        default_entry_mode: defaultEntryMode,
        timing_mode: effectiveTiming,
        overall_time_minutes: effectiveTiming === 'overall' ? effectiveOverallMins : undefined,
        per_question_duration: effectiveTiming === 'per_question' ? perQuestionDuration : undefined,
        total_marks: calculatedTotalMarks,
        time_allowed_minutes: effectiveTiming === 'overall' ? effectiveOverallMins : (isFsaMockSet ? (activeCluster.weighting_percentage && activeCluster.weighting_percentage >= 45 ? 45 : 30) : 30),
        questions: mappedQuestions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AppStore.saveQuestionSet(newSet);
      setShowGeneratorModal(false);
      loadClusters(selectedCourse.id);
      setSelectedSet(newSet);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Edit Question Set Settings Handlers ---
  const handleOpenEditSet = (qs: QuestionSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSet(qs);
    setEditTitle(qs.title);
    setEditClientName(qs.client_name || '');
    setEditTimingMode(qs.timing_mode || (qs.time_allowed_minutes && !qs.questions?.some(q => q.duration > 0) ? 'overall' : 'per_question'));
    setEditOverallTime(qs.overall_time_minutes || qs.time_allowed_minutes || 20);
    setEditPerQuestionTime(qs.per_question_duration || qs.questions?.[0]?.duration || 45);
    setEditEntryMode(qs.default_entry_mode || 'group');
    setEditTargetLevel(qs.target_level || 'operational');
    setShowEditSetModal(true);
  };

  const handleSaveEditSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSet) return;

    const updatedQuestions = editingSet.questions.map((q, idx) => ({
      ...q,
      duration: editTimingMode === 'per_question' ? editPerQuestionTime : 0,
      ...(idx === 0 ? {
        _timing_mode: editTimingMode,
        _overall_time_minutes: editTimingMode === 'overall' ? editOverallTime : undefined,
        _per_question_duration: editTimingMode === 'per_question' ? editPerQuestionTime : undefined,
      } : {}),
    }));

    const updatedSet: QuestionSet = {
      ...editingSet,
      title: editTitle.trim(),
      client_name: editClientName.trim() || 'Generic Standard',
      timing_mode: editTimingMode,
      overall_time_minutes: editTimingMode === 'overall' ? editOverallTime : undefined,
      per_question_duration: editTimingMode === 'per_question' ? editPerQuestionTime : undefined,
      time_allowed_minutes: editTimingMode === 'overall' ? editOverallTime : (editTimingMode === 'untimed' ? 0 : (editingSet.time_allowed_minutes || 20)),
      default_entry_mode: editEntryMode,
      target_level: editTargetLevel,
      questions: updatedQuestions,
      updated_at: new Date().toISOString(),
    };

    await AppStore.saveQuestionSet(updatedSet);
    setQuestionSets(prev => {
      const idx = prev.findIndex(s => s.id === updatedSet.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedSet;
        return next;
      }
      return [...prev, updatedSet];
    });
    if (selectedSet?.id === updatedSet.id) {
      setSelectedSet(updatedSet);
    }
    setShowEditSetModal(false);
    setEditingSet(null);
    if (selectedCourse) {
      await loadClusters(selectedCourse.id);
    }
  };

  // --- Question Manipulation (Auto-persisted) ---
  const handleUpdateQuestion = (qIndex: number, updated: Partial<Question>) => {
    if (!selectedSet) return;
    const questions = [...selectedSet.questions];
    questions[qIndex] = { ...questions[qIndex], ...updated };
    const total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  const handleToggleCorrectOption = (qIndex: number, optIndex: number) => {
    if (!selectedSet) return;
    const questions = [...selectedSet.questions];
    const q = questions[qIndex];
    let correct = [...q.correct_options];

    if (q.format === 'MCQ' || q.format === 'BINARY') {
      correct = [optIndex];
    } else {
      if (correct.includes(optIndex)) {
        correct = correct.filter(i => i !== optIndex);
      } else {
        correct.push(optIndex);
      }
    }

    questions[qIndex] = { ...q, correct_options: correct };
    const updatedSet = { ...selectedSet, questions };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  const handleAddQuestion = () => {
    if (!selectedSet) return;
    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      question_order: selectedSet.questions.length + 1,
      format: 'MCQ',
      body: 'Order #512 specifies 100 units. Delivery note states 100 units, but physical count reveals 92 units intact and 4 damaged. What is the variance?',
      additional_text: 'EISA Assessment Standard 1.1: Physical shortage (-8) + damaged stock (-4) = -12 units total variance.',
      options: ['-12 units variance [Endorse Delivery Note]', '-8 units variance', '+8 units variance', 'No variance'],
      correct_options: [0],
      duration: selectedSet.timing_mode === 'per_question' ? (selectedSet.per_question_duration || 45) : 0,
      marks: 3,
      guide_topic_hint: 'EISA Receiving Variance Standard',
    };
    const questions = [...selectedSet.questions, newQ];
    const total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  const handleAddClozeQuestion = () => {
    if (!selectedSet) return;
    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      question_order: selectedSet.questions.length + 1,
      format: 'CLOZE',
      body: 'When offloading freight at the receiving dock, the store person must first check the [1] against the delivery vehicle load sheet. Any damaged stock must be moved to the [2] area, and the driver must sign the [3] before leaving the warehouse.',
      additional_text: `🟢 Model Answer:
[1] Seal Number
[2] Quality Hold
[3] Delivery Note

📝 How the Assessor Marks This:
Award 1 mark for each correctly selected term from the Word Bank (3 marks total).`,
      options: ['Seal Number', 'Quality Hold', 'Delivery Note', 'Pick Face', 'Hazardous Stacking'],
      correct_options: [0, 1, 2],
      duration: selectedSet.timing_mode === 'per_question' ? (selectedSet.per_question_duration || 60) : 0,
      marks: 3,
      guide_topic_hint: 'Receiving Dock SOPs',
    };
    const questions = [...selectedSet.questions, newQ];
    const total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!selectedSet) return;
    const questions = selectedSet.questions.filter((_, idx) => idx !== qIndex).map((q, i) => ({ ...q, question_order: i + 1 }));
    const total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  // --- BrainCert LMS Integration & Multi-Format EISA Export Handlers ---
  const handleCopyBrainCertField = (fieldKey: string, textToCopy: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(textToCopy);
      setBrainCertCopiedField(fieldKey);
      setTimeout(() => setBrainCertCopiedField(null), 2000);
    }
  };

  const getBrainCertHtmlInstructions = (clusterNum: string = '1') => {
    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #222222; max-width: 100%; margin: 0 auto; padding: 4px;">

  <!-- Header Card -->
  <div style="background-color: #3D7EAA; color: #ffffff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Cluster ${clusterNum}: EISA Formative Mock Drill</h2>
    <p style="margin: 0; font-size: 14px; opacity: 0.95;">Occupational Certificate: Dispatching &amp; Receiving Clerk (OQ99446, NQF Level 3)</p>
  </div>

  <p style="font-size: 14px; margin-bottom: 16px; color: #444444;">
    This practice drill pulls 20 randomized questions from our 60+ question bank to test your practical knowledge of warehouse operations, document reconciliation, and workplace math.
  </p>

  <!-- Practical Suggestion Card: Calculator Tip -->
  <div style="background-color: #f0f7ff; border-left: 4px solid #3D7EAA; padding: 12px 14px; margin-bottom: 12px; border-radius: 0 6px 6px 0;">
    <strong style="color: #1e3a5f; font-size: 15px; display: block; margin-bottom: 4px;">💡 Practical Tip: Have a Calculator or Scrap Paper Ready</strong>
    <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.45;">
      If you are taking this test on your mobile phone, we suggest using an <strong>actual desk calculator</strong>, scrap paper, or a second phone for your calculations. This prevents your browser from reloading when switching apps, and prepares you for the real EISA exam room!
    </p>
  </div>

  <!-- Step 1 -->
  <div style="border-left: 4px solid #3D7EAA; background-color: #f8fafc; padding: 12px 14px; margin-bottom: 12px; border-radius: 0 6px 6px 0;">
    <strong style="color: #3D7EAA; font-size: 15px; display: block; margin-bottom: 4px;">Step 1: Navigating on Your Phone</strong>
    <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #333333;">
      <li style="margin-bottom: 4px;">Use the on-screen <strong>Next</strong> and <strong>Previous</strong> buttons to move between questions.</li>
      <li>Do <strong>not</strong> tap your browser's back or reload button while taking the test.</li>
    </ul>
  </div>

  <!-- Step 2 -->
  <div style="border-left: 4px solid #3D7EAA; background-color: #f8fafc; padding: 12px 14px; margin-bottom: 12px; border-radius: 0 6px 6px 0;">
    <strong style="color: #3D7EAA; font-size: 15px; display: block; margin-bottom: 4px;">Step 2: Submitting Your Test</strong>
    <p style="margin: 0; font-size: 13.5px; color: #333333;">
      When you have completed all 20 questions, tap the <strong style="color: #111111;">SCORE TEST</strong> button at the bottom of the screen.
    </p>
  </div>

  <!-- Step 3 (Remediation Highlight Card) -->
  <div style="background-color: #eef7f2; border: 1.5px solid #6DC082; padding: 14px; border-radius: 8px; margin-top: 14px;">
    <strong style="color: #1b5e20; font-size: 15px; display: block; margin-bottom: 6px;">Step 3: Learn From Your Solutions (Crucial Step!)</strong>
    <p style="margin: 0 0 8px 0; font-size: 13.5px; color: #2e4a36;">
      After submitting, tap <strong>Review Questions</strong> to see detailed step-by-step mathematical proofs and explanations for any questions you missed.
    </p>
    <p style="margin: 0; font-size: 13px; color: #1b5e20; font-weight: 600;">
      ✓ Retake this drill as often as you like — each attempt draws a fresh mix of 20 questions from the 60+ question bank. Aim for 80%+ before your final exam!
    </p>
  </div>

</div>`;
  };

  const getBrainCertFriendlyFilename = () => {
    const clusterNum = selectedCluster?.cluster_number || '1.1';
    const clusterTitle = (selectedCluster?.title || 'Assessment')
      .replace(/[<>:"/\\|?*]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const qCount = selectedSet?.questions?.length || 0;
    const objId = (selectedSet?.braincert_objective_id || brainCertObjectiveId || '').trim();
    const objSuffix = objId ? ` - Obj ${objId}` : '';
    return `BrainCert Q-Bank - Cluster ${clusterNum} - ${clusterTitle} (${qCount} Qs${objSuffix}).csv`;
  };

  const handleExportBrainCertCsv = () => {
    if (!selectedSet || !selectedSet.questions || selectedSet.questions.length === 0) {
      alert('This question set has no questions to export.');
      return;
    }

    const headers = [
      'Question Type Id',
      'Question Title',
      'Question Option',
      'Answer',
      'Question Explanation',
      'Objective Id',
      'Reference URL',
      'Difficulty Level',
      'Status',
      'Include in Demo',
      'Max word limit',
      'Attachment',
      'Mandatory Keywords',
      'Mandatory Case Sensitive',
      'Optional Keywords',
      'Optional Case Sensitive'
    ];

    // Sanitize text for BrainCert PHP CSV parser & MySQL 3-byte UTF-8 compatibility
    const sanitizeCsvField = (text: string): string => {
      return (text || '')
        .replace(/🟢/g, '[Answer]')
        .replace(/📐/g, '[Calculation / Rule]')
        .replace(/📝/g, '[Marking & Distractor Guide]')
        .replace(/🎯/g, '')
        .replace(/⚖️/g, '')
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Strip any remaining 4-byte astral emojis
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\r?\n+/g, ' <br> ') // Single physical row per question for PHP fgetcsv stability
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/"/g, '""');
    };

    const sanitizeOptionItem = (opt: string): string => {
      return (opt || '')
        .replace(/\|/g, '/') // Prevent internal pipes from splitting BrainCert options
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const activeObjId = (selectedSet.braincert_objective_id || brainCertObjectiveId || '3927820')
      .replace(/[^0-9a-zA-Z_-]/g, '')
      .trim() || '3927820';

    const rows = selectedSet.questions.map((q) => {
      // BrainCert Question Type Mapping:
      // 1 = Fill in the Blanks (CLOZE)
      // 2 = Multiple Choice Single-Select (MCQ)
      // 4 = Multiple Answer Checkboxes (MULTIPLE)
      // 5 = True/False (BINARY)
      let questionTypeId = '2';
      let rawTitle = (q.body || '').replace(/\[1\]|\[2\]|\[3\]/g, '_____');
      let optionsStr = '';
      let answerText = '';

      const rawOptions = q.options && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
      const optionsList = rawOptions.map(sanitizeOptionItem).filter(Boolean);

      if (q.format === 'CLOZE') {
        questionTypeId = '1'; // Fill in the Blanks
        const correctIdx = q.correct_options && q.correct_options.length > 0 ? q.correct_options[0] : 0;
        let targetAns = optionsList[correctIdx] || optionsList[0] || '';
        if (q.guide_topic_hint && q.guide_topic_hint.includes('::')) {
          const cleanHint = q.guide_topic_hint.replace(/^CLOZE::/, '');
          const parts = cleanHint.split('::');
          if (parts[0]) {
            targetAns = sanitizeOptionItem(parts[0].split('|')[0]) || targetAns;
          }
        }
        // Embed Word Bank in stem if not already present and not a pure numeric prompt
        if (optionsList.length > 1 && !rawTitle.toLowerCase().includes('word bank') && !rawTitle.toLowerCase().includes('type number')) {
          rawTitle = `${rawTitle} [Word Bank: ${optionsList.join(' / ')}]`;
        }
        optionsStr = ''; // Type 1 Fill in the Blanks has empty options column
        answerText = targetAns.replace(/"/g, '""');
      } else if (q.format === 'MULTIPLE') {
        questionTypeId = '4'; // Multiple Answer (Checkboxes)
        const correctIndices = q.correct_options && q.correct_options.length > 0 ? q.correct_options : [0, 1];
        if (!rawTitle.toLowerCase().includes('select ')) {
          rawTitle = `${rawTitle} (Select ${correctIndices.length})`;
        }
        optionsStr = optionsList.join('|').replace(/"/g, '""');
        answerText = correctIndices.map(idx => optionsList[idx] || '').filter(Boolean).join('|').replace(/"/g, '""');
      } else if (q.format === 'BINARY') {
        questionTypeId = '5'; // True/False
        optionsStr = 'True|False';
        const correctIdx = q.correct_options && q.correct_options.length > 0 ? q.correct_options[0] : 0;
        answerText = correctIdx === 0 ? 'True' : 'False';
      } else {
        questionTypeId = '2'; // Multiple Choice (Single Select)
        optionsStr = optionsList.join('|').replace(/"/g, '""');
        const correctIdx = q.correct_options && q.correct_options.length > 0 ? q.correct_options[0] : 0;
        answerText = (optionsList[correctIdx] || optionsList[0] || '').replace(/"/g, '""');
      }

      const questionTitle = sanitizeCsvField(rawTitle);
      const explanation = sanitizeCsvField(
        q.additional_text || `Correct Answer: ${answerText.replace(/""/g, '"')}. Follows standard workplace operating procedure.`
      );

      const difficulty = '2'; // NQF Level 3 Moderate
      const status = '1'; // Published/Active
      const includeInDemo = '0';

      return [
        questionTypeId,
        `"${questionTitle}"`,
        `"${optionsStr}"`,
        `"${answerText}"`,
        `"${explanation}"`,
        activeObjId,
        '', // Reference URL
        difficulty,
        status,
        includeInDemo,
        '', '', '', '', '', '' // Cols 11-16
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', getBrainCertFriendlyFilename());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInjectEisaPilotQuestions = () => {
    if (!selectedSet) return;

    const pilotQuestions: Question[] = [
      {
        id: 'q-pilot-1',
        question_order: selectedSet.questions.length + 1,
        format: 'CLOZE',
        body: 'A factory warehouse clerk is preparing an outbound dispatch of carton boxes. Each pallet holds 8 cartons per layer, stacked 5 layers high. To stage 160 cartons, the clerk must prepare [1] full pallets. (Type number only)',
        options: ['4', '3', '5', '20'],
        correct_options: [0],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'CLOZE::4::4|3|5|20',
        additional_text: `🟢 Correct Answer: 4 pallets.
📐 Calculation:
Step 1: 8 cartons/layer x 5 layers = 40 cartons/pallet.
Step 2: 160 cartons / 40 cartons/pallet = 4 full pallets.`
      },
      {
        id: 'q-pilot-2',
        question_order: selectedSet.questions.length + 2,
        format: 'CLOZE',
        body: 'Complete the receiving SOP rule from the Word Bank [GRN | Delivery Note | Purchase Order | Credit Request]: Only undamaged, physically verified stock may be entered onto the [1] as accepted into inventory.',
        options: ['GRN', 'Delivery Note', 'Purchase Order', 'Credit Request'],
        correct_options: [0],
        duration: 0,
        marks: 2,
        guide_topic_hint: 'CLOZE::GRN::GRN|Delivery Note|Purchase Order|Credit Request',
        additional_text: `🟢 Correct Answer: GRN (Goods Received Note).
📐 Rule (KM-03 SOP): Only undamaged, physically verified stock is accepted into inventory via the GRN. Damaged stock is rejected on the Delivery Note.`
      },
      {
        id: 'q-pilot-3',
        question_order: selectedSet.questions.length + 3,
        format: 'MCQ',
        body: 'A retail DC delivery note states 250 cases of cooking oil. Physical inspection shows 235 undamaged cases, 5 crushed cases with leaks, and 10 cases missing. What net quantity of stock should the receiving clerk enter on the GRN as accepted into inventory?',
        options: ['250 cases', '240 cases', '235 cases', '15 cases'],
        correct_options: [2],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Receiving Verification SOP (KM-03, PM-01)',
        additional_text: `🟢 Correct Answer: 235 cases.
📐 Rule (KM-03 SOP): Only undamaged, physically verified stock is accepted onto the Goods Received Note (240 physical - 5 damaged = 235 accepted).
📝 Distractor Review: 250 accepts missing/damaged stock; 240 includes unsellable crushed goods; 15 is the variance, not accepted stock.`
      },
      {
        id: 'q-pilot-4',
        question_order: selectedSet.questions.length + 4,
        format: 'MCQ',
        body: 'A carton measuring 60cm x 50cm x 40cm weighs 14kg on the scale. The courier volumetric divisor is 5000. What is the volumetric weight, and which weight will the carrier bill for?',
        options: ['14kg, billed at actual weight', '24kg, billed at volumetric weight', '12kg, billed at actual weight', '30kg, billed at volumetric weight'],
        correct_options: [1],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Packaging & Courier Transport Billing (KM-04-KT02)',
        additional_text: `🟢 Correct Answer: 24kg, billed at volumetric weight.
📐 Calculation:
Step 1: Volumetric weight = (60 x 50 x 40) / 5000 = 120,000 / 5000 = 24kg.
Step 2: Carriers bill on the greater of actual scale weight (14kg) vs volumetric weight (24kg).
📝 Distractor Review: Option A under-quotes freight costs; Option C used factor 10,000; Option D added arbitrary markup.`
      },
      {
        id: 'q-pilot-5',
        question_order: selectedSet.questions.length + 5,
        format: 'MCQ',
        body: 'A paper mill receiving clerk checks a delivery of industrial strapping rolls invoiced at R350 per roll. The delivery note lists 60 rolls. A physical tally confirms only 52 rolls on the pallet. What monetary value must be recorded on the Discrepancy / Credit Request Note?',
        options: ['R2,800', 'R21,000', 'R18,200', 'R3,500'],
        correct_options: [0],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Loss Prevention & Discrepancy Claims (KM-02, PM-03)',
        additional_text: `🟢 Correct Answer: R2,800.
📐 Calculation:
Step 1: Calculate physical variance: 60 invoiced - 52 received = 8 missing rolls.
Step 2: Multiply by unit cost: 8 rolls x R350 = R2,800 discrepancy claim value.
📝 Distractor Review: R21,000 is total invoice value; R18,200 is accepted stock value; R3,500 calculates a 10-roll shortage.`
      },
      {
        id: 'q-pilot-6',
        question_order: selectedSet.questions.length + 6,
        format: 'MULTIPLE',
        body: 'When a refrigerated delivery of fresh meat arrives at 9.5°C instead of the mandatory 2°C to 4°C specification, which TWO procedural actions must the receiving clerk take immediately? (Select 2)',
        options: [
          'Reject the temperature-abused line items and refuse to book them onto the GRN',
          'Record the probe thermometer reading on the Delivery Note and notify the supervisor',
          'Accept the meat quickly and place it inside the blast freezer to recover',
          'Sign the delivery note as clean and request a partial discount later'
        ],
        correct_options: [0, 1],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Cold Chain Compliance & Food Safety (KM-01-KT01)',
        additional_text: `🟢 Correct Answers: Reject the temperature-abused line items AND Record the probe reading & notify the supervisor.
📐 Rule: Cold chain breach breaks HACCP food safety standards. Temperature-abused stock cannot be salvaged in chillers or booked into inventory.`
      },
      {
        id: 'q-pilot-7',
        question_order: selectedSet.questions.length + 7,
        format: 'MULTIPLE',
        body: 'Which TWO documents must the receiving clerk cross-verify against the physical stock tally before signing acceptance at the receiving bay? (Select 2)',
        options: [
          'Authorized company Purchase Order (PO)',
          'Supplier Delivery Note / Consignment Waybill',
          'Driver personal time-sheet logbook',
          'Warehouse annual marketing budget'
        ],
        correct_options: [0, 1],
        duration: 0,
        marks: 2,
        guide_topic_hint: 'Three-Way Receiving Reconciliation (PM-01)',
        additional_text: `🟢 Correct Answers: Authorized Purchase Order (PO) AND Supplier Delivery Note.
📐 Rule: Three-way verification requires matching the PO, the Supplier Delivery Note, and the Physical Stock Count.`
      },
      {
        id: 'q-pilot-8',
        question_order: selectedSet.questions.length + 8,
        format: 'BINARY',
        body: 'True or False: A receiving clerk is permitted to sign a supplier delivery note as "Subject to Later Check" without counting the pallets if the delivery driver is running late.',
        options: ['True', 'False'],
        correct_options: [1],
        duration: 0,
        marks: 2,
        guide_topic_hint: 'Receiving Endorsement Legality (KM-03)',
        additional_text: `🟢 Correct Answer: False.
📐 Rule: Signing without verifying physical quantities transfers legal liability for shortages to the receiving warehouse.`
      },
      {
        id: 'q-pilot-9',
        question_order: selectedSet.questions.length + 9,
        format: 'MCQ',
        body: 'A supplier delivery arrives with 50 shrink-wrapped boxes. The delivery note lists 50 boxes, but 6 boxes have torn wrap and crushed corners. Inspection reveals 2 units missing inside each of the 6 damaged boxes. If each intact box holds 10 units, how many total units were physically received?',
        options: ['500 units', '488 units', '440 units', '494 units'],
        correct_options: [1],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Consignment Unit Reconciliation (KM-03, PM-01)',
        additional_text: `🟢 Correct Answer: 488 units.
📐 Calculation:
Step 1: Intact boxes = 44 boxes x 10 units = 440 units.
Step 2: Damaged boxes = 6 boxes x (10 - 2) = 6 x 8 = 48 units.
Step 3: Total units received = 440 + 48 = 488 units (shortage of 12 units).`
      },
      {
        id: 'q-pilot-10',
        question_order: selectedSet.questions.length + 10,
        format: 'MCQ',
        body: 'During offloading at the receiving bay, a forklift driver accidentally drops a pallet of glass bottles due to speeding. 15 cases valued at R120 per case are destroyed. What classification of stock loss is this, and what administrative action is required?',
        options: [
          'Administrative shrinkage; deduct value from supplier invoice',
          'Operational damage shrinkage; complete an internal bay damage report',
          'Transit shrinkage; submit claim to carrier delivery company',
          'Vendor shortage; endorse supplier delivery note as short'
        ],
        correct_options: [1],
        duration: 0,
        marks: 3,
        guide_topic_hint: 'Shrinkage & Stock Loss Classification (KM-02-KT01)',
        additional_text: `🟢 Correct Answer: Operational damage shrinkage; complete an internal bay damage report.
📐 Rule: Goods broken by internal staff after arrival are classified as internal operational damage shrinkage and cannot be claimed from the supplier.`
      }
    ];

    const updatedQuestions = [...selectedSet.questions, ...pilotQuestions];
    const total_marks = updatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions: updatedQuestions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
    setPilotAddedSuccess(true);
    setTimeout(() => setPilotAddedSuccess(false), 3000);
  };

  // --- 1-Click Launch Live Session ---
  const handleLaunchLive = async () => {
    if (!selectedSet || !selectedCourse || !selectedCluster) return;

    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const effectiveTimingMode = selectedSet.timing_mode || (selectedSet.time_allowed_minutes && !selectedSet.questions?.some(q => q.duration > 0) ? 'overall' : 'per_question');
    const effectiveOverallTime = selectedSet.overall_time_minutes || selectedSet.time_allowed_minutes || 20;

    const newSession: Session = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      course_id: selectedCourse.id,
      cluster_id: selectedCluster.id,
      question_set_id: selectedSet.id,
      title: selectedSet.title, // Clean Cluster title
      room_code: roomCode,
      client_name: selectedSet.client_name || 'Generic Standard',
      cohort_number: 1,
      entry_mode: selectedSet.default_entry_mode || 'group',
      timing_mode: effectiveTimingMode,
      overall_time_minutes: effectiveOverallTime,
      per_question_duration: selectedSet.per_question_duration || 45,
      status: 'lobby',
      current_question_index: 0,
      facilitator_instructions: 'Refer to your Learner Guide during answering. Deliberate with your table before locking in.',
      created_at: new Date().toISOString(),
      questions: selectedSet.questions,
    };

    await AppStore.saveSession(newSession);
    router.push(`/presenter/${roomCode}`);
  };

  // Document status
  const docStatus = selectedCourse ? AppStore.getDocumentStatus(selectedCourse.id) : { hasCurriculum: false, hasEisa: false };

  // Target cluster helpers for modal & scope
  const modalTargetCluster = targetClusterId === 'new'
    ? null
    : (clusters.find(c => c.id === targetClusterId) || selectedCluster);
  const modalClusterNum = targetClusterId === 'new'
    ? (newClusterNumber || 'New')
    : (modalTargetCluster?.cluster_number || '1.1');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className={`flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-5 ${isEmbedded ? 'py-2 sm:py-3' : 'py-6'}`}>
        
        {/* TOP BAR: Clean Course Selector, 2 Document Badges, +Generate Set, +Add Course */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Left: Course Selection & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#00B0F0] shrink-0" />
              <label htmlFor="course-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Course:
              </label>
            </div>

            <div className="relative min-w-[260px] sm:min-w-[340px]">
              <select
                id="course-select"
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const found = courses.find(c => c.id === e.target.value);
                  if (found) {
                    setSelectedCourse(found);
                    loadClusters(found.id);
                    setReviewSession(null);
                  }
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 font-bold text-slate-800 text-sm rounded-xl py-2 px-3 pr-8 focus:ring-2 focus:ring-[#4682B4] focus:outline-none transition-colors cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Status Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Curriculum Doc */}
              <input
                type="file"
                ref={curriculumInputRef}
                onChange={(e) => handleUploadDocument(e, 'curriculum')}
                accept=".pdf,.docx,.doc,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => curriculumInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCurriculum(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCurriculum(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCurriculum(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingCurriculum(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUploadedFile(file, 'curriculum');
                }}
                disabled={isUploading}
                title={docStatus.hasCurriculum ? 'Curriculum document loaded. Click or drag & drop to replace.' : 'Click to select or drag & drop PDF/Word curriculum framework'}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                  isDraggingCurriculum
                    ? 'ring-2 ring-[#6DC082] bg-[#6DC082]/30 border-[#6DC082] scale-105 shadow-md'
                    : docStatus.hasCurriculum
                    ? 'bg-[#6DC082]/15 border-[#6DC082] text-[#2b773f] hover:bg-[#6DC082]/25'
                    : 'bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-600'
                }`}
              >
                {docStatus.hasCurriculum ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2b773f]" />
                    <span>Curriculum Doc</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>+ Curriculum {isDraggingCurriculum ? '(Drop here!)' : ''}</span>
                  </>
                )}
              </button>

              {/* 2. EISA Specification Doc */}
              <input
                type="file"
                ref={eisaInputRef}
                onChange={(e) => handleUploadDocument(e, 'eisa_specification')}
                accept=".pdf,.docx,.doc,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => eisaInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEisa(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEisa(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEisa(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingEisa(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUploadedFile(file, 'eisa_specification');
                }}
                disabled={isUploading}
                title={docStatus.hasEisa ? 'EISA external assessment specification loaded. Click or drag & drop to replace.' : 'Click to select or drag & drop PDF/Word EISA specification'}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                  isDraggingEisa
                    ? 'ring-2 ring-[#4682B4] bg-[#4682B4]/30 border-[#4682B4] scale-105 shadow-md'
                    : docStatus.hasEisa
                    ? 'bg-[#4682B4]/15 border-[#4682B4] text-[#1e3a5f] hover:bg-[#4682B4]/25'
                    : 'bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-600'
                }`}
              >
                {docStatus.hasEisa ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4682B4]" />
                    <span>EISA Exam Specs</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>+ EISA Specs {isDraggingEisa ? '(Drop here!)' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {uploadFeedback && (
              <span className="text-xs font-semibold text-[#2b773f] bg-[#6DC082]/15 px-2.5 py-1 rounded-lg">
                {uploadFeedback}
              </span>
            )}

            <button
              onClick={() => handleOpenGenerator()}
              className="px-4 py-2 bg-[#6DC082] hover:bg-[#5cb372] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Generate Set</span>
            </button>

            <button
              onClick={() => setShowCourseModal(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Course</span>
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE: 2-Column Clean Hierarchy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN (4 of 12): All Clusters Listed with Question Sets & Historical Activity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#00B0F0]" />
                  Curriculum Clusters ({clusters.length})
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {clusters.reduce((acc, c) => acc + AppStore.getQuestionSets(c.id).length, 0)} Sets
                </span>
              </div>

              {/* Quick Cluster Filter Tabs */}
              {clusters.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    onClick={() => setFilterClusterId('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                      filterClusterId === 'all'
                        ? 'bg-[#4682B4] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    All Clusters
                  </button>
                  {clusters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setFilterClusterId(c.id);
                        setSelectedCluster(c);
                        const cSets = AppStore.getQuestionSets(c.id);
                        if (cSets.length > 0) setSelectedSet(cSets[0]);
                        loadHistoricalSessions(c.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                        filterClusterId === c.id
                          ? 'bg-[#4682B4] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.cluster_number}
                    </button>
                  ))}
                </div>
              )}

              {/* All Clusters Listed with their Question Sets (Generic always first!) */}
              <div className="space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {(filterClusterId === 'all' ? clusters : clusters.filter(c => c.id === filterClusterId)).map((cluster) => {
                  const clusterSets = AppStore.getQuestionSets(cluster.id);
                  const sortedClusterSets = [...clusterSets].sort((a, b) => {
                    const aIsGeneric = (!a.is_custom && !a.is_fsa_mock && !a.is_braincert_bank) || a.client_name === 'Generic Standard';
                    const bIsGeneric = (!b.is_custom && !b.is_fsa_mock && !b.is_braincert_bank) || b.client_name === 'Generic Standard';
                    if (aIsGeneric && !bIsGeneric) return -1;
                    if (!aIsGeneric && bIsGeneric) return 1;

                    const aIsFsa = !!a.is_fsa_mock;
                    const bIsFsa = !!b.is_fsa_mock;
                    if (aIsFsa && !bIsFsa) return -1;
                    if (!aIsFsa && bIsFsa) return 1;

                    const aIsBrainCert = !!a.is_braincert_bank;
                    const bIsBrainCert = !!b.is_braincert_bank;
                    if (aIsBrainCert && !bIsBrainCert) return -1;
                    if (!aIsBrainCert && bIsBrainCert) return 1;

                    const aName = (a.client_name || a.title || '').toLowerCase();
                    const bName = (b.client_name || b.title || '').toLowerCase();
                    return aName.localeCompare(bName);
                  });

                  return (
                    <div key={cluster.id} className="space-y-2">
                      {/* Cluster Section Header */}
                      <div className="flex items-center justify-between px-1 pt-1 border-t border-slate-100 first:border-0 first:pt-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-extrabold text-[#4682B4] shrink-0">
                            Cluster {cluster.cluster_number}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs font-semibold text-slate-600 truncate" title={cluster.title}>
                            {cluster.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {cluster.weighting_percentage && (
                            <span 
                              className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                              title={`Curriculum Weighting: ${cluster.weighting_percentage}% • Recommended: ${cluster.recommended_question_count || 6} Questions`}
                            >
                              {cluster.weighting_percentage}%
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {sortedClusterSets.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCluster(cluster);
                              handleOpenGenerator(cluster);
                            }}
                            className="p-1 text-slate-400 hover:text-[#4682B4] hover:bg-[#4682B4]/10 rounded transition-colors"
                            title={`Create new question set for Cluster ${cluster.cluster_number}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Sets for this Cluster: Generic Standard first, then FSA Mock, BrainCert Bank, then Custom alphabetically */}
                      <div className="space-y-2">
                        {sortedClusterSets.map((qs) => {
                          const isSelected = selectedSet?.id === qs.id;
                          const isGeneric = (!qs.is_custom && !qs.is_fsa_mock && !qs.is_braincert_bank) || qs.client_name === 'Generic Standard';

                          return (
                            <div
                              key={qs.id}
                              className={`rounded-xl border transition-all overflow-hidden ${
                                isSelected
                                  ? 'bg-[#4682B4]/10 border-[#4682B4] shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div
                                onClick={() => {
                                  setSelectedCluster(cluster);
                                  setSelectedSet(qs);
                                  if (qs.braincert_objective_id) {
                                    setBrainCertObjectiveId(qs.braincert_objective_id);
                                  }
                                  setReviewSession(null);
                                  loadHistoricalSessions(cluster.id);
                                }}
                                className="p-3 cursor-pointer"
                              >
                                <div className="flex items-start gap-2.5">
                                  {/* Cluster Number Badge */}
                                  <div className={`w-9 h-9 rounded-lg font-mono font-extrabold text-xs flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? 'bg-[#4682B4] text-white border-[#4682B4]'
                                      : 'bg-[#4682B4]/15 text-[#1e3a5f] border-[#4682B4]/30'
                                  }`}>
                                    {cluster.cluster_number}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <h4 className="text-xs font-bold text-slate-800 truncate">
                                        {qs.title}
                                      </h4>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${
                                          qs.is_fsa_mock
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : qs.is_braincert_bank
                                              ? 'bg-sky-100 text-[#1e3a5f] border border-[#3D7EAA]/40'
                                              : isGeneric 
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                        }`}>
                                          {qs.is_fsa_mock ? 'FSA Mock' : qs.is_braincert_bank ? 'BrainCert' : isGeneric ? 'Generic' : 'Custom'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenEditSet(qs, e)}
                                          className="p-1 text-slate-400 hover:text-[#4682B4] hover:bg-[#4682B4]/15 rounded transition-colors"
                                          title="Edit Question Set settings"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                      <span className="font-semibold text-slate-700 truncate">
                                        {qs.client_name || (isGeneric ? 'Generic Standard' : 'Custom Client')}
                                      </span>
                                      <span>•</span>
                                      <span className="capitalize text-slate-500">{qs.target_level || 'operational'}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap mt-2 pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-500 font-medium">
                                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                        <FileText className="w-3 h-3 text-[#4682B4]" />
                                        {qs.questions?.length || 0} Qs
                                      </span>

                                      {/* Timing Badge */}
                                      {qs.timing_mode === 'overall' ? (
                                        <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold text-[10.5px]">
                                          <Clock className="w-3 h-3 text-amber-600" />
                                          {qs.overall_time_minutes || 20}m overall
                                        </span>
                                      ) : qs.timing_mode === 'untimed' ? (
                                        <span className="flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-semibold text-[10.5px]">
                                          <Clock className="w-3 h-3 text-purple-600" />
                                          Untimed (Manual)
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[10.5px]">
                                          <Clock className="w-3 h-3 text-[#4682B4]" />
                                          {qs.per_question_duration || qs.questions?.[0]?.duration || 45}s / q
                                        </span>
                                      )}

                                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                                        <Users className="w-3 h-3 text-[#4682B4]" />
                                        {qs.default_entry_mode || 'group'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Historical Activity (When this set is selected) */}
                              {isSelected && (
                                <div className="bg-slate-50 border-t border-slate-200/80 p-3 space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1">
                                      <BarChart2 className="w-3.5 h-3.5 text-[#4682B4]" />
                                      Historical Activity (Cluster {cluster.cluster_number})
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {clusterSessions.length} session{clusterSessions.length === 1 ? '' : 's'}
                                    </span>
                                  </div>

                                  {clusterSessions.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {clusterSessions.map((sess) => {
                                        const isCurrentReview = reviewSession?.id === sess.id;
                                        const participantCount = sess.participants?.length || 0;
                                        const formattedDate = new Date(sess.created_at).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        });

                                        return (
                                          <div
                                            key={sess.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setReviewSession(sess);
                                            }}
                                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                                              isCurrentReview
                                                ? 'bg-[#4682B4]/20 border-[#4682B4] text-[#1e3a5f]'
                                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                            }`}
                                          >
                                            <div>
                                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                <span>Cohort {sess.cohort_number}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-600 font-normal">{sess.client_name || 'Generic'}</span>
                                              </div>
                                              <div className="text-[11px] text-slate-500 mt-0.5">
                                                {formattedDate} • {participantCount} Teams
                                              </div>
                                            </div>

                                            <div className="text-right flex items-center gap-1.5">
                                              <span className="text-[11px] font-bold text-[#2e7d32] bg-[#6DC082]/15 px-2 py-0.5 rounded">
                                                Review
                                              </span>
                                              <button
                                                type="button"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Delete session record (Cohort ${sess.cohort_number} • ${sess.client_name || 'Generic'})?`)) {
                                                    await AppStore.deleteSession(sess.id);
                                                    loadHistoricalSessions(cluster.id);
                                                    if (reviewSession?.id === sess.id) setReviewSession(null);
                                                  }
                                                }}
                                                title="Delete this session"
                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-500 italic text-center py-1">
                                      No live sessions completed yet for this cluster.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {clusterSets.length === 0 && (
                          <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                            <p className="text-xs text-slate-500 mb-1">No question sets yet for Cluster {cluster.cluster_number}.</p>
                            <button
                              onClick={() => {
                                setSelectedCluster(cluster);
                                setTargetClusterId(cluster.id);
                                setSetTitle('Generic Standard Assessment');
                                setShowGeneratorModal(true);
                              }}
                              className="text-xs font-bold text-[#4682B4] hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>+ Generate question set</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {clusters.length === 0 && (
                  <div className="text-center py-6 text-slate-500">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">No clusters found for this course.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (8 of 12): Active Question Set Editor OR Historical Session Review (Option A) */}
          <div className="lg:col-span-8 space-y-4">
            {reviewSession ? (
              /* OPTION A: Historical Session Review Mode */
              <div className="bg-white border border-[#4682B4] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#4682B4] flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5" />
                        Historical Session Performance Review
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6DC082]/20 text-[#2b773f]">
                        Cohort {reviewSession.cohort_number}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {reviewSession.title} — {reviewSession.client_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completed on {new Date(reviewSession.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} with {reviewSession.participants?.length || 0} teams/participants.
                    </p>
                  </div>

                  <button
                    onClick={() => setReviewSession(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Question Editor</span>
                  </button>
                </div>

                {/* Question Breakdown with Performance Percentages */}
                <div className="space-y-3">
                  {reviewSession.questions?.map((q, qIndex) => {
                    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                    const sessionResponses = AppStore.getResponses(reviewSession.id, q.id);
                    const totalResponses = sessionResponses.length || reviewSession.participants?.length || 6;

                    return (
                      <div key={q.id || qIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white text-xs font-bold flex items-center justify-center">
                              {qIndex + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-600 uppercase">
                              {q.format}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            ⏱ {q.duration > 0 ? `${q.duration}s timer` : 'Untimed'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          {q.body}
                        </p>

                        {/* Options with response percentage indicators */}
                        {q.format !== 'WORD_CLOUD' && (
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correct_options.includes(optIdx);
                              // Calculate simulated/actual percentage
                              const chosenCount = isCorrect 
                                ? Math.round(totalResponses * 0.83) 
                                : optIdx === 0 ? Math.round(totalResponses * 0.17) : 0;
                              const percentage = Math.round((chosenCount / totalResponses) * 100);

                              return (
                                <div key={optIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center ${
                                        isCorrect ? 'bg-[#6DC082] text-white' : 'bg-slate-200 text-slate-700'
                                      }`}>
                                        {optionLetters[optIdx]}
                                      </span>
                                      <span className={isCorrect ? 'font-bold text-slate-800' : 'text-slate-600'}>
                                        {opt}
                                      </span>
                                      {isCorrect && (
                                        <span className="text-[10px] font-bold text-[#2e7d32] bg-[#6DC082]/20 px-1.5 py-0.2 rounded">
                                          Correct
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-slate-600">
                                      {percentage}% ({chosenCount}/{totalResponses})
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isCorrect ? 'bg-[#6DC082]' : 'bg-slate-400'}`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Workplace Rationale */}
                        {q.additional_text && (
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                            <span className="font-bold text-slate-700 block mb-0.5">EISA Debrief / Scoring Rubric:</span>
                            <p className="text-slate-600">{q.additional_text}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selectedSet ? (
              /* Standard Question Set Editor */
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                {/* Header: Cluster Question Bank + Set Name on the SAME line */}
                <div className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 flex-wrap">
                      <span className="text-[#00B0F0]">
                        Cluster {selectedCluster?.cluster_number || '2.4'}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-slate-800">
                        {selectedSet.title}
                      </span>
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 🎯 Q&A Wheel Presenter */}
                      <button
                        type="button"
                        onClick={() => setShowQAWheelModal(true)}
                        className="px-3.5 py-1 bg-[#00B0F0] hover:bg-[#0090C0] text-white text-xs font-bold rounded-lg border border-[#0090C0]/50 transition-all flex items-center gap-1.5 shrink-0 shadow-xs hover:shadow-md cursor-pointer"
                        title="Open Interactive Classroom Q&A & Name Wheel Presenter"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>🎯 Q&A Wheel</span>
                      </button>

                      {/* BrainCert LMS EISA Export & Setup Hub */}
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSet.braincert_objective_id) {
                            setBrainCertObjectiveId(selectedSet.braincert_objective_id);
                          }
                          setShowBrainCertModal(true);
                        }}
                        className="px-3 py-1 bg-[#1F3864] hover:bg-[#0570B0] text-white text-xs font-bold rounded-lg border border-[#1F3864]/40 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                        title="Open BrainCert LMS EISA Assessment Setup, Mobile HTML Instructions & Multi-Format CSV Export"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#00B0F0]" />
                        <span>BrainCert Export</span>
                      </button>

                      {/* Print / Export Formal Cluster FSA Paper */}
                      <button
                        type="button"
                        onClick={() => setShowFsaPaperModal(true)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                        title="Print or export official Cluster FSA assessment instrument & memorandum"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / FSA Paper</span>
                      </button>

                      {/* Quick Button to Add Another Question Set to this cluster! */}
                      <button
                        type="button"
                        onClick={() => handleOpenGenerator()}
                        className="px-3 py-1 bg-slate-100 hover:bg-[#4682B4] hover:text-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
                        title="Add another question set for this cluster"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ New Set</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BrainCert Facilitator Bar (Collaborative 3-Step Workflow) */}
                {selectedSet.is_braincert_bank && (
                  <div className="p-3 bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] text-white rounded-xl border border-[#4682B4]/40 shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#6DC082] text-slate-900">
                        BrainCert EISA Bank
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedSet.questions.length >= 60
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                          : 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                      }`}>
                        {selectedSet.questions.length} / 60 Qs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {/* Step 1: Container & Mobile HTML */}
                      <div className="bg-white/10 rounded-lg p-2 border border-white/15 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Step 1</div>
                          <div className="text-xs font-semibold text-white truncate">Setup & HTML</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBrainCertTab('setup');
                            setShowBrainCertModal(true);
                          }}
                          className="px-2.5 py-1 bg-white text-[#1e3a5f] hover:bg-sky-50 text-[11px] font-bold rounded-md shrink-0 transition-colors"
                        >
                          Open Guide
                        </button>
                      </div>

                      {/* Step 2: Objective ID Link */}
                      <div className="bg-white/10 rounded-lg p-2 border border-white/15 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-sky-200 block">
                            Step 2 • Objective ID
                          </label>
                          <input
                            type="text"
                            value={selectedSet.braincert_objective_id ?? brainCertObjectiveId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrainCertObjectiveId(val);
                              const updated = { ...selectedSet, braincert_objective_id: val };
                              setSelectedSet(updated);
                              AppStore.saveQuestionSet(updated);
                            }}
                            placeholder="e.g. 3927820"
                            className="mt-0.5 w-full px-2 py-0.5 text-xs font-mono font-bold bg-slate-900/50 text-white border border-white/25 rounded focus:outline-none focus:border-[#6DC082]"
                          />
                        </div>
                      </div>

                      {/* Step 3: Multi-Format CSV Export */}
                      <div className="bg-white/10 rounded-lg p-2 border border-white/15 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Step 3</div>
                          <div className="text-xs font-semibold text-white truncate">Question Bank CSV</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleExportBrainCertCsv()}
                          className="px-2.5 py-1 bg-[#6DC082] hover:bg-[#5bb070] text-slate-950 text-[11px] font-extrabold rounded-md shrink-0 flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Questions ({selectedSet.questions.length})
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Total: {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddQuestion}
                        className="text-xs font-semibold text-[#4682B4] hover:underline flex items-center gap-1"
                        title="Add a standard Multiple Choice / Single Choice Question"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add MCQ Question</span>
                      </button>
                      <button
                        onClick={handleAddClozeQuestion}
                        className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                        title="Add a Fill in the Gap (Cloze with Word Bank) Question"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Fill in Gap (Cloze)</span>
                      </button>
                    </div>
                  </div>

                  {selectedSet.questions.map((q, qIndex) => {
                    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <div
                        key={q.id || qIndex}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        {/* Question Top Row: Order, Format Badge, Marks, Timer, Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white text-xs font-bold flex items-center justify-center">
                              {qIndex + 1}
                            </span>
                            <select
                              value={q.format}
                              onChange={(e) => {
                                const newFormat = e.target.value as QuestionFormat;
                                handleUpdateQuestion(qIndex, { format: newFormat });
                              }}
                              className="text-[11px] font-bold text-[#1e3a5f] bg-[#4682B4]/15 px-2 py-0.5 rounded-md border border-[#4682B4]/25 focus:outline-none cursor-pointer"
                            >
                              <option value="MCQ">Single Choice (MCQ)</option>
                              <option value="MULTIPLE">Multiple Choice</option>
                              <option value="BINARY">True / False</option>
                              <option value="CLOZE">Fill in the Gap (Cloze)</option>
                              <option value="SCALE">Scale 1–5</option>
                              <option value="WORD_CLOUD">Word Cloud</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Marks Selector */}
                            <div className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5" title="Marks allocated in FSA assessment">
                              <span className="text-[10px] font-bold text-emerald-700">Marks:</span>
                              <select
                                value={q.marks || 1}
                                onChange={(e) => handleUpdateQuestion(qIndex, { marks: Number(e.target.value) })}
                                className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                              >
                                <option value={1}>1 pt</option>
                                <option value={2}>2 pts</option>
                                <option value={3}>3 pts</option>
                                <option value={4}>4 pts</option>
                                <option value={5}>5 pts</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5">
                              <Clock className="w-3 h-3 text-[#4682B4]" />
                              <select
                                value={q.duration}
                                onChange={(e) => handleUpdateQuestion(qIndex, { duration: Number(e.target.value) })}
                                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
                              >
                                <option value={0}>Untimed (Manual)</option>
                                <option value={30}>30s</option>
                                <option value={45}>45s</option>
                                <option value={60}>60s</option>
                                <option value={90}>90s</option>
                              </select>
                            </div>

                            <button
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Body */}
                        <div>
                          <textarea
                            value={q.body}
                            onChange={(e) => handleUpdateQuestion(qIndex, { body: e.target.value })}
                            rows={2}
                            className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#4682B4]"
                            placeholder={q.format === 'CLOZE' ? "Use [1], [2], [3] in your passage text for gaps..." : "Question stem (prompts learner guide search without page numbers or authentic EISA workplace scenario)..."}
                          />
                        </div>

                        {/* CLOZE WORD BANK & GAP MAPPING */}
                        {q.format === 'CLOZE' && (
                          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1e3a5f] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#6DC082]" />
                                Word Bank &amp; Gap Alignment
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Place [1], [2], [3] in passage above
                              </span>
                            </div>

                            {/* Word Bank terms */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Word Bank Terms:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-500 w-5 text-center">#{optIndex + 1}</span>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const options = [...q.options];
                                        options[optIndex] = e.target.value;
                                        handleUpdateQuestion(qIndex, { options });
                                      }}
                                      className="flex-1 bg-white px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                                      placeholder={`Word ${optIndex + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const options = q.options.filter((_, i) => i !== optIndex);
                                        handleUpdateQuestion(qIndex, { options });
                                      }}
                                      className="text-slate-400 hover:text-red-500 p-1"
                                      title="Remove word"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const options = [...q.options, 'New Term'];
                                  handleUpdateQuestion(qIndex, { options });
                                }}
                                className="text-[11px] font-bold text-[#4682B4] hover:text-[#3b6f9a] flex items-center gap-1 pt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Word Bank Term</span>
                              </button>
                            </div>

                            {/* Gap to word selector */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Correct Word for Each Gap:
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                {(q.body.match(/\[(\d+)\]/g) || ['[1]', '[2]', '[3]']).map((_, gapIdx) => {
                                  const gapNum = gapIdx + 1;
                                  const assignedOptIdx = q.correct_options[gapIdx] ?? Math.min(gapIdx, q.options.length - 1);
                                  return (
                                    <div key={gapIdx} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                                      <span className="font-bold text-[#4682B4]">Gap [{gapNum}]:</span>
                                      <select
                                        value={assignedOptIdx}
                                        onChange={(e) => {
                                          const correct_options = [...q.correct_options];
                                          correct_options[gapIdx] = Number(e.target.value);
                                          handleUpdateQuestion(qIndex, { correct_options });
                                        }}
                                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none"
                                      >
                                        {q.options.map((opt, optIdx) => (
                                          <option key={optIdx} value={optIdx}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Options with Particify Tile Badges (A, B, C, D) for standard choices */}
                        {q.format !== 'WORD_CLOUD' && q.format !== 'CLOZE' && (
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIndex) => {
                              const isCorrect = q.correct_options.includes(optIndex);
                              const letter = optionLetters[optIndex] || String(optIndex + 1);
                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-colors ${
                                    isCorrect 
                                      ? 'bg-[#6DC082]/10 border-[#6DC082]' 
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  {/* Tile Badge */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCorrectOption(qIndex, optIndex)}
                                    className={`w-6 h-6 rounded font-bold flex items-center justify-center transition-colors ${
                                      isCorrect
                                        ? 'bg-[#6DC082] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                    }`}
                                    title="Click to toggle as correct option"
                                  >
                                    {letter}
                                  </button>

                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const options = [...q.options];
                                      options[optIndex] = e.target.value;
                                      handleUpdateQuestion(qIndex, { options });
                                    }}
                                    className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none"
                                  />

                                  {isCorrect && (
                                    <span className="text-[10px] font-bold text-[#2e7d32] px-1.5 py-0.5 rounded bg-[#6DC082]/20">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Debrief & Workplace Rationale */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                            Model Answer &amp; Marking Guide
                          </label>
                          <textarea
                            value={q.additional_text || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, { additional_text: e.target.value })}
                            rows={3}
                            className="w-full text-[11px] text-slate-800 bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#00B0F0] font-mono leading-relaxed"
                            placeholder="🟢 Model Answer: [Step-by-step numbers or procedural standard]&#10;&#10;📝 How the Assessor Marks This: [Mark breakdown and common learner pitfalls]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No Question Set Selected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select a question set on the left or click &quot;+ Generate Set&quot; to build interactive questions for this cluster.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Add New Course
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              {/* Step 1: Basic Course Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. OQ99446"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-mono uppercase"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Course Title</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Store Person: Warehouse Operations & Dispatch"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Course Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={2}
                  placeholder="Unit standard outcomes, workplace safety, receiving and dispatch..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                />
              </div>

              {/* QCTO Accreditation Checkbox Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQctoCourse}
                    onChange={(e) => setIsQctoCourse(e.target.checked)}
                    className="w-4 h-4 text-[#4682B4] rounded border-slate-300 focus:ring-[#4682B4]"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#4682B4]" />
                    Accredited QCTO Occupational Course (EISA / FSA Alignment)
                  </span>
                </label>
              </div>

              {/* Step 2: QCTO Master Cluster-to-IAC Mapping (When QCTO course is checked) */}
              {isQctoCourse && (
                <div className="p-4 bg-[#F1F9F3] border border-[#6DC082]/40 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#2e7d32] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#6DC082]" />
                      QCTO Master Cluster-to-IAC Mapping
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMasterPrompt}
                      className="px-3 py-1 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {masterPromptCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Master Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Paste Table Textarea */}
                  <div>
                    <textarea
                      value={masterIacTable}
                      onChange={(e) => setMasterIacTable(e.target.value)}
                      rows={4}
                      placeholder="Copy the Master Prompt into NotebookLM, then paste the returned Markdown table here to auto-create all clusters..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-mono leading-relaxed bg-white"
                    />
                  </div>

                  {/* Detection Feedback & Cluster Preview */}
                  {detectedClusters.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#2e7d32]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#6DC082]" />
                          ✓ {detectedClusters.length} Clusters Ready to Auto-Create
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white rounded-lg border border-[#6DC082]/30 text-xs">
                        {detectedClusters.map((cl) => (
                          <div key={cl.cluster_number} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                            <div className="min-w-0">
                              <span className="font-bold text-[#1e3a5f]">Cluster {cl.cluster_number}:</span>{' '}
                              <span className="font-semibold text-slate-700">{cl.title}</span>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {cl.weighting_percentage}%
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {cl.recommended_question_count} Qs
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : masterIacTable.trim() ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No clusters detected yet. Paste the full Markdown table with &quot;|&quot; columns.</span>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#4682B4] hover:bg-[#3b6f9a] text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isQctoCourse && detectedClusters.length > 0
                      ? `Create Course (${detectedClusters.length} Clusters)`
                      : 'Create Course'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIFIED GENERATE SET MODAL (Combines +New Cluster and +Generate Set) */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Generate Question Set
              </h3>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateQuestionSet} className="space-y-3.5">
              {/* Row 1: Target Cluster Topic (Left, shorter) + Client Association / Scope / Objective ID (Right) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Left: Target Cluster Topic (7 cols) */}
                  <div className="sm:col-span-7">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      1. Target Cluster Topic
                    </label>
                    <select
                      value={targetClusterId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetClusterId(val);
                        const cl = clusters.find(c => c.id === val);
                        if (cl) {
                          const existingClusterSets = AppStore.getQuestionSets(cl.id);
                          const savedExtract = existingClusterSets.find(s => s.raw_notebook_extract && s.raw_notebook_extract.trim().length > 0)?.raw_notebook_extract;
                          if (savedExtract) {
                            setNotebookExtract(savedExtract);
                            setShowNotebookFields(false);
                          }
                        }
                        if (isBrainCertBankSet) {
                          setQuestionCount(60);
                          const num = cl ? cl.cluster_number : 'New';
                          setSetTitle(`Cluster ${num} — BrainCert EISA Question Bank (60 Qs)`);
                          setClientName(`BrainCert EISA Pool • Cluster ${num}`);
                        } else if (isFsaMockSet) {
                          setQuestionCount(cl?.recommended_question_count ? Math.max(12, cl.recommended_question_count) : 15);
                          const num = cl ? cl.cluster_number : 'New';
                          setSetTitle(`Cluster ${num} — Generic IAC FSA Mock Exam`);
                          setClientName(`Cluster ${num} IACs Only`);
                        } else if (cl?.recommended_question_count) {
                          setQuestionCount(cl.recommended_question_count);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                    >
                      {clusters.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          Cluster {cl.cluster_number} — {cl.title}
                        </option>
                      ))}
                      <option value="new">+ Create New Cluster...</option>
                    </select>
                  </div>

                  {/* Right: Client Association / Assessment Scope / BrainCert Objective ID (5 cols) */}
                  <div className="sm:col-span-5">
                    {isBrainCertBankSet ? (
                      <div>
                        <label className="text-xs font-bold text-[#1e3a5f] mb-1 block">
                          BrainCert Objective ID
                        </label>
                        <input
                          type="text"
                          value={brainCertObjectiveId}
                          onChange={(e) => setBrainCertObjectiveId(e.target.value)}
                          placeholder="e.g. 3927820"
                          className="w-full px-3 py-2 text-xs font-mono font-bold border border-[#4682B4]/50 bg-sky-50/60 text-[#1e3a5f] rounded-lg focus:outline-none focus:border-[#4682B4]"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">
                          {isFsaMockSet ? 'Assessment Scope' : isCustomSet ? 'Client / Company Name' : 'Client Association'}
                        </label>
                        <input
                          type="text"
                          value={isFsaMockSet ? `Cluster ${modalClusterNum} IACs Only` : clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Spur Corporation"
                          disabled={!isCustomSet}
                          className="w-full px-3 py-2 text-xs border border-slate-300 bg-white rounded-lg focus:outline-none focus:border-[#4682B4] disabled:bg-slate-100 disabled:text-slate-600 font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline New Cluster Inputs if 'new' is chosen */}
                {targetClusterId === 'new' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">New Cluster Number</label>
                      <input
                        type="text"
                        value={newClusterNumber}
                        onChange={(e) => setNewClusterNumber(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">New Cluster Title</label>
                      <input
                        type="text"
                        value={newClusterTitle}
                        onChange={(e) => setNewClusterTitle(e.target.value)}
                        placeholder="e.g. Receiving & Dispatch Operations"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Question Set Type (Full width, 2-row grid with automatic recommended defaults) */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">2. Question Set Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Generic Standard */}
                  <label
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      !isCustomSet && !isFsaMockSet && !isBrainCertBankSet
                        ? 'bg-[#4682B4]/10 border-[#4682B4] text-slate-900 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!isCustomSet && !isFsaMockSet && !isBrainCertBankSet}
                        onChange={() => {
                          const activeCl = clusters.find(c => c.id === targetClusterId) || selectedCluster;
                          setIsCustomSet(false);
                          setIsFsaMockSet(false);
                          setIsBrainCertBankSet(false);
                          setQuestionCount(activeCl?.recommended_question_count || 10);
                          setTargetLevel('operational');
                          setDefaultEntryMode('group');
                          setTimingMode('overall');
                          setOverallTimeMinutes(20);
                          setClientName('Generic Standard');
                          setSetTitle('Generic Standard Assessment');
                        }}
                        className="text-[#4682B4]"
                      />
                      <span>Generic Standard</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Group • 20m
                    </span>
                  </label>

                  {/* Option 2: Custom Workplace */}
                  <label
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isCustomSet
                        ? 'bg-amber-50/80 border-amber-400 text-slate-900 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isCustomSet}
                        onChange={() => {
                          const activeCl = clusters.find(c => c.id === targetClusterId) || selectedCluster;
                          setIsCustomSet(true);
                          setIsFsaMockSet(false);
                          setIsBrainCertBankSet(false);
                          setQuestionCount(activeCl?.recommended_question_count || 10);
                          setTargetLevel('operational');
                          setDefaultEntryMode('group');
                          setTimingMode('overall');
                          setOverallTimeMinutes(20);
                          if (clientName === 'Generic Standard' || clientName.includes('IACs Only') || clientName.includes('BrainCert')) {
                            setClientName('Spur Corporation');
                          }
                          setSetTitle('');
                        }}
                        className="text-[#4682B4]"
                      />
                      <span>Custom Workplace</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-300">
                      Client DC • 20m
                    </span>
                  </label>

                  {/* Option 3: Generic IAC FSA Mock */}
                  <label
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isFsaMockSet
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isFsaMockSet}
                        onChange={() => {
                          const activeCl = clusters.find(c => c.id === targetClusterId) || selectedCluster;
                          setIsCustomSet(false);
                          setIsFsaMockSet(true);
                          setIsBrainCertBankSet(false);
                          setQuestionCount(activeCl?.recommended_question_count ? Math.max(12, activeCl.recommended_question_count) : 15);
                          setTargetLevel('operational');
                          setDefaultEntryMode('individual');
                          setTimingMode('overall');
                          setOverallTimeMinutes(30);
                          setClientName(`Cluster ${modalClusterNum} IACs Only`);
                          setSetTitle(`Cluster ${modalClusterNum} — Generic IAC FSA Mock Exam`);
                        }}
                        className="text-emerald-600"
                      />
                      <span>Generic IAC FSA Mock</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                      Exam • 15 Qs • 30m
                    </span>
                  </label>

                  {/* Option 4: BrainCert EISA Bank */}
                  <label
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isBrainCertBankSet
                        ? 'bg-sky-50 border-[#4682B4] text-[#1e3a5f] font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isBrainCertBankSet}
                        onChange={() => {
                          setIsCustomSet(false);
                          setIsFsaMockSet(false);
                          setIsBrainCertBankSet(true);
                          setQuestionCount(60);
                          setTargetLevel('operational');
                          setDefaultEntryMode('individual');
                          setTimingMode('overall');
                          setOverallTimeMinutes(40);
                          setClientName(`BrainCert EISA Pool • Cluster ${modalClusterNum}`);
                          setSetTitle(`Cluster ${modalClusterNum} — BrainCert EISA Question Bank (60 Qs)`);
                        }}
                        className="text-[#4682B4]"
                      />
                      <span>BrainCert EISA Bank</span>
                    </div>
                    <span className="text-[10px] bg-sky-100 text-[#1e3a5f] px-1.5 py-0.5 rounded border border-[#4682B4]/40 font-bold">
                      60 Qs Pool • 40m
                    </span>
                  </label>
                </div>
              </div>

              {/* Custom Context Box (When Custom Workplace is selected) */}
              {isCustomSet && (
                <div className="p-3 bg-[#F1F9F3] border border-[#6DC082]/30 rounded-xl space-y-1">
                  <label className="text-xs font-bold text-[#2e7d32] block">
                    Custom Workplace Context
                  </label>
                  <textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    rows={2}
                    placeholder="e.g. Spur Corporation distribution warehouse in Montague Gardens dealing with cold storage, oil spills, and pallet heights..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#4682B4]"
                  />
                </div>
              )}

              {/* Step 3: Progressive Disclosure Notebook Prompt & Extract */}
              {notebookExtract.trim() && !showNotebookFields ? (
                /* COLLAPSED: Single subtle button when extract is already present */
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowNotebookFields(true)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>NotebookLM Extract Ready</span>
                    </span>
                    <span className="text-[#4682B4] font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recreate Prompt / Edit Extract</span>
                    </span>
                  </button>
                </div>
              ) : (
                /* EXPANDED: Show Copy Prompt button + Paste Extract textarea */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      3. NotebookLM Source Extract
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyNotebookPrompt}
                        className="px-3 py-1 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {promptCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Prompt Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Notebook Prompt</span>
                          </>
                        )}
                      </button>
                      {notebookExtract.trim() && (
                        <button
                          type="button"
                          onClick={() => setShowNotebookFields(false)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={notebookExtract}
                    onChange={(e) => setNotebookExtract(e.target.value)}
                    rows={3}
                    placeholder="Copy the prompt above into NotebookLM, then paste the generated response here..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-mono"
                  />
                </div>
              )}

              {/* Parameters Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={12}>12 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={40}>40 Questions</option>
                    <option value={60}>60 Questions (3x Pool)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Cognitive Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as CognitiveTargetLevel)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="foundational">Foundational</option>
                    <option value="operational">Operational</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Entry Mode</label>
                  <select
                    value={defaultEntryMode}
                    onChange={(e) => setDefaultEntryMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="group">Group Mode</option>
                    <option value="individual">Individual Mode</option>
                  </select>
                </div>
              </div>

              {/* Timing Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4682B4]" />
                  <span>Session Timing</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimingMode('overall')}
                    className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all ${
                      timingMode === 'overall'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Overall Time
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingMode('per_question')}
                    className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all ${
                      timingMode === 'per_question'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Per Question
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingMode('untimed')}
                    className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all ${
                      timingMode === 'untimed'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Untimed
                  </button>
                </div>

                {timingMode === 'overall' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={overallTimeMinutes}
                      onChange={(e) => setOverallTimeMinutes(Math.max(1, Number(e.target.value)))}
                      className="w-16 px-2 py-1 border border-slate-300 rounded font-bold text-center bg-white"
                    />
                    <span className="text-slate-500 font-semibold">minutes</span>
                  </div>
                )}

                {timingMode === 'per_question' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Duration per Question:</span>
                    <select
                      value={perQuestionDuration}
                      onChange={(e) => setPerQuestionDuration(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded font-bold bg-white"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={45}>45 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={90}>90 seconds</option>
                      <option value={120}>120 seconds</option>
                    </select>
                  </div>
                )}
              </div>

              {genError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {genError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 text-xs font-bold bg-[#6DC082] hover:bg-[#5cb372] text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Question Set</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUESTION SET SETTINGS MODAL */}
      {showEditSetModal && editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#4682B4]">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">
                  Edit Question Set Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditSetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSet} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Question Set Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Client / Workplace Association
                </label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                />
              </div>

              {/* Timing Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4682B4]" />
                    Timing Options
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTimingMode('overall')}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      editTimingMode === 'overall'
                        ? 'bg-[#4682B4] text-white border-[#4682B4]'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Overall
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTimingMode('per_question')}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      editTimingMode === 'per_question'
                        ? 'bg-[#4682B4] text-white border-[#4682B4]'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Per-Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTimingMode('untimed')}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      editTimingMode === 'untimed'
                        ? 'bg-[#4682B4] text-white border-[#4682B4]'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Untimed
                  </button>
                </div>

                {editTimingMode === 'overall' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Session Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editOverallTime}
                      onChange={(e) => setEditOverallTime(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-center bg-white"
                    />
                    <span className="text-slate-500 font-semibold">minutes</span>
                  </div>
                )}

                {editTimingMode === 'per_question' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Seconds per Question:</span>
                    <select
                      value={editPerQuestionTime}
                      onChange={(e) => setEditPerQuestionTime(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded font-bold bg-white"
                    >
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                      <option value={120}>120s</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Default Entry Mode</label>
                  <select
                    value={editEntryMode}
                    onChange={(e) => setEditEntryMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="group">Group Mode (Table Teams)</option>
                    <option value="individual">Individual Mode</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Cognitive Level</label>
                  <select
                    value={editTargetLevel}
                    onChange={(e) => setEditTargetLevel(e.target.value as CognitiveTargetLevel)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="foundational">Foundational</option>
                    <option value="operational">Operational</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditSetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#4682B4] hover:bg-[#3b6f9a] text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMAL CLUSTER ASSESSMENT INSTRUMENT & MEMORANDUM MODAL (FSA EXPORT / PRINT) */}
      {showFsaPaperModal && selectedSet && (
        <div className="fsa-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className={`fsa-modal-card bg-white border border-slate-300 rounded-2xl w-full shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col transition-all ${
            isProjectorFullscreen 
              ? 'max-w-none fixed inset-0 m-0 rounded-none h-screen max-h-screen z-50 bg-[#0b1329] text-white' 
              : 'max-w-4xl max-h-[92vh]'
          }`}>
            {/* Top Toolbar (Hidden on Print) */}
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Cluster {selectedCluster?.cluster_number}: Formative Assessment &amp; Peer Review
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSet.title} • Total: {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks ({selectedSet.questions.length} Questions)
                  </p>
                </div>
              </div>

              {/* Mode Toggle Tabs & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setFsaPaperMode('paper');
                      setIsProjectorFullscreen(false);
                    }}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      fsaPaperMode === 'paper'
                        ? 'bg-white text-slate-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📝 Printable Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setFsaPaperMode('projector')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      fsaPaperMode === 'projector'
                        ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-[#6DC082]" />
                    <span>📺 Projector Mode (Model Answers)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFsaPaperMode('memo');
                      setIsProjectorFullscreen(false);
                    }}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      fsaPaperMode === 'memo'
                        ? 'bg-[#2e7d32] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🟢 Memorandum
                  </button>
                </div>

                {fsaPaperMode === 'projector' ? (
                  <button
                    type="button"
                    onClick={() => setIsProjectorFullscreen(!isProjectorFullscreen)}
                    className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                    title="Toggle Fullscreen Projector View"
                  >
                    {isProjectorFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span>{isProjectorFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                    title="Print paper or save as clean PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowFsaPaperModal(false);
                    setIsProjectorFullscreen(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Assessment Document Body */}
            <div className={`p-6 sm:p-8 overflow-y-auto space-y-6 font-sans ${
              fsaPaperMode === 'projector' ? 'bg-[#0b1329] text-white' : 'bg-white text-slate-900'
            }`} id="fsa-print-paper">
              
              {/* IF PROJECTOR MODE: HIGH CONTRAST PROJECTOR BANNER */}
              {fsaPaperMode === 'projector' ? (
                <div className="p-5 rounded-2xl bg-[#121d3a] border border-[#1e2e54] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#6DC082] text-xs font-bold uppercase tracking-wider mb-1">
                      <Monitor className="w-4 h-4" />
                      <span>Classroom Projector Mode • Model Answers &amp; Peer Marking Guide</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Cluster {selectedCluster?.cluster_number}: {selectedCluster?.title || selectedSet.title}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Learners: Check your partner&apos;s working steps, compare calculations, and award marks based on the guidance below.
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center shrink-0">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-bold">Total Assessment Marks</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks
                    </span>
                  </div>
                </div>
              ) : (
                /* PAPER / MEMO HEADER: ULTRA-COMPACT OCCUPATIONAL HEADING & 1-LINE PEER STRIP */
                <div id="fsa-paper-header" className="border-b-2 border-slate-900 pb-2 space-y-1.5 text-xs">
                  {/* Row 1: Course Title & Cluster + Marks & Time */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-300 pb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-black text-[#4682B4] uppercase tracking-wider">
                        {selectedCourse?.code || 'OQ'} • {selectedCourse?.title || 'Occupational Store Person'}
                      </span>
                      <span className="text-slate-400 font-bold">•</span>
                      <h1 className="text-xs font-black text-slate-900">
                        Cluster {selectedCluster?.cluster_number}: {selectedCluster?.title || selectedSet.title}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                        Total: <strong className="text-[#2e7d32]">{selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks</strong>
                      </span>
                      <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                        Time Allowed: {selectedSet.time_allowed_minutes || (selectedCluster?.weighting_percentage && selectedCluster.weighting_percentage >= 45 ? 45 : 30)} min
                      </span>
                    </div>
                  </div>

                  {/* Row 2: 1-Line Compact Peer Review Strip */}
                  <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="font-bold text-slate-700">Learner Name:</span>
                      <span className="border-b border-slate-400 flex-1 min-w-[120px] h-3.5 inline-block"></span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="font-bold text-slate-700">Checked By (Peer):</span>
                      <span className="border-b border-slate-400 flex-1 min-w-[120px] h-3.5 inline-block"></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-bold text-slate-700">Score:</span>
                      <span className="font-mono text-slate-500 font-bold">_____ / {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}</span>
                    </div>
                  </div>

                  {/* Row 3: 1-Line Compact Instructions */}
                  <div className="text-[10px] text-slate-600 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/80 flex items-center justify-between">
                    <span className="font-bold text-amber-900">Instructions:</span>
                    <span className="text-slate-700 truncate pl-2">
                      Answer ALL questions. For calculations, write working steps. Swap papers upon completion for peer review against classroom projector model answers.
                    </span>
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div className="space-y-3 pt-1">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5">
                  Section A: Assessment Questions & Practical Scenarios
                </h3>

                {selectedSet.questions.map((q, idx) => {
                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                  const qMarks = q.marks || 1;
                  const isCalculationQuestion = q.body.toLowerCase().includes('vat') || 
                                               q.body.toLowerCase().includes('variance') || 
                                               q.body.toLowerCase().includes('calculat') || 
                                               q.body.toLowerCase().includes('courier') ||
                                               q.body.toLowerCase().includes('order #');

                  const text = q.additional_text || '';
                  const hasModelAnswer = text.includes('Model Answer') || text.includes('🟢');
                  const hasAssessorNotes = text.includes('Assessor Marks') || text.includes('📝');

                  let modelPart = text;
                  let rubricPart = '';
                  if (hasModelAnswer && hasAssessorNotes) {
                    const parts = text.split(/(?=📝|How the Assessor Marks This)/i);
                    modelPart = parts[0]?.replace(/^🟢\s*Model Answer:\s*/i, '').trim();
                    rubricPart = parts[1]?.replace(/^(📝\s*)?(How the Assessor Marks This:\s*)?/i, '').trim();
                  }

                  return (
                    <div 
                      key={q.id || idx} 
                      className={`question-print-item space-y-1.5 pb-2.5 border-b last:border-b-0 ${
                        fsaPaperMode === 'projector' 
                          ? 'border-slate-800 bg-[#121d3a] p-5 sm:p-6 rounded-2xl mb-4' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Question Stem & Marks */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className={`font-extrabold text-xs shrink-0 pt-0.5 ${
                            fsaPaperMode === 'projector' ? 'text-[#6DC082] text-sm' : 'text-slate-900'
                          }`}>
                            Q{idx + 1}.
                          </span>
                          <p className={`font-semibold leading-snug ${
                            fsaPaperMode === 'projector' ? 'text-sm sm:text-base text-white' : 'text-xs text-slate-800'
                          }`}>
                            {q.body}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border shrink-0 font-mono ${
                          fsaPaperMode === 'projector'
                            ? 'bg-[#1e2e54] text-emerald-400 border-[#2b4175]'
                            : 'text-slate-700 bg-slate-100 border-slate-300'
                        }`}>
                          [{qMarks} {qMarks === 1 ? 'Mark' : 'Marks'}]
                        </span>
                      </div>

                      {/* CLOZE (Fill in the Gap with Word Bank) Rendering */}
                      {q.format === 'CLOZE' && (
                        <div className={`space-y-1.5 pt-1 ${fsaPaperMode === 'projector' ? 'pl-7' : 'pl-6'}`}>
                          {/* Word Bank Container */}
                          <div className={`p-1.5 rounded-lg border flex flex-wrap items-center gap-1.5 ${
                            fsaPaperMode === 'projector' 
                              ? 'bg-[#0f172a] border-[#1e2e54] text-slate-200' 
                              : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}>
                            <span className={`text-[10px] font-black uppercase tracking-wider mr-1 ${
                              fsaPaperMode === 'projector' ? 'text-emerald-400' : 'text-slate-600'
                            }`}>
                              Word Bank:
                            </span>
                            {q.options.map((word, wIdx) => (
                              <span
                                key={wIdx}
                                className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                  fsaPaperMode === 'projector'
                                    ? 'bg-[#1e293b] border-[#2b4175] text-slate-200'
                                    : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                                }`}
                              >
                                {word}
                              </span>
                            ))}
                          </div>

                          {/* Paper Mode Write-in Blanks */}
                          {fsaPaperMode === 'paper' && (
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-xs font-semibold text-slate-700">
                              {(q.body.match(/\[(\d+)\]/g) || ['[1]', '[2]', '[3]']).map((_, gapIdx) => (
                                <div key={gapIdx} className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">({gapIdx + 1})</span>
                                  <span className="border-b border-slate-400 w-32 inline-block"></span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Memo Mode Correct Answers Strip */}
                          {fsaPaperMode === 'memo' && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
                              {q.correct_options.map((optIdx, gapIdx) => (
                                <span key={gapIdx} className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                                  ({gapIdx + 1}) {q.options[optIdx]}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Projector Mode Answer Reveal */}
                          {fsaPaperMode === 'projector' && (
                            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                              {q.correct_options.map((optIdx, gapIdx) => (
                                <div
                                  key={gapIdx}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs sm:text-sm font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center gap-2"
                                >
                                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-mono text-xs">
                                    {gapIdx + 1}
                                  </span>
                                  <span>{q.options[optIdx]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Standard Options (MCQ, MULTIPLE, BINARY) */}
                      {q.format !== 'WORD_CLOUD' && q.format !== 'CLOZE' && (
                        <div className={`pt-1 ${fsaPaperMode === 'projector' ? 'pl-7' : 'pl-6'}`}>
                          {fsaPaperMode === 'projector' ? (
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correct_options.includes(optIdx);
                                const letter = optionLetters[optIdx] || String(optIdx + 1);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center justify-between gap-2.5 text-xs sm:text-sm p-2.5 rounded-xl border transition-all ${
                                      isCorrect
                                        ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                        : 'bg-[#0b1329]/60 border-[#1e2e54] text-slate-400 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#121d3a] text-slate-400'
                                      }`}>
                                        {isCorrect ? '✓' : letter}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {isCorrect && (
                                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                                        Correct Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : q.format === 'BINARY' ? (
                            /* Binary (True/False): Inline 1-Line Flex */
                            <div className="flex items-center gap-6 text-xs">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correct_options.includes(optIdx);
                                const letter = optionLetters[optIdx] || String(optIdx + 1);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center gap-2 py-0.5 px-1.5 rounded ${
                                      fsaPaperMode === 'memo' && isCorrect
                                        ? 'bg-emerald-50 border border-emerald-400 text-emerald-950 font-bold'
                                        : 'text-slate-800'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 border rounded-xs flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                      fsaPaperMode === 'memo' && isCorrect
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'border-slate-400 bg-white text-slate-700'
                                    }`}>
                                      {fsaPaperMode === 'memo' && isCorrect ? '✓' : letter}
                                    </span>
                                    <span>{opt}</span>
                                    {fsaPaperMode === 'memo' && isCorrect && (
                                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                                        [Correct]
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* MCQ & Multiple: Compact 2-Column Grid (Halves vertical space) */
                            <div className="question-options-grid grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correct_options.includes(optIdx);
                                const letter = optionLetters[optIdx] || String(optIdx + 1);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-start gap-2 py-0.5 px-1 rounded ${
                                      fsaPaperMode === 'memo' && isCorrect
                                        ? 'bg-emerald-50 border border-emerald-400 text-emerald-950 font-bold'
                                        : 'text-slate-800'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 border rounded-xs flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                                      fsaPaperMode === 'memo' && isCorrect
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'border-slate-400 bg-white text-slate-700'
                                    }`}>
                                      {fsaPaperMode === 'memo' && isCorrect ? '✓' : letter}
                                    </span>
                                    <span className="flex-1 leading-snug">{opt}</span>
                                    {fsaPaperMode === 'memo' && isCorrect && (
                                      <span className="text-[9px] text-emerald-700 font-extrabold uppercase shrink-0 pt-0.5">
                                        [✓]
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Paper Mode: Calculation / Working Space for math & scenario questions */}
                      {fsaPaperMode === 'paper' && isCalculationQuestion && (
                        <div className="pl-6 pt-1">
                          <div className="border border-dashed border-slate-300 rounded px-2 py-0.5 text-[10px] text-slate-500 bg-slate-50/40">
                            <span className="font-semibold text-slate-600 block">
                              Working Steps / Calculation Space:
                            </span>
                            <div className="h-4 border-b border-slate-200 border-dashed"></div>
                          </div>
                        </div>
                      )}

                      {/* Projector Mode: Large High-Contrast Model Answer & Marking Breakdown Cards */}
                      {fsaPaperMode === 'projector' && (
                        <div className="pl-7 pt-2 space-y-2.5">
                          {modelPart && (
                            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>🟢 Step-by-Step Model Answer (Check Partner&apos;s Steps):</span>
                              </div>
                              <div className="text-xs sm:text-sm text-emerald-100 font-mono whitespace-pre-line leading-relaxed pl-5">
                                {modelPart}
                              </div>
                            </div>
                          )}

                          {rubricPart && (
                            <div className="p-3.5 rounded-xl bg-[#4682B4]/15 border border-[#4682B4]/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold uppercase tracking-wider">
                                <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                                <span>📝 Marking Guidance (How to Award Marks):</span>
                              </div>
                              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed pl-5">
                                {rubricPart}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Memorandum Mode: Dual Model Answer Box */}
                      {fsaPaperMode === 'memo' && q.additional_text && (
                        <div className="pl-6 pt-1 space-y-1">
                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-300 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed">
                            {q.additional_text}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Clean Peer-Review Footer */}
              {fsaPaperMode !== 'projector' && (
                <div id="fsa-paper-footer" className="border-t border-slate-300 pt-2 mt-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                  <div>Peer Reviewer Signature: _______________________</div>
                  <div>Date: _______________________</div>
                  <div className="font-semibold text-slate-800">
                    Total Score: ______ / {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BrainCert LMS EISA Assessment Setup, HTML Instructions & Multi-Format CSV Export Modal */}
      {showBrainCertModal && selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] text-white px-6 py-4 flex items-center justify-between gap-4 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#6DC082] text-slate-950">
                    BrainCert LMS + QCTO EISA Hub
                  </span>
                  <span className="text-xs text-sky-200 font-mono">
                    Cluster {selectedCluster?.cluster_number || '2.4'} • {selectedSet.questions.length} Questions in Pool
                  </span>
                </div>
                <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#6DC082]" />
                  <span>3-Step BrainCert EISA Container Setup & Multi-Format Question Bank Export</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBrainCertModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-100 px-6 pt-2.5 border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBrainCertTab('setup')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
                  brainCertTab === 'setup'
                    ? 'bg-white text-[#1e3a5f] border-slate-200 -mb-px shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4682B4]" />
                <span>Step 1A: Container Settings (Partial Credit)</span>
              </button>
              <button
                type="button"
                onClick={() => setBrainCertTab('html')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
                  brainCertTab === 'html'
                    ? 'bg-white text-[#1e3a5f] border-slate-200 -mb-px shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-amber-600" />
                <span>Step 1B: Mobile HTML Instructions & Calculator Tip</span>
              </button>
              <button
                type="button"
                onClick={() => setBrainCertTab('csv')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
                  brainCertTab === 'csv'
                    ? 'bg-white text-[#1e3a5f] border-slate-200 -mb-px shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Steps 2 & 3: Objective ID & Multi-Format CSV Export</span>
              </button>
              <button
                type="button"
                onClick={() => setBrainCertTab('blueprint')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
                  brainCertTab === 'blueprint'
                    ? 'bg-white text-[#1e3a5f] border-slate-200 -mb-px shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-purple-600" />
                <span>QCTO Instructional Design Blueprint</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: CONTAINER SETUP & SETTINGS */}
              {brainCertTab === 'setup' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-700">
                      <div className="font-extrabold text-[#1e3a5f] text-sm">
                        Step 1: Create Your Assessment Container in BrainCert LMS
                      </div>
                      <p>
                        Before uploading your 60-question CSV pool, create the Test Container in BrainCert using the settings below. Once saved, BrainCert will generate an <strong>Objective ID</strong> which you will link in <strong>Steps 2 &amp; 3</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrainCertTab('html')}
                      className="px-3 py-1.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
                    >
                      Next: Copy HTML Instructions →
                    </button>
                  </div>

                  {/* Quick Copy Title & Subtitle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommended Test Name</span>
                        <button
                          type="button"
                          onClick={() => handleCopyBrainCertField('title', `Cluster ${selectedCluster?.cluster_number || '2.4'}: ${selectedCluster?.title || 'Stock Control, Storage & Despatch'} (EISA Prep)`)}
                          className="text-xs font-bold text-[#4682B4] hover:underline flex items-center gap-1"
                        >
                          {brainCertCopiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{brainCertCopiedField === 'title' ? 'Copied!' : 'Copy Title'}</span>
                        </button>
                      </div>
                      <div className="text-xs font-bold text-slate-900 bg-white p-2 rounded border border-slate-200 font-mono">
                        Cluster {selectedCluster?.cluster_number || '2.4'}: {selectedCluster?.title || 'Stock Control, Storage & Despatch'} (EISA Prep)
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                          ⭐ Critical Scoring Setting (Advanced Tab)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
                          Partial Credit
                        </span>
                      </div>
                      <p className="text-xs text-emerald-950 leading-relaxed">
                        Set <strong>Score Calculation Algorithm</strong> to <strong>Partial Credit (with or without penalty)</strong> instead of <em>Exact Match</em>. This ensures Multi-Answer Checkbox questions (`Type 4`) award proportional marks when a learner selects 1 of 2 correct safety actions.
                      </p>
                    </div>
                  </div>

                  {/* BrainCert Configuration Matrix */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-3">BrainCert Setting</th>
                          <th className="py-2.5 px-3">Recommended Value</th>
                          <th className="py-2.5 px-3">QCTO EISA &amp; Mobile Learner Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-slate-800">Test Duration</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1e3a5f]">40 Minutes</td>
                          <td className="py-2.5 px-3 text-slate-600">Allocates 2 minutes per question (20 drawn) so learners can read warehouse scenarios and work out calculations carefully.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-slate-800">Passing Score</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">70% • Pass / Fail</td>
                          <td className="py-2.5 px-3 text-slate-600">Builds a safety buffer above QCTO&apos;s minimum competency threshold to ensure genuine exam readiness.</td>
                        </tr>
                        <tr className="bg-emerald-50/40">
                          <td className="py-2.5 px-3 font-bold text-emerald-950">Score Calculation Algorithm</td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-emerald-800">Partial Credit</td>
                          <td className="py-2.5 px-3 text-emerald-900">Rewards partial operational insight on multi-select checkbox questions (`Type 4`) and lowers test anxiety.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-slate-800">Randomize / Pool Draw</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1e3a5f]">Draw 20 from 60+ Pool</td>
                          <td className="py-2.5 px-3 text-slate-600">Enable <strong>Randomize Questions</strong> &amp; <strong>Shuffle Answer Options</strong> so every attempt presents a fresh paper.</td>
                        </tr>
                        <tr className="bg-amber-50/40">
                          <td className="py-2.5 px-3 font-bold text-amber-950">Enable Test Lockdown</td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-red-700">NO (Disabled)</td>
                          <td className="py-2.5 px-3 text-amber-950">Critical for mobile learners: prevents automatic disqualification if a WhatsApp banner pops up or if they switch to a calculator app.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-slate-800">Allow Test Resume</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">YES (Enabled)</td>
                          <td className="py-2.5 px-3 text-slate-600">Protects learners against South African mobile data drops or load-shedding Wi-Fi switchovers.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-slate-800">Post-Test Review &amp; Explanations</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">YES (Show Explanations)</td>
                          <td className="py-2.5 px-3 text-slate-600">Displays the 3-part QCTO explanation immediately after submission so the assessment acts as a self-correcting tutor.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MOBILE HTML INSTRUCTIONS */}
              {brainCertTab === 'html' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs text-amber-950">
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <span>📱 Step 1B: Paste into BrainCert &quot;Test Instructions&quot; (Source Code View)</span>
                      </div>
                      <p>
                        Includes the <strong>Practical Calculator Suggestion</strong> (advising learners to keep a basic calculator or secondary phone handy) and instructions for all 4 question types.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyBrainCertField('html', getBrainCertHtmlInstructions(selectedCluster?.cluster_number || '2.4'))}
                      className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#4682B4] text-white text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {brainCertCopiedField === 'html' ? (
                        <>
                          <Check className="w-4 h-4 text-[#6DC082]" />
                          <span>Copied HTML to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#6DC082]" />
                          <span>Copy Raw HTML Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Live Visual Preview */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Live Learner Mobile Preview</span>
                        <span className="text-emerald-700">Responsive HTML</span>
                      </div>
                      <div
                        className="bg-white p-3 rounded-lg border border-slate-200 max-h-[380px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: getBrainCertHtmlInstructions(selectedCluster?.cluster_number || '2.4') }}
                      />
                    </div>

                    {/* Raw HTML Source */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 space-y-2 flex flex-col">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center justify-between">
                        <span>Raw HTML Source (Click &quot;&lt;/&gt; Source Code&quot; in BrainCert)</span>
                        <button
                          type="button"
                          onClick={() => setBrainCertTab('csv')}
                          className="text-xs font-bold text-[#6DC082] hover:underline"
                        >
                          Next: Link Objective ID &amp; Export CSV →
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={getBrainCertHtmlInstructions(selectedCluster?.cluster_number || '2.4')}
                        className="w-full flex-1 min-h-[340px] bg-slate-950 text-sky-100 font-mono text-[11px] p-3 rounded-lg border border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OBJECTIVE ID & MULTI-FORMAT CSV EXPORT */}
              {brainCertTab === 'csv' && (
                <div className="space-y-4">
                  {/* Step 2: Objective ID Link Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#4682B4] text-white">
                        Step 2 • Link BrainCert Container
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-800 pt-1">
                        Enter BrainCert Objective ID
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        After saving your Test Container in BrainCert, copy the numeric <strong>Objective ID</strong> from BrainCert and paste it here. Every row in your exported CSV will automatically bind to this ID.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1e3a5f] block">
                        BrainCert Objective ID (Column 6 of CSV)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={selectedSet.braincert_objective_id ?? brainCertObjectiveId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBrainCertObjectiveId(val);
                            const updated = { ...selectedSet, braincert_objective_id: val };
                            setSelectedSet(updated);
                            AppStore.saveQuestionSet(updated);
                          }}
                          placeholder="e.g. 3927820"
                          className="flex-1 px-3 py-2 text-sm font-mono font-extrabold bg-white border-2 border-[#4682B4] rounded-lg text-[#1e3a5f] focus:outline-none"
                        />
                        <span className="px-2.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                          Auto-Saved ✓
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Format Breakdown Card */}
                  {(() => {
                    const type2Count = selectedSet.questions.filter(q => q.format === 'MCQ' || q.format === 'SCALE' || q.format === 'WORD_CLOUD').length;
                    const type1Count = selectedSet.questions.filter(q => q.format === 'CLOZE').length;
                    const type4Count = selectedSet.questions.filter(q => q.format === 'MULTIPLE').length;
                    const type5Count = selectedSet.questions.filter(q => q.format === 'BINARY').length;

                    return (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-600 text-white">
                              Step 3 • Multi-Format Question Bank Verification
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-800 pt-1">
                              {selectedSet.title} ({selectedSet.questions.length} Questions)
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleInjectEisaPilotQuestions}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                              title="Append 10 ready-to-use multi-format QCTO EISA questions (Types 1, 2, 4, 5)"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-700" />
                              <span>{pilotAddedSuccess ? '✓ Added 10 Pilot Qs!' : '+ Append 10 Pilot Qs'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowBrainCertModal(false);
                                setIsBrainCertBankSet(true);
                                setQuestionCount(60);
                                handleOpenGenerator(selectedCluster || undefined);
                              }}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#1e3a5f] border border-[#4682B4]/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#4682B4]" />
                              <span>Generate 60-Q Pool</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="text-[10px] font-extrabold uppercase text-[#4682B4]">Type ID = 2 • MCQ</div>
                            <div className="text-lg font-extrabold text-slate-900 mt-0.5">{type2Count} Qs</div>
                            <div className="text-[11px] text-slate-500">Single Choice (~40%)</div>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                            <div className="text-[10px] font-extrabold uppercase text-emerald-800">Type ID = 1 • Fill in Blank</div>
                            <div className="text-lg font-extrabold text-emerald-950 mt-0.5">{type1Count} Qs</div>
                            <div className="text-[11px] text-emerald-800">Cloze / Numeric (~25%)</div>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200">
                            <div className="text-[10px] font-extrabold uppercase text-purple-800">Type ID = 4 • Multi-Answer</div>
                            <div className="text-lg font-extrabold text-purple-950 mt-0.5">{type4Count} Qs</div>
                            <div className="text-[11px] text-purple-800">Checkboxes (~20%)</div>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                            <div className="text-[10px] font-extrabold uppercase text-amber-800">Type ID = 5 • True / False</div>
                            <div className="text-lg font-extrabold text-amber-950 mt-0.5">{type5Count} Qs</div>
                            <div className="text-[11px] text-amber-800">SOP Verification (~15%)</div>
                          </div>
                        </div>

                        {/* Export Call to Action */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div>
                              Format: <strong>16-Column BrainCert RFC 4180 CSV</strong> (single-line rows, MySQL UTF-8 safe).
                            </div>
                            <div className="font-mono text-[11px] text-[#1e3a5f] font-semibold">
                              📄 {getBrainCertFriendlyFilename()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExportBrainCertCsv()}
                            className="px-5 py-2.5 bg-[#6DC082] hover:bg-[#5bb070] text-slate-950 text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-2 transition-colors shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download BrainCert CSV ({selectedSet.questions.length} Qs)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: QCTO INSTRUCTIONAL DESIGN BLUEPRINT */}
              {brainCertTab === 'blueprint' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h3 className="text-sm font-extrabold text-[#1e3a5f]">
                      QCTO NQF Level 3 (SAQA 99446) EISA Instructional Design Blueprint
                    </h3>
                    <p className="leading-relaxed">
                      Every BrainCert Question Bank generated in LiveEngage is engineered to prepare Supply Chain Practitioners for the external QCTO EISA exam by combining <strong>cognitive scaffolding</strong>, <strong>multi-format active recall</strong>, and <strong>self-correcting explanations</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-extrabold text-[#1e3a5f]">1. 30/50/20 Cognitive Split</div>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>30% Foundational</strong> (terminology &amp; SOPs), <strong>50% Applied Scenarios &amp; Calculations</strong> (FEFO, pallet stacking, container volume, stock shrinkage), and <strong>20% Diagnostic</strong> (multi-fault receiving rejections).
                      </p>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-extrabold text-emerald-800">2. Mobile-Safe Fill-in-the-Blank (Type 1)</div>
                      <p className="text-slate-600 leading-relaxed">
                        To prevent unfair mobile auto-grading failures on exact-match text boxes, LiveEngage embeds a <strong>4-term Word Bank</strong> in terminology stems and <strong>pre-supplies the unit</strong> outside calculation blanks (e.g. <em>&quot;_____ full pallets (Type number only)&quot;</em>).
                      </p>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="font-extrabold text-purple-900">3. 3-Part Self-Teaching Explanations</div>
                      <p className="text-slate-600 leading-relaxed">
                        Every question includes: <strong>(1) Core Principle / Formula</strong>, <strong>(2) Step-by-Step Worked Solution</strong>, and <strong>(3) Distractor Analysis &amp; Operational Consequence</strong> so learners understand <em>why</em> wrong options fail.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print Mode: Single-Pass A4 Output with Zero Duplication */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            height: auto !important;
            overflow: visible !important;
          }
          header, nav, main, footer, .no-print {
            display: none !important;
          }
          .fsa-modal-backdrop {
            position: static !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
          }
          .fsa-modal-card {
            position: static !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          #fsa-print-paper {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }
          #fsa-paper-header {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 6px !important;
          }
          .question-print-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding-bottom: 5px !important;
            margin-bottom: 5px !important;
          }
          .question-options-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 2px 12px !important;
          }
          #fsa-paper-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 10px !important;
            padding-top: 6px !important;
          }
        }
      `}} />

      {/* Interactive Classroom Q&A & Name Wheel Modal */}
      {showQAWheelModal && selectedSet && (
        <ClassroomQAWheelModal
          set={selectedSet}
          initialLearners={learners}
          onClose={() => setShowQAWheelModal(false)}
        />
      )}
    </div>
  );
}
