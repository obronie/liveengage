'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AppStore } from '@/lib/store';
import { Course, Question, Session, SessionEntryMode, QuestionFormat } from '@/types';
import { 
  Sparkles, 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Users, 
  User, 
  Building2, 
  BookOpen, 
  ArrowRight,
  RefreshCw,
  Sliders,
  Radio,
  FileQuestion,
  ChevronDown
} from 'lucide-react';

function SessionBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [clientName, setClientName] = useState('Spur Corporation');
  const [groupName, setGroupName] = useState('Cohort B - Morning Group');
  const [sessionTitle, setSessionTitle] = useState('Cluster 2.4 - Warehouse Housekeeping & Safety');
  const [entryMode, setEntryMode] = useState<SessionEntryMode>('group');
  const [facilitatorInstructions, setFacilitatorInstructions] = useState(
    'Welcome team! Grab your Learner Guide Module 2. Table teams discuss before locking answers.'
  );

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('Generate 4 practical scenario questions on warehouse housekeeping, chemical spills, and PPE requirements');
  const [questionCount, setQuestionCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Questions Review Grid
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Active Sessions
  const [pastSessions, setPastSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const loadedCourses = await AppStore.fetchCourses();
    setCourses(loadedCourses);
    
    if (preselectedCourseId && loadedCourses.some(c => c.id === preselectedCourseId)) {
      setSelectedCourseId(preselectedCourseId);
      const target = loadedCourses.find(c => c.id === preselectedCourseId);
      if (target) {
        setSessionTitle(`${target.code} - ${target.title}`);
      }
    } else if (loadedCourses.length > 0) {
      setSelectedCourseId(loadedCourses[0].id);
      setSessionTitle(`${loadedCourses[0].code} - ${loadedCourses[0].title}`);
    }

    const sessions = AppStore.getSessions();
    setPastSessions(sessions);

    // Initial default question set if none exist
    if (questions.length === 0) {
      handleGenerateAI(true);
    }
  };

  const handleGenerateAI = async (initialRun = false) => {
    setIsGenerating(true);
    setAiError(null);

    try {
      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      const courseContext = selectedCourse?.documents?.map(d => `${d.file_name}:\n${d.extracted_text}`).join('\n\n') || '';

      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('liveengage_gemini_key') || '' : '';

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          courseContext,
          questionCount: initialRun ? 4 : questionCount,
          apiKey: localGeminiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

      const mapped: Question[] = data.questions.map((q: any, idx: number) => ({
        id: 'q-' + Math.random().toString(36).substring(2, 9),
        question_order: idx + 1,
        format: q.format as QuestionFormat,
        body: q.body,
        additional_text: q.additionalText,
        options: q.options || [],
        correct_options: q.correctOptions || [0],
        duration: q.duration || 45,
        guide_topic_hint: q.guideTopicHint || '',
      }));

      setQuestions(mapped);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddBlankQuestion = (format: QuestionFormat = 'MCQ') => {
    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      question_order: questions.length + 1,
      format,
      body: 'According to your Learner Guide, ...',
      additional_text: 'Learner Guide explanation and workplace application.',
      options: format === 'WORD_CLOUD' ? [] : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_options: format === 'WORD_CLOUD' ? [] : [0],
      duration: 45,
      guide_topic_hint: 'Module Key Concepts',
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const updatedList = [...questions];
    updatedList[index] = { ...updatedList[index], ...updated };
    setQuestions(updatedList);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, question_order: i + 1 }));
    setQuestions(updated);
  };

  const handleToggleCorrectOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    let newCorrect: number[] = [];

    if (q.format === 'MCQ' || q.format === 'BINARY') {
      newCorrect = [optIndex];
    } else {
      if (q.correct_options.includes(optIndex)) {
        newCorrect = q.correct_options.filter(i => i !== optIndex);
      } else {
        newCorrect = [...q.correct_options, optIndex].sort((a, b) => a - b);
      }
    }
    handleUpdateQuestion(qIndex, { correct_options: newCorrect });
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const q = questions[qIndex];
    const newOptions = [...q.options];
    newOptions[optIndex] = text;
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOptions = [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`];
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    const newCorrect = q.correct_options
      .filter(i => i !== optIndex)
      .map(i => (i > optIndex ? i - 1 : i));
    handleUpdateQuestion(qIndex, { options: newOptions, correct_options: newCorrect });
  };

  const handleLaunchSession = async () => {
    if (questions.length === 0) {
      alert('Please add or generate at least one question before launching.');
      return;
    }

    setIsLaunching(true);
    // Generate clean 6-digit room code
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newSession: Session = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      course_id: selectedCourseId || null,
      title: sessionTitle || 'Live Classroom Poll',
      room_code: roomCode,
      entry_mode: entryMode,
      status: 'lobby',
      current_question_index: 0,
      facilitator_instructions: facilitatorInstructions,
      created_at: new Date().toISOString(),
      group: {
        id: 'grp-' + Math.random().toString(36).substring(2, 9),
        client_name: clientName,
        group_name: groupName,
        created_at: new Date().toISOString(),
      },
      questions: questions.map((q, idx) => ({ ...q, question_order: idx + 1 })),
      participants: [],
    };

    await AppStore.saveSession(newSession);
    router.push(`/presenter/${roomCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Facilitator Mission Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Session Builder & Live Quiz Architect
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Construct high-engagement sessions in seconds with Google Gemini AI. Every question is calibrated for learner guide navigation and team debate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchSession}
              disabled={isLaunching || questions.length === 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Room & Projector View</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="mt-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Session Metadata & Cohort Configuration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Course Ingestion Source</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const c = courses.find(item => item.id === e.target.value);
                  if (c) setSessionTitle(`${c.code} - ${c.title}`);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    [{course.code}] {course.title}
                  </option>
                ))}
                <option value="">Ad-hoc / Scratchpad (No course documents)</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Client / Organization</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Spur Corp, Woolworths"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Cohort / Group Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cohort / Session Group</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Cohort B - Morning"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Entry Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Identity & Scoring Mode</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEntryMode('group')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    entryMode === 'group'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Group Tables</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('individual')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    entryMode === 'individual'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Individual</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Session Display Title
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Facilitator Waiting Room Instructions (Shown on participant screens)
              </label>
              <input
                type="text"
                value={facilitatorInstructions}
                onChange={(e) => setFacilitatorInstructions(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI Question Generator Section */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Gemini AI Question Generator
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    Structured Outputs
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Interrogates ingested course documents with search prompts ("According to your Learner Guide...").
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Count:</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value={3}>3 questions</option>
                  <option value={4}>4 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={7}>7 questions</option>
                  <option value={10}>10 questions</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateAI(false)}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating Questions...' : 'Generate with AI'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Generate 5 scenario MCQs on warehouse chemical spills from Module 2..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>

          {aiError && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
              {aiError}
            </div>
          )}
        </div>

        {/* Questions In-App Review Grid */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Interactive Review Grid</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit question stems, options, correct answers, durations, and guide search prompts before presenting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddBlankQuestion('MCQ')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add MCQ</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddBlankQuestion('WORD_CLOUD')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Word Cloud</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4"
              >
                {/* Card Top: Order, Format, Timer, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      #{q.question_order}
                    </span>

                    {/* Format Dropdown */}
                    <select
                      value={q.format}
                      onChange={(e) => {
                        const newFormat = e.target.value as QuestionFormat;
                        let opts = q.options;
                        let correct = q.correct_options;
                        if (newFormat === 'WORD_CLOUD') {
                          opts = [];
                          correct = [];
                        } else if (newFormat === 'BINARY') {
                          opts = ['True', 'False'];
                          correct = [0];
                        } else if (opts.length === 0) {
                          opts = ['Option A', 'Option B', 'Option C', 'Option D'];
                          correct = [0];
                        }
                        handleUpdateQuestion(qIdx, { format: newFormat, options: opts, correct_options: correct });
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="MCQ">Single Choice (MCQ)</option>
                      <option value="MULTIPLE">Multiple Choice (Select all)</option>
                      <option value="BINARY">Binary (True/False)</option>
                      <option value="SCALE">Rating Scale (1–5)</option>
                      <option value="WORD_CLOUD">Word Cloud (Open text)</option>
                    </select>

                    {/* Timer Dropdown */}
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <select
                        value={q.duration}
                        onChange={(e) => handleUpdateQuestion(qIdx, { duration: Number(e.target.value) })}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                      >
                        <option value={30}>30s countdown</option>
                        <option value={45}>45s countdown</option>
                        <option value={60}>60s countdown</option>
                        <option value={90}>90s countdown</option>
                        <option value={120}>120s countdown</option>
                        <option value={0}>Untimed (Manual facilitator lock)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(qIdx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Stem Body */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Question Stem
                  </label>
                  <textarea
                    rows={2}
                    value={q.body}
                    onChange={(e) => handleUpdateQuestion(qIdx, { body: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter question text..."
                  />
                </div>

                {/* Options Section */}
                {q.format !== 'WORD_CLOUD' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Options (Click circle/box to set correct answer)
                      </label>
                      {q.format !== 'BINARY' && (
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIdx)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          + Add Option Choice
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correct_options.includes(optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-950/70 border-slate-800 text-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleCorrectOption(qIdx, optIdx)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                              }`}
                              title={isCorrect ? 'Correct Option' : 'Mark as Correct'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOptionText(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent border-0 text-xs font-medium text-white focus:outline-none"
                            />

                            {q.format !== 'BINARY' && q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                                className="text-slate-500 hover:text-red-400 text-xs p-1"
                                title="Remove Choice"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-xs text-slate-400">
                    <span className="font-semibold text-indigo-300">Word Cloud Mode:</span> Learners submit open-ended keywords or short phrases. Submissions are dynamically aggregated and weighted on the Presenter display. Facilitators have a 1-click &quot;Click-to-Hide&quot; moderation tool.
                  </div>
                )}

                {/* Additional Text / Reveal Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Learner Guide Topic Hint (Navigation prompt)
                    </label>
                    <input
                      type="text"
                      value={q.guide_topic_hint || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { guide_topic_hint: e.target.value })}
                      placeholder="e.g. Module 2: Section 2.1 - Core Workplace Housekeeping"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Explanation / Additional Text (Revealed after answers lock)
                    </label>
                    <input
                      type="text"
                      value={q.additional_text || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { additional_text: e.target.value })}
                      placeholder="Rationale explained to participants upon reveal..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Launch Button */}
          <div className="pt-6 flex justify-end">
            <button
              onClick={handleLaunchSession}
              disabled={isLaunching || questions.length === 0}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Live Session ({questions.length} Questions)</span>
            </button>
          </div>
        </div>

        {/* Saved Sessions Quick Access */}
        {pastSessions.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Recently Created Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pastSessions.slice(0, 3).map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                      PIN: {sess.room_code}
                    </span>
                    <h4 className="font-semibold text-white text-xs mt-1.5 line-clamp-1">{sess.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      {sess.questions?.length || 0} questions • Mode: {sess.entry_mode}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/presenter/${sess.room_code}`)}
                    className="p-2 text-indigo-400 hover:text-white bg-indigo-600/10 hover:bg-indigo-600/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SessionBuilderPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">Loading Session Builder...</div>}>
      <SessionBuilderContent />
    </React.Suspense>
  );
}
