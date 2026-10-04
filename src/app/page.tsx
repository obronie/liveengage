'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AppStore } from '@/lib/store';
import { Course, CourseCluster, QuestionSet, Question, Session, SessionEntryMode, QuestionFormat } from '@/types';
import { 
  Sparkles, 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Users, 
  User, 
  Building2, 
  BookOpen, 
  ArrowRight,
  FileQuestion,
  Tag,
  Save,
  Check,
  ChevronDown
} from 'lucide-react';

function SessionBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  // Hierarchy Selection State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [clusters, setClusters] = useState<CourseCluster[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');

  // Session Config State
  const [clientName, setClientName] = useState('Spur Corporation');
  const [cohortNumber, setCohortNumber] = useState<number>(1); // Clean numbers 1 to 10
  const [sessionTitle, setSessionTitle] = useState('Cluster 2.4 - Warehouse Housekeeping & Safety');
  const [entryMode, setEntryMode] = useState<SessionEntryMode>('group');
  const [facilitatorNotes, setFacilitatorNotes] = useState('Refer to your Learner Guide during answering. Deliberate with your table before locking in.');

  // Editable Questions Grid
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    router.replace('/courses');
  }, [router]);

  const loadInitialData = async () => {
    const loadedCourses = await AppStore.fetchCourses();
    setCourses(loadedCourses);
    
    let course = loadedCourses[0];
    if (preselectedCourseId && loadedCourses.some(c => c.id === preselectedCourseId)) {
      course = loadedCourses.find(c => c.id === preselectedCourseId)!;
    }

    if (course) {
      setSelectedCourseId(course.id);
      loadClustersForCourse(course.id);
    }
  };

  const loadClustersForCourse = (courseId: string) => {
    const loadedClusters = AppStore.getClusters(courseId);
    setClusters(loadedClusters);
    if (loadedClusters.length > 0) {
      const cluster = loadedClusters[0];
      setSelectedClusterId(cluster.id);
      loadQuestionSetsForCluster(cluster.id);
    } else {
      setSelectedClusterId('');
      setQuestionSets([]);
      setSelectedSetId('');
      setQuestions([]);
    }
  };

  const loadQuestionSetsForCluster = (clusterId: string, currentClusters?: CourseCluster[]) => {
    const sets = AppStore.getQuestionSets(clusterId);
    setQuestionSets(sets);
    const activeClusters = currentClusters || clusters;
    const cluster = activeClusters.find(c => c.id === clusterId);
    const clusterLabel = cluster ? `Cluster ${cluster.cluster_number}` : 'Cluster 2.4';

    if (sets.length > 0) {
      const qSet = sets[0];
      setSelectedSetId(qSet.id);
      if (qSet.is_custom) {
        setSessionTitle(qSet.title.startsWith('Cluster') ? qSet.title : `${clusterLabel} - ${qSet.title}`);
      } else {
        setSessionTitle(clusterLabel);
      }
      setEntryMode(qSet.default_entry_mode || 'group');
      setQuestions(qSet.questions || []);
    } else {
      setSelectedSetId('');
      setQuestions([]);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    loadClustersForCourse(courseId);
  };

  const handleClusterChange = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    loadQuestionSetsForCluster(clusterId);
  };

  const handleQuestionSetChange = (setId: string) => {
    setSelectedSetId(setId);
    const qSet = questionSets.find(s => s.id === setId);
    const cluster = clusters.find(c => c.id === selectedClusterId);
    const clusterLabel = cluster ? `Cluster ${cluster.cluster_number}` : 'Cluster 2.4';

    if (qSet) {
      if (qSet.is_custom) {
        setSessionTitle(qSet.title.startsWith('Cluster') ? qSet.title : `${clusterLabel} - ${qSet.title}`);
      } else {
        setSessionTitle(clusterLabel);
      }
      setEntryMode(qSet.default_entry_mode || 'group');
      setQuestions(qSet.questions || []);
    }
  };

  // --- Questions Grid Handlers ---
  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const updatedList = [...questions];
    updatedList[index] = { ...updatedList[index], ...updated };
    setQuestions(updatedList);
  };

  const handleToggleCorrectOption = (qIndex: number, optIndex: number) => {
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
    handleUpdateQuestion(qIndex, { correct_options: correct });
  };

  const handleAddBlankQuestion = (format: QuestionFormat = 'MCQ') => {
    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      question_order: questions.length + 1,
      format,
      body: 'According to your Learner Guide, ...',
      additional_text: 'Learner Guide explanation and practical workplace application.',
      options: format === 'WORD_CLOUD' ? [] : ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_options: format === 'WORD_CLOUD' ? [] : [0],
      duration: 45,
      guide_topic_hint: 'Module Key Concepts',
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, question_order: i + 1 }));
    setQuestions(updated);
  };

  // Save changes to current question set
  const handleSaveToQuestionBank = async () => {
    if (!selectedSetId) return;
    const currentSet = questionSets.find(s => s.id === selectedSetId);
    if (currentSet) {
      const updatedSet: QuestionSet = {
        ...currentSet,
        title: sessionTitle,
        default_entry_mode: entryMode,
        questions,
        updated_at: new Date().toISOString(),
      };
      await AppStore.saveQuestionSet(updatedSet);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  // --- Launch Live Session ---
  const handleLaunchSession = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question before launching.');
      return;
    }

    setIsLaunching(true);

    try {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();

      const newSession: Session = {
        id: 'sess-' + Math.random().toString(36).substring(2, 9),
        course_id: selectedCourseId,
        cluster_id: selectedClusterId,
        question_set_id: selectedSetId,
        title: sessionTitle.trim() || 'Live Facilitation Session',
        room_code: roomCode,
        client_name: clientName.trim(),
        cohort_number: cohortNumber,
        entry_mode: entryMode,
        status: 'lobby',
        current_question_index: 0,
        facilitator_instructions: facilitatorNotes,
        created_at: new Date().toISOString(),
        questions: questions.map((q, idx) => ({ ...q, question_order: idx + 1 })),
      };

      await AppStore.saveSession(newSession);
      router.push(`/presenter/${roomCode}`);
    } catch (err) {
      console.error(err);
      alert('Failed to launch session');
      setIsLaunching(false);
    }
  };

  const currentSet = questionSets.find(s => s.id === selectedSetId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F9F3]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4682B4] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Session Setup & Question Bank Launcher</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Facilitator Session Builder
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Select your Course, Cluster, and Question Set to launch live classroom polls with instant PIN and QR code access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToQuestionBank}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{saveFeedback ? 'Saved to Bank!' : 'Save to Bank'}</span>
            </button>

            <button
              onClick={handleLaunchSession}
              disabled={isLaunching || questions.length === 0}
              className="px-5 py-2.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4682B4]/20 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{isLaunching ? 'Initializing Room...' : 'Launch Live Room'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Matrix (Course -> Cluster -> Question Set -> Client & Cohort) */}
        <div className="bg-white border border-[#D5E3EF] rounded-2xl p-6 shadow-xs mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            {/* 1. Select Course */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#4682B4]" />
                1. Course Container
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#4682B4]"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Cluster */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#4682B4]" />
                2. Cluster Topic
              </label>
              <select
                value={selectedClusterId}
                onChange={(e) => handleClusterChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#4682B4]"
              >
                {clusters.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    Cluster {cl.cluster_number} - {cl.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Select Question Set (Multi-Bank) */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-[#4682B4]" />
                3. Question Set
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => handleQuestionSetChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#4682B4]"
              >
                {questionSets.map(qs => (
                  <option key={qs.id} value={qs.id}>
                    {qs.title} ({qs.is_custom ? 'Custom' : 'Generic'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Session Parameters: Client Name, Cohort (1-10), Entry Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#4682B4]" />
                Client / Company Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Spur Corporation"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#4682B4]"
              />
            </div>

            {/* Cohort is just a number between 1 and 10 */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#4682B4]" />
                Cohort (1 to 10)
              </label>
              <select
                value={cohortNumber}
                onChange={(e) => setCohortNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#4682B4] font-semibold text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    Cohort {num}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#4682B4]" />
                Identity Mode
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryMode('group')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    entryMode === 'group'
                      ? 'bg-white text-[#4682B4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Table Groups
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('individual')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    entryMode === 'individual'
                      ? 'bg-white text-[#4682B4] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Individuals
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Session Display Title
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#4682B4]"
              />
            </div>
          </div>

          {/* Context Notes Banner (If custom set) */}
          {currentSet?.custom_background_context && (
            <div className="p-3 bg-[#F1F9F3] border border-[#6DC082]/30 rounded-xl flex items-center gap-2 text-xs">
              <span className="font-bold text-[#2e7d32]">Client Context:</span>
              <span className="text-slate-700 italic">{currentSet.custom_background_context}</span>
            </div>
          )}
        </div>

        {/* Questions Grid Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Interactive Review Grid ({questions.length} Questions)
            </h2>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#4682B4]/10 text-[#4682B4] border border-[#4682B4]/20">
              {entryMode === 'group' ? '100 Flat Points (No speed rush)' : '100 Base + 10 Speed Bonus'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddBlankQuestion('MCQ')}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#4682B4]" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Questions Cards */}
        <div className="space-y-4">
          {questions.map((q, qIndex) => {
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];
            return (
              <div
                key={q.id || qIndex}
                className="bg-white border border-[#D5E3EF] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#4682B4]/40 transition-colors"
              >
                {/* Header row: Number, Format, Timer, Delete */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#4682B4] text-white text-xs font-bold flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <span className="text-[11px] font-bold text-[#1e3a5f] bg-[#4682B4]/15 px-2.5 py-1 rounded-md border border-[#4682B4]/25">
                      {q.format === 'MCQ' && 'Single Choice (MCQ)'}
                      {q.format === 'MULTIPLE' && 'Multiple Choice'}
                      {q.format === 'BINARY' && 'True / False'}
                      {q.format === 'SCALE' && 'Scale 1–5'}
                      {q.format === 'WORD_CLOUD' && 'Word Cloud'}
                    </span>

                    <input
                      type="text"
                      value={q.guide_topic_hint || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, { guide_topic_hint: e.target.value })}
                      placeholder="Learner Guide SOP Topic Reference (e.g. Section 2.1)"
                      className="text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#4682B4] focus:outline-none px-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                      <Clock className="w-3.5 h-3.5 text-[#4682B4]" />
                      <select
                        value={q.duration}
                        onChange={(e) => handleUpdateQuestion(qIndex, { duration: Number(e.target.value) })}
                        className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none"
                      >
                        <option value={0}>Untimed (Manual Lock)</option>
                        <option value={30}>30s (Rapid)</option>
                        <option value={45}>45s (Standard)</option>
                        <option value={60}>60s (Detailed)</option>
                        <option value={90}>90s (Complex Scenario)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(qIndex)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div>
                  <textarea
                    value={q.body}
                    onChange={(e) => handleUpdateQuestion(qIndex, { body: e.target.value })}
                    rows={2}
                    className="w-full text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#4682B4] focus:bg-white"
                    placeholder="Question stem (prompts search in learner guide without explicit page numbers)..."
                  />
                </div>

                {/* Options with Particify Tile Badges (A, B, C, D) in LearnBlended palette */}
                {q.format !== 'WORD_CLOUD' && (
                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correct_options.includes(optIndex);
                      const letter = optionLetters[optIndex] || String(optIndex + 1);
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs transition-colors ${
                            isCorrect 
                              ? 'bg-[#6DC082]/10 border-[#6DC082]' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {/* Particify Tile Badge */}
                          <button
                            type="button"
                            onClick={() => handleToggleCorrectOption(qIndex, optIndex)}
                            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors text-xs ${
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
                            className="flex-1 bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                          />

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-[#2e7d32] px-2 py-0.5 rounded-full bg-[#6DC082]/20 border border-[#6DC082]/30">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Debrief & Workplace Rationale */}
                <div className="bg-[#D5E3EF]/30 p-3 rounded-xl border border-[#D5E3EF]">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#4682B4]" />
                    Learner Guide Workplace Rationale & Debrief (Displayed on Reveal):
                  </label>
                  <textarea
                    value={q.additional_text || ''}
                    onChange={(e) => handleUpdateQuestion(qIndex, { additional_text: e.target.value })}
                    rows={2}
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#4682B4]"
                    placeholder="Clear explanation of the correct answer and practical workplace context..."
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Launch Bar */}
        <div className="mt-8 pt-4 border-t border-[#D5E3EF] flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Cohort {cohortNumber} • {questions.length} Questions ready
          </div>

          <button
            onClick={handleLaunchSession}
            disabled={isLaunching || questions.length === 0}
            className="px-6 py-3 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4682B4]/20 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{isLaunching ? 'Initializing Room...' : 'Launch Live Room'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SessionBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Session Builder...</div>}>
      <SessionBuilderContent />
    </Suspense>
  );
}
