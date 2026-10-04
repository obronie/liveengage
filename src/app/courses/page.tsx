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
  Edit3
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function CoursesPage() {
  const router = useRouter();
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
  const [fsaPaperMode, setFsaPaperMode] = useState<'paper' | 'projector' | 'memo'>('paper');
  const [isProjectorFullscreen, setIsProjectorFullscreen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

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
  const [clientName, setClientName] = useState('Generic Standard');
  const [setTitle, setSetTitle] = useState('');
  const [notebookExtract, setNotebookExtract] = useState('');
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
    if (target) {
      setTargetClusterId(target.id);
      setQuestionCount(target.recommended_question_count || 10);
    } else {
      setTargetClusterId('new');
      setQuestionCount(10);
    }
    setIsFsaMockSet(false);
    setIsCustomSet(false);
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
      // FSA Mock: "Cluster X.Y — Generic IAC FSA Mock Exam"
      // Generic: "Generic Standard Assessment"
      // Custom: "[Client Name] Custom Assessment"
      const finalTitle = isFsaMockSet
        ? (setTitle.trim() || `Cluster ${activeCluster.cluster_number} — Generic IAC FSA Mock Exam`)
        : isCustomSet 
          ? (setTitle.trim() || `${clientName.trim()} Custom Assessment`)
          : (setTitle.trim() || 'Generic Standard Assessment');

      const newSet: QuestionSet = {
        id: 'set-' + Math.random().toString(36).substring(2, 9),
        cluster_id: activeCluster.id,
        set_number: nextSetNumber,
        title: finalTitle,
        is_custom: isCustomSet,
        is_fsa_mock: isFsaMockSet,
        client_name: isFsaMockSet ? `Cluster ${activeCluster.cluster_number} IACs Only` : isCustomSet ? clientName.trim() : 'Generic Standard',
        eisa_focus_area: isFsaMockSet ? `EISA Aligned: Cluster ${activeCluster.cluster_number} IAC Mock Exam` : (activeCluster.eisa_focus_area || 'EISA Aligned: Focus Area 1 & 2'),
        raw_notebook_extract: notebookExtract,
        custom_background_context: isCustomSet ? customContext : '',
        target_level: targetLevel,
        default_entry_mode: defaultEntryMode,
        timing_mode: timingMode,
        overall_time_minutes: timingMode === 'overall' ? overallTimeMinutes : undefined,
        per_question_duration: timingMode === 'per_question' ? perQuestionDuration : undefined,
        total_marks: calculatedTotalMarks,
        time_allowed_minutes: timingMode === 'overall' ? overallTimeMinutes : (isFsaMockSet ? (activeCluster.weighting_percentage && activeCluster.weighting_percentage >= 45 ? 45 : 30) : 30),
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

  const handleDeleteQuestion = (qIndex: number) => {
    if (!selectedSet) return;
    const questions = selectedSet.questions.filter((_, idx) => idx !== qIndex).map((q, i) => ({ ...q, question_order: i + 1 }));
    const total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const updatedSet = { ...selectedSet, questions, total_marks };
    setSelectedSet(updatedSet);
    AppStore.saveQuestionSet(updatedSet);
  };

  // --- 1-Click Launch Live Session ---
  const handleLaunchLive = async () => {
    if (!selectedSet || !selectedCourse || !selectedCluster) return;

    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
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
      timing_mode: selectedSet.timing_mode || 'per_question',
      overall_time_minutes: selectedSet.overall_time_minutes || 20,
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
    <div className="min-h-screen flex flex-col bg-[#F1F9F3]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-5">
        
        {/* TOP BAR: Clean Course Selector, 2 Document Badges, +Generate Set, +Add Course */}
        <div className="bg-white border border-[#D5E3EF] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Left: Course Selection & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#4682B4] shrink-0" />
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

            {selectedCourse && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to permanently delete course "${selectedCourse.code} — ${selectedCourse.title}"?\n\nWARNING: This will permanently delete all associated clusters, question banks, and uploaded documents from the cloud database.`)) {
                    await AppStore.deleteCourse(selectedCourse.id);
                    const updated = await AppStore.fetchCourses();
                    setCourses(updated);
                    if (updated.length > 0) {
                      setSelectedCourse(updated[0]);
                      loadClusters(updated[0].id);
                    } else {
                      setSelectedCourse(null);
                      setClusters([]);
                      setQuestionSets([]);
                    }
                  }
                }}
                title={`Delete Course: ${selectedCourse.code}`}
                className="px-2.5 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Course</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN WORKSPACE: 2-Column Clean Hierarchy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN (4 of 12): All Clusters Listed with Question Sets & Historical Activity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#D5E3EF] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#4682B4]" />
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
                    const aIsGeneric = (!a.is_custom && !a.is_fsa_mock) || a.client_name === 'Generic Standard';
                    const bIsGeneric = (!b.is_custom && !b.is_fsa_mock) || b.client_name === 'Generic Standard';
                    if (aIsGeneric && !bIsGeneric) return -1;
                    if (!aIsGeneric && bIsGeneric) return 1;

                    const aIsFsa = !!a.is_fsa_mock;
                    const bIsFsa = !!b.is_fsa_mock;
                    if (aIsFsa && !bIsFsa) return -1;
                    if (!aIsFsa && bIsFsa) return 1;

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

                      {/* Question Sets for this Cluster: Generic Standard first, then FSA Mock, then Custom alphabetically */}
                      <div className="space-y-2">
                        {sortedClusterSets.map((qs) => {
                          const isSelected = selectedSet?.id === qs.id;
                          const isGeneric = !qs.is_custom || qs.client_name === 'Generic Standard';

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
                                            : isGeneric 
                                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                                        }`}>
                                          {qs.is_fsa_mock ? 'FSA Mock' : isGeneric ? 'Generic' : 'Custom'}
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
                          <div className="bg-[#D5E3EF]/30 p-2.5 rounded-lg border border-[#D5E3EF] text-xs">
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
              <div className="bg-white border border-[#D5E3EF] rounded-2xl p-5 shadow-xs space-y-4">
                {/* Header: Cluster Question Bank + Set Name on the SAME line */}
                <div className="pb-3 border-b border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 flex-wrap">
                      <span className="text-[#4682B4]">
                        Cluster {selectedCluster?.cluster_number || '2.4'} Question Bank
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-slate-800">
                        {selectedSet.title}
                      </span>
                    </h3>

                    <div className="flex items-center gap-2">
                      {/* Print / Export Formal Cluster FSA Paper */}
                      <button
                        type="button"
                        onClick={() => setShowFsaPaperModal(true)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                        title="Print or export official Cluster FSA assessment instrument & memorandum"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Export FSA Paper</span>
                      </button>

                      {/* Quick Button to Add Another Question Set to this cluster! */}
                      <button
                        type="button"
                        onClick={() => handleOpenGenerator()}
                        className="px-3 py-1 bg-slate-100 hover:bg-[#4682B4] hover:text-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
                        title="Add another question set (Generic, Custom Workplace, or FSA Mock) for this cluster"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ New Set on Cluster {selectedCluster?.cluster_number}</span>
                      </button>
                    </div>
                  </div>

                  {/* Facilitator-Only QCTO EISA & IAC Badge Bar */}
                  {selectedCluster && (selectedCluster.eisa_focus_area || selectedCluster.mapped_iacs) && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {selectedCluster.eisa_focus_area && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1">
                          <span className="text-amber-700">🎯 Facilitator View:</span>
                          <span>{selectedCluster.eisa_focus_area}</span>
                        </span>
                      )}
                      {selectedCluster.weighting_percentage && (
                        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="text-emerald-700">⚖️ Weighting:</span>
                          <span className="font-bold">{selectedCluster.weighting_percentage}%</span>
                          <span className="text-emerald-600 font-normal">• Rec: {selectedCluster.recommended_question_count || 6} Qs</span>
                        </span>
                      )}
                      {selectedCluster.mapped_iacs && (
                        <span className="px-2 py-1 rounded-md text-[10.5px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 truncate max-w-xl" title={selectedCluster.mapped_iacs}>
                          <span className="text-slate-500">📋 IACs:</span>
                          <span className="truncate">{selectedCluster.mapped_iacs}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Persistent Source Reference & Notebook Prompt Copy */}
                {(selectedSet.custom_background_context || selectedSet.raw_notebook_extract) && (
                  <div className="p-3 bg-[#F1F9F3] border border-[#6DC082]/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#2e7d32] flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Persistent Source Reference:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNotebookPrompt}
                        className="text-[11px] font-semibold text-[#4682B4] hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Notebook Prompt</span>
                      </button>
                    </div>
                    {selectedSet.custom_background_context && (
                      <p className="text-slate-700 italic">
                        &quot;{selectedSet.custom_background_context}&quot;
                      </p>
                    )}
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
                    <button
                      onClick={handleAddQuestion}
                      className="text-xs font-semibold text-[#4682B4] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Blank Question</span>
                    </button>
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
                            <span className="text-[11px] font-bold text-[#1e3a5f] bg-[#4682B4]/15 px-2.5 py-0.5 rounded-md border border-[#4682B4]/25">
                              {q.format === 'MCQ' && 'Single Choice (MCQ)'}
                              {q.format === 'MULTIPLE' && 'Multiple Choice'}
                              {q.format === 'BINARY' && 'True / False'}
                              {q.format === 'SCALE' && 'Scale 1–5'}
                              {q.format === 'WORD_CLOUD' && 'Word Cloud'}
                            </span>
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
                            placeholder="Question stem (prompts learner guide search without page numbers or authentic EISA workplace scenario)..."
                          />
                        </div>

                        {/* Options with Particify Tile Badges (A, B, C, D) in LearnBlended palette */}
                        {q.format !== 'WORD_CLOUD' && (
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
                        <div className="bg-[#D5E3EF]/30 p-2.5 rounded-lg border border-[#D5E3EF]">
                          <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🟢 Model Answer & 📝 How the Assessor Marks This:</span>
                          </label>
                          <textarea
                            value={q.additional_text || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, { additional_text: e.target.value })}
                            rows={3}
                            className="w-full text-[11px] text-slate-800 bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#4682B4] font-mono leading-relaxed"
                            placeholder="🟢 Model Answer: [Step-by-step numbers or procedural standard]&#10;&#10;📝 How the Assessor Marks This: [Mark breakdown and common learner pitfalls]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#D5E3EF] rounded-2xl p-12 text-center shadow-xs">
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
          <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#4682B4] uppercase tracking-wider">
                  Occupational Course Setup
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  Add New Course Container
                </h3>
              </div>
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
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Course Description & Occupational Scope</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={2}
                  placeholder="Unit standard outcomes, workplace safety, receiving and dispatch..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4]"
                />
              </div>

              {/* QCTO Accreditation Checkbox Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQctoCourse}
                    onChange={(e) => setIsQctoCourse(e.target.checked)}
                    className="w-4 h-4 text-[#4682B4] rounded border-slate-300 focus:ring-[#4682B4]"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#4682B4]" />
                    Accredited QCTO Occupational Course (Requires EISA / FSA Alignment)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                  Enables auto-generating all canonical clusters in one shot, mapping EISA focus areas, tracking curriculum weighting %, and scaling recommended question counts automatically.
                </p>
              </div>

              {/* Step 2: QCTO Master Cluster-to-IAC Mapping (When QCTO course is checked) */}
              {isQctoCourse && (
                <div className="p-4 bg-[#F1F9F3] border border-[#6DC082]/40 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#2e7d32] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#6DC082]" />
                      Step 2: QCTO Master Cluster-to-IAC Mapping (One-Shot Cluster Generation)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Copy the prompt below into your NotebookLM (with your Curriculum Framework & EISA Specification selected), then paste the returned Master Mapping Table below to auto-create all clusters in one shot.
                  </p>

                  {/* Copy Prompt Button Banner */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-[#6DC082]/30 rounded-lg gap-2">
                    <div className="text-[11px] text-slate-600 truncate">
                      <span className="font-semibold text-slate-700">NotebookLM Master Prompt:</span>{' '}
                      Generates 5-column Markdown table mapping clusters, EISA focus, IACs, and weightings.
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyMasterPrompt}
                      className="px-3 py-1.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
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
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Paste NotebookLM Master Mapping Table (Markdown Table):
                    </label>
                    <textarea
                      value={masterIacTable}
                      onChange={(e) => setMasterIacTable(e.target.value)}
                      rows={5}
                      placeholder={`| Cluster Number | Cluster Title | Primary EISA Focus Area | Mapped IAC / AAC Assessment Criteria | Weighting & Assessment Focus |\n| **Cluster 1.1** | **The Receiving and Dispatch Environment** | Enabling Foundational Knowledge | ... | 100% of KM-01 (4 Credits) |\n| **Cluster 1.2** | **Prevent Shrinkage and Losses** | Focus Area 1 (50%) & Focus Area 2 (50%) | ... | 60% of KM-02 & 100% of PM-03 |`}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-mono leading-relaxed bg-white"
                    />
                  </div>

                  {/* Detection Feedback & Cluster Preview */}
                  {detectedClusters.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#2e7d32]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#6DC082]" />
                          ✓ {detectedClusters.length} Clusters Detected & Ready to Auto-Create!
                        </span>
                        <span className="text-[10px] font-normal text-slate-500">
                          (Group scaling: 15 for 50% EISA focus, 10 for operational, 8 min for foundational)
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white rounded-lg border border-[#6DC082]/30 text-xs">
                        {detectedClusters.map((cl) => (
                          <div key={cl.cluster_number} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                            <div className="min-w-0">
                              <span className="font-bold text-[#1e3a5f]">Cluster {cl.cluster_number}:</span>{' '}
                              <span className="font-semibold text-slate-700">{cl.title}</span>
                              {cl.eisa_focus_area && (
                                <span className="text-slate-500 block text-[10px] truncate">
                                  🎯 {cl.eisa_focus_area}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {cl.weighting_percentage}%
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {cl.recommended_question_count} Qs
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10.5px] text-slate-500 italic">
                        💡 Facilitator Note: You can still create your own additional generic, custom workplace (e.g. Spur), or FSA mock question sets on any cluster at any time!
                      </p>
                    </div>
                  ) : masterIacTable.trim() ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No clusters detected in table yet. Please make sure to copy the full Markdown table including the header and rows with &quot;|&quot;.</span>
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
                      ? `Create Course & Auto-Generate ${detectedClusters.length} Clusters`
                      : 'Create Course Container'}
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
          <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#4682B4] uppercase tracking-wider">
                  Gemini 3.8 Flash AI Engine
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  Generate Question Set
                </h3>
              </div>
            </div>

            <form onSubmit={handleGenerateQuestionSet} className="space-y-4">
              {/* Cluster Selection (Existing or New inline) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        1. Target Cluster Topic:
                      </label>
                      <select
                        value={targetClusterId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetClusterId(val);
                          const cl = clusters.find(c => c.id === val);
                          if (cl?.recommended_question_count) {
                            setQuestionCount(cl.recommended_question_count);
                          }
                          if (isFsaMockSet) {
                            const num = cl ? cl.cluster_number : 'New';
                            setSetTitle(`Cluster ${num} — Generic IAC FSA Mock Exam`);
                            setClientName(`Cluster ${num} IACs Only`);
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

                    {/* Set Type & Client Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Question Set Type</label>
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              checked={!isCustomSet && !isFsaMockSet}
                              onChange={() => {
                                setIsCustomSet(false);
                                setIsFsaMockSet(false);
                                setClientName('Generic Standard');
                                setSetTitle('Generic Standard Assessment');
                              }}
                              className="text-[#4682B4]"
                            />
                            <span>Generic Standard</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              checked={isCustomSet}
                              onChange={() => {
                                setIsCustomSet(true);
                                setIsFsaMockSet(false);
                                if (clientName === 'Generic Standard' || clientName.includes('IACs Only')) {
                                  setClientName('Spur Corporation');
                                }
                                setSetTitle('');
                              }}
                              className="text-[#4682B4]"
                            />
                            <span>Custom Workplace</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 cursor-pointer">
                            <input
                              type="radio"
                              checked={isFsaMockSet}
                              onChange={() => {
                                setIsCustomSet(false);
                                setIsFsaMockSet(true);
                                setClientName(`Cluster ${modalClusterNum} IACs Only`);
                                setSetTitle(`Cluster ${modalClusterNum} — Generic IAC FSA Mock Exam`);
                              }}
                              className="text-emerald-600"
                            />
                            <span className="flex items-center gap-1">
                              <span>Generic IAC FSA Mock</span>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">Exam</span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          {isFsaMockSet ? 'Assessment Scope' : isCustomSet ? 'Client / Company Name' : 'Client Association'}
                        </label>
                        <input
                          type="text"
                          value={isFsaMockSet ? `Cluster ${modalClusterNum} IACs Only` : clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Spur Corporation"
                          disabled={!isCustomSet}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] disabled:bg-emerald-50/40 disabled:text-emerald-900 font-semibold"
                        />
                        {isFsaMockSet && (
                          <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                            <span>✓</span>
                            <span>Targeting only Cluster {modalClusterNum} Integrated Assessment Criteria (IACs).</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Custom Context Box (Directly above prompt when isCustomSet is active) */}
                    {isCustomSet && (
                      <div className="p-3 bg-[#F1F9F3] border border-[#6DC082]/30 rounded-xl space-y-1">
                        <label className="text-xs font-bold text-[#2e7d32] flex items-center justify-between">
                          <span>Custom Operational Environment Context:</span>
                          <span className="text-[10px] font-normal text-slate-500">Included dynamically in prompt</span>
                        </label>
                        <textarea
                          value={customContext}
                          onChange={(e) => setCustomContext(e.target.value)}
                          rows={2}
                          placeholder="e.g. Spur Corporation employees working in a distribution warehouse in Montague Gardens dealing with cold storage, oil spills, and pallet heights..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#4682B4]"
                        />
                      </div>
                    )}

                    {/* Step 2: Copy Notebook Prompt Banner */}
                    <div className="p-3 bg-[#4682B4]/10 border border-[#4682B4]/30 rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1e3a5f] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#4682B4]" />
                            Copy Gemini Notebook Prompt (Learner Guide + EISA Specs)
                          </h4>
                          {/* Dynamic Target Indicator */}
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#4682B4]/20 text-[#1e3a5f] border border-[#4682B4]/30">
                            🎯 Targets:{' '}
                            {targetClusterId === 'new'
                              ? (newClusterNumber
                                ? `Cluster ${newClusterNumber}${newClusterTitle ? ` (${newClusterTitle})` : ''}`
                                : '⚠️ Fill Cluster # above')
                              : `Cluster ${modalClusterNum}`}
                            {isFsaMockSet ? ` • Cluster ${modalClusterNum} IACs Only` : (isCustomSet && clientName && clientName !== 'Generic Standard' ? ` • ${clientName}` : ' • Generic Standard')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {targetClusterId === 'new' && !newClusterNumber ? (
                            <span className="text-amber-700 font-medium">
                              Fill in New Cluster Number & Title above first so the prompt targets your exact topic!
                            </span>
                          ) : (
                            'Select your Learner Guide & EISA doc in NotebookLM, paste this prompt, and copy the extract back here.'
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNotebookPrompt}
                        className="px-3.5 py-1.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                      >
                  {promptCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Paste from Gemini Notebook */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Paste Gemini Notebook Extract (Learner Guide SOPs & EISA Assessment Criteria)
                </label>
                <textarea
                  value={notebookExtract}
                  onChange={(e) => setNotebookExtract(e.target.value)}
                  rows={4}
                  placeholder="Paste the generated response from your Gemini Notebook here..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#4682B4] font-mono"
                />
              </div>

              {/* Parameters Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Question Count</span>
                    {(() => {
                      const activeCl = clusters.find(c => c.id === targetClusterId) || selectedCluster;
                      if (activeCl?.recommended_question_count) {
                        return (
                          <span 
                            className="text-[10px] font-bold text-[#2e7d32] bg-[#6DC082]/15 px-1.5 py-0.2 rounded border border-[#6DC082]/30"
                            title={`Based on ${activeCl.weighting_percentage || 50}% curriculum weighting`}
                          >
                            🎯 Rec: {activeCl.recommended_question_count} Qs
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value={8}>8 Questions {(clusters.find(c => c.id === targetClusterId) || selectedCluster)?.recommended_question_count === 8 ? '⭐ (Recommended Minimum)' : ''}</option>
                    <option value={10}>10 Questions {(clusters.find(c => c.id === targetClusterId) || selectedCluster)?.recommended_question_count === 10 ? '⭐ (Recommended Standard)' : ''}</option>
                    <option value={12}>12 Questions {(clusters.find(c => c.id === targetClusterId) || selectedCluster)?.recommended_question_count === 12 ? '⭐ (Recommended)' : ''}</option>
                    <option value={15}>15 Questions {(clusters.find(c => c.id === targetClusterId) || selectedCluster)?.recommended_question_count === 15 ? '⭐ (Recommended Maximum)' : ''}</option>
                    <option value={20}>20 Questions (Extended Assessment)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Cognitive Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as CognitiveTargetLevel)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="foundational">Foundational (~70% Recall)</option>
                    <option value="operational">Operational (~55% Recall, ~35% Apply)</option>
                    <option value="advanced">Advanced (~40% Apply, ~20% Analyze)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Default Entry Mode</label>
                  <select
                    value={defaultEntryMode}
                    onChange={(e) => setDefaultEntryMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="group">Group Mode (Table Teams)</option>
                    <option value="individual">Individual Mode</option>
                  </select>
                </div>
              </div>

              {/* Timing Options */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4682B4]" />
                    Session Timing Mode & Duration:
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Controls classroom countdown & learner pace
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimingMode('overall')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      timingMode === 'overall'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Overall Time</span>
                      <span className={`text-[10px] px-1 rounded ${timingMode === 'overall' ? 'bg-white/20' : 'bg-slate-100'}`}>Total</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${timingMode === 'overall' ? 'text-white/80' : 'text-slate-500'}`}>
                      e.g. 20 min session
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingMode('per_question')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      timingMode === 'per_question'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Per Question</span>
                      <span className={`text-[10px] px-1 rounded ${timingMode === 'per_question' ? 'bg-white/20' : 'bg-slate-100'}`}>Standard</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${timingMode === 'per_question' ? 'text-white/80' : 'text-slate-500'}`}>
                      e.g. 45s countdown
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingMode('untimed')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      timingMode === 'untimed'
                        ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Untimed / Manual</span>
                      <span className={`text-[10px] px-1 rounded ${timingMode === 'untimed' ? 'bg-white/20' : 'bg-slate-100'}`}>No Timer</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${timingMode === 'untimed' ? 'text-white/80' : 'text-slate-500'}`}>
                      Facilitator-paced
                    </p>
                  </button>
                </div>

                {timingMode === 'overall' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-600 font-medium">Total Session Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={overallTimeMinutes}
                      onChange={(e) => setOverallTimeMinutes(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-center bg-white"
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
                      <option value={120}>120 seconds (Complex quantitative)</option>
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
                      <span>Generating with Gemini 3.8 Flash...</span>
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
          <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8 animate-in fade-in duration-150">
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
                /* PAPER / MEMO HEADER: CLEAN OCCUPATIONAL HEADING & PEER REVIEW BLOCK */
                <div id="fsa-paper-header" className="border-b-2 border-slate-900 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-[#4682B4] uppercase tracking-wider block">
                        {selectedCourse?.title || 'Occupational Store Person'} • Assessment Paper
                      </span>
                      <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        Cluster {selectedCluster?.cluster_number}: {selectedCluster?.title || selectedSet.title}
                      </h1>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded">
                        Total: <span className="text-[#2e7d32] font-black">{selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Time Allowed: {selectedSet.time_allowed_minutes || (selectedCluster?.weighting_percentage && selectedCluster.weighting_percentage >= 45 ? 45 : 30)} Minutes
                      </span>
                    </div>
                  </div>

                  {/* Clean Peer-Review Header Box */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="border-b border-slate-300 pb-1">
                        <span className="font-bold text-slate-700 block text-[11px]">Learner Full Name:</span>
                        <span className="block h-4"></span>
                      </div>
                      <div className="border-b border-slate-300 pb-1">
                        <span className="font-bold text-slate-700 block text-[11px]">Peer Reviewer (Checked By):</span>
                        <span className="block h-4"></span>
                      </div>
                      <div className="border-b border-slate-300 pb-1">
                        <span className="font-bold text-slate-700 block text-[11px]">Peer Review Score:</span>
                        <span className="block h-4 text-slate-400 font-mono">
                          ______ / {selectedSet.questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Assessment Instructions */}
                  <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-0.5">Assessment Instructions:</span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-700">
                      <li>Answer ALL questions individually. For calculations, write your working steps in the spaces provided.</li>
                      <li>Once completed, swap papers with your peer for review.</li>
                      <li>Mark your partner&apos;s paper against the model answers displayed on the classroom screen.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div className="space-y-6 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-1">
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
                      className={`question-print-item space-y-2 pb-5 border-b last:border-b-0 ${
                        fsaPaperMode === 'projector' 
                          ? 'border-slate-800 bg-[#121d3a] p-5 sm:p-6 rounded-2xl' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Question Stem & Marks */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className={`font-extrabold text-xs shrink-0 pt-0.5 ${
                            fsaPaperMode === 'projector' ? 'text-[#6DC082] text-sm' : 'text-slate-900'
                          }`}>
                            Question {idx + 1}.
                          </span>
                          <p className={`font-semibold leading-relaxed ${
                            fsaPaperMode === 'projector' ? 'text-sm sm:text-base text-white' : 'text-xs text-slate-800'
                          }`}>
                            {q.body}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 font-mono ${
                          fsaPaperMode === 'projector'
                            ? 'bg-[#1e2e54] text-emerald-400 border-[#2b4175]'
                            : 'text-slate-700 bg-slate-100 border-slate-300'
                        }`}>
                          [{qMarks} {qMarks === 1 ? 'Mark' : 'Marks'}]
                        </span>
                      </div>

                      {/* Options */}
                      {q.format !== 'WORD_CLOUD' && (
                        <div className={`space-y-1.5 pt-1 ${fsaPaperMode === 'projector' ? 'pl-7' : 'pl-6'}`}>
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correct_options.includes(optIdx);
                            const letter = optionLetters[optIdx] || String(optIdx + 1);

                            if (fsaPaperMode === 'projector') {
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
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`flex items-start gap-2.5 text-xs p-1.5 rounded ${
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
                                <span className="flex-1">{opt}</span>
                                {fsaPaperMode === 'memo' && isCorrect && (
                                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase shrink-0">
                                    [Correct Answer]
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Paper Mode: Calculation / Working Space for math & scenario questions */}
                      {fsaPaperMode === 'paper' && isCalculationQuestion && (
                        <div className="pl-6 pt-2">
                          <div className="border border-dashed border-slate-300 rounded p-2 text-[10.5px] text-slate-500 bg-slate-50/40">
                            <span className="font-semibold text-slate-600 block mb-1">
                              Show Calculations / Workplace Working Steps:
                            </span>
                            <div className="space-y-3 py-1">
                              <div className="border-b border-slate-200"></div>
                              <div className="border-b border-slate-200"></div>
                            </div>
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
                        <div className="pl-6 pt-2 space-y-2">
                          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-300 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed">
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
                <div id="fsa-paper-footer" className="border-t border-slate-300 pt-3 mt-6 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
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

      {/* Global CSS for Print Mode: Single-Pass A4 Output with Zero Duplication */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            background: white !important;
            color: black !important;
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
          }
          .question-print-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #fsa-paper-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 20px !important;
          }
        }
      `}} />
    </div>
  );
}
