'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  History, 
  Settings, 
  Radio, 
  Smartphone, 
  Check, 
  Database,
  X,
  Layers,
  Play,
  ChevronRight,
  Users,
  User,
  Clock,
  HelpCircle,
  FileCheck,
  FileText,
  Printer,
  Monitor,
  CheckCircle2,
  Award,
  ShieldCheck,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AppStore } from '@/lib/store';
import { Course, CourseCluster, QuestionSet, Session, SessionEntryMode } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Instant Launch Live State (1-Click, Zero Modals!)
  const [isLaunching, setIsLaunching] = useState(false);

  // Facilitator Help & Process Guide Modal
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'overview' | 'course_setup' | 'question_sets' | 'paper_assessment' | 'live_quizzes' | 'history'>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGemini = localStorage.getItem('liveengage_gemini_key') || '';
      const storedModel = localStorage.getItem('liveengage_gemini_model') || 'gemini-3.8-flash';
      const storedSupaUrl = localStorage.getItem('liveengage_supabase_url') || '';
      const storedSupaKey = localStorage.getItem('liveengage_supabase_key') || '';
      setGeminiKey(storedGemini);
      setGeminiModel(storedModel);
      setSupabaseUrl(storedSupaUrl);
      setSupabaseKey(storedSupaKey);
      setIsCloudActive(isSupabaseConfigured());
      if (showSettings) {
        AppStore.fetchCourses().then(list => setCoursesList(list));
      }
    }
  }, [showSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveengage_gemini_key', geminiKey.trim());
      localStorage.setItem('liveengage_gemini_model', geminiModel.trim());
      localStorage.setItem('liveengage_supabase_url', supabaseUrl.trim());
      localStorage.setItem('liveengage_supabase_key', supabaseKey.trim());
      setSavedSuccess(true);
      setIsCloudActive(isSupabaseConfigured());
      setTimeout(() => {
        setSavedSuccess(false);
        setShowSettings(false);
        window.location.reload();
      }, 600);
    }
  };

  // 1-Click Instant Launch: ZERO modals, ZERO popups! Directly jumps to the live presenter room!
  const handleInstantLaunchLive = async () => {
    if (isLaunching) return;
    setIsLaunching(true);

    try {
      const courses = AppStore.getCourses();
      if (courses.length === 0) {
        router.push('/courses');
        return;
      }

      const activeSel = AppStore.getActiveSelection();
      let targetCourse = courses[0];
      if (activeSel?.courseId) {
        const found = courses.find(c => c.id === activeSel.courseId);
        if (found) targetCourse = found;
      }

      const clusters = AppStore.getClusters(targetCourse.id);
      if (clusters.length === 0) {
        router.push('/courses');
        return;
      }

      let targetCluster = clusters[0];
      if (activeSel?.clusterId) {
        const found = clusters.find(cl => cl.id === activeSel.clusterId);
        if (found) targetCluster = found;
      }

      const sets = AppStore.getQuestionSets(targetCluster.id);
      if (sets.length === 0) {
        router.push('/courses');
        return;
      }

      let targetSet = sets[0];
      if (activeSel?.setId) {
        const found = sets.find(s => s.id === activeSel.setId);
        if (found) targetSet = found;
      }

      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const clusterPrefix = `Cluster ${targetCluster.cluster_number}`;
      const cleanTitle = targetSet.is_custom 
        ? (targetSet.title.startsWith('Cluster') ? targetSet.title : `${clusterPrefix} - ${targetSet.title}`)
        : clusterPrefix;

      const newSession: Session = {
        id: 'sess-' + Math.random().toString(36).substring(2, 9),
        course_id: targetCourse.id,
        cluster_id: targetCluster.id,
        question_set_id: targetSet.id,
        title: cleanTitle,
        room_code: roomCode,
        client_name: targetSet.client_name || 'Generic Standard',
        cohort_number: 1,
        entry_mode: targetSet.default_entry_mode || 'group',
        status: 'lobby',
        current_question_index: 0,
        facilitator_instructions: 'Refer to your Learner Guide during answering. Deliberate with your table before locking in.',
        created_at: new Date().toISOString(),
        questions: targetSet.questions || [],
      };

      await AppStore.saveSession(newSession);
      router.push(`/presenter/${roomCode}`);
    } catch (err) {
      console.error('Failed to launch live room:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <>
      <header className="border-b border-[#D5E3EF] bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* BRAND: Keep logo image + Heading "Learner Polling" with LearnBlended */}
          <div className="flex items-center gap-3">
            <Link href="/courses" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4682B4] to-[#6DC082] p-0.5 shadow-md shadow-[#4682B4]/15 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-[#4682B4]" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#1e293b] flex items-center gap-2">
                  LearnBlended
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#6DC082]/15 text-[#2b773f] border border-[#6DC082]/30 font-bold">
                    Learner Polling
                  </span>
                </span>
                <span className="text-[11px] text-[#696969] block -mt-0.5">
                  Corporate & Workplace Training Engagement
                </span>
              </div>
            </Link>
          </div>

          {/* NAV ACTIONS: Course & Question Banks, Launch Live, Learner Screen, Settings */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/courses"
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/courses') || pathname === '/'
                  ? 'bg-[#4682B4]/10 text-[#4682B4] border border-[#4682B4]/30' 
                  : 'text-slate-600 hover:text-[#4682B4] hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Course & Question Banks</span>
              <span className="md:hidden">Questions</span>
            </Link>

            {/* Launch Live Button - 1-Click Instant Launch, ZERO Popups! */}
            <button
              onClick={handleInstantLaunchLive}
              disabled={isLaunching}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-[#6DC082] hover:bg-[#5cb372] text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Launch Live Session Immediately (Zero Popups)"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isLaunching ? 'Launching...' : 'Launch Live'}</span>
            </button>

            {/* Learner Screen Button */}
            <Link
              href="/play"
              target="_blank"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-[#2e7d32] bg-[#6DC082]/15 hover:bg-[#6DC082]/25 border border-[#6DC082]/30 rounded-lg transition-colors flex items-center gap-1.5"
              title="Open Learner Mobile View in New Tab"
            >
              <Smartphone className="w-4 h-4 text-[#2e7d32]" />
              <span className="hidden sm:inline">Learner Screen</span>
            </Link>

            {/* Step-by-Step Facilitator Process Guide Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#4682B4] hover:bg-[#4682B4]/10 rounded-lg border border-[#4682B4]/30 transition-colors flex items-center gap-1.5"
              title="Step-by-Step Process Guide & Facilitator Help Menu"
            >
              <HelpCircle className="w-4 h-4 text-[#4682B4]" />
              <span className="hidden sm:inline">Guide & Help</span>
            </button>

            {/* Settings (contains Session History inside!) */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
              title="Settings & Session History"
            >
              <Settings className="w-4 h-4" />
              {!isCloudActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* SETTINGS MODAL (Houses Session History Archive + Gemini & Cloud Config) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-[#D5E3EF] flex items-center justify-between bg-[#F1F9F3]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#4682B4]" />
                <h3 className="text-base font-bold text-slate-800">LearnBlended Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* COURSE MANAGEMENT & DELETION */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-rose-600" />
                    Course Management & Deletion
                  </h4>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                    {coursesList.length} course{coursesList.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Permanently remove registered courses, including their clusters, question banks, and uploaded framework documents from both local and cloud databases.
                </p>

                {coursesList.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                    {coursesList.map((c) => (
                      <div 
                        key={c.id} 
                        className="p-2.5 bg-white border border-rose-100 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {c.code} — {c.title}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold">{c.code}</span>
                            <span>•</span>
                            <span>{c.is_qcto ? 'QCTO Framework' : 'Standard Course'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={deletingCourseId === c.id}
                          onClick={async () => {
                            if (confirm(`Are you sure you want to permanently delete course "${c.code} — ${c.title}"?\n\nWARNING: This will delete all associated clusters and question banks from the cloud database.`)) {
                              setDeletingCourseId(c.id);
                              try {
                                await AppStore.deleteCourse(c.id);
                                const updated = await AppStore.fetchCourses();
                                setCoursesList(updated);
                                if (pathname.includes('/courses')) {
                                  window.location.reload();
                                }
                              } finally {
                                setDeletingCourseId(null);
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingCourseId === c.id ? 'Deleting...' : 'Delete Course'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">No courses found in database.</p>
                )}
              </div>

              {/* SESSION HISTORY & AUDIT ARCHIVE LINK */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#4682B4]" />
                    Session History & Audit Logs
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review past cohort scores, question-by-question responses, and export CSV audit reports.
                  </p>
                </div>
                <Link
                  href="/history"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#4682B4] border border-slate-300 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <span>Open History</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <div className="mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#4682B4]" />
                      Google Gemini API Key
                    </label>
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use server environment key)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4] focus:ring-1 focus:ring-[#4682B4]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports Google AI Studio standard free tier with zero additional cost.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Gemini Flash Model
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#4682B4] focus:ring-1 focus:ring-[#4682B4]"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Primary Default)</option>
                    <option value="gemini-3.7-flash">gemini-3.7-flash (Reasoning Flash)</option>
                    <option value="gemini-3.6-flash">gemini-3.6-flash (AI Studio Verified)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Fast Flash)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (High Speed)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#4682B4]" />
                      Supabase Cloud Realtime (Optional)
                    </label>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isCloudActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCloudActive ? 'Cloud Active' : 'Local + Offline Active'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4] mb-2"
                  />
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="Supabase Anon Key"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-[#4682B4] hover:bg-[#3b6f9a] text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save & Apply</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FACILITATOR HELP & PROCESS GUIDE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1e293b] to-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4682B4]/20 border border-[#4682B4]/40 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6 text-[#6DC082]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    Facilitator Playbook & Step-by-Step Guide
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6DC082]/20 text-[#6DC082] border border-[#6DC082]/30 font-bold uppercase tracking-wider">
                      Zero Confusion
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Step-by-step instructions for courses, question sets, peer-review papers, and live screen debriefs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs font-bold">
              {[
                { id: 'overview', label: '🚀 Quick Flow', icon: Layers },
                { id: 'course_setup', label: '1. Course & Auto-Clusters', icon: BookOpen },
                { id: 'question_sets', label: '2. Question Sets (8-15 Qs)', icon: FileText },
                { id: 'paper_assessment', label: '3. Paper & Peer Marking', icon: Printer },
                { id: 'live_quizzes', label: '4. Live Group Polling', icon: Play },
                { id: 'history', label: '5. History & Audit', icon: History },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = helpTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setHelpTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#4682B4] text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm leading-relaxed">
              
              {/* TAB 1: OVERVIEW */}
              {helpTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      The LearnBlended Operational Training Flow
                    </h3>
                    <p className="text-xs text-slate-600">
                      You never have to guess what to do next. Here is the complete end-to-end journey from curriculum setup to classroom debrief:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Setup Course & Clusters</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Paste the Master IAC table from Google NotebookLM. The app automatically creates all 7 curriculum clusters with weightings, recommended questions (8-15), and EISA focus areas.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Generate Question Sets</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Create Generic Standard, Custom Workplace (e.g. Spur DC), or FSA Mock sets. The AI engine applies South African 15% VAT, delivery discrepancies, and mark allocations.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Print Paper & Peer Review</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Print clean A4 assessment papers for learners to write on. Learners swap papers with a desk partner. Switch to <strong>Projector Mode</strong> to display model answers on screen for peer checking!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Live Collaborative Polling</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Click <strong>Launch Live</strong>. Table groups deliberate, lock in consensus answers on phones, and see live animated bar charts and model answer debriefs on the projector.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Senior Instructional Designer Golden Rule
                    </h4>
                    <p className="text-xs text-slate-600">
                      <strong>Learner Privacy:</strong> Learners NEVER see administrative syllabus codes (KM-01, IAC0201) or weightings on their screens or papers. Those are strictly for you, the facilitator, ensuring high-stakes exam alignment without cluttering adult learners.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: COURSE SETUP */}
              {helpTab === 'course_setup' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Phase 1: Adding a Course & Auto-Mapping Clusters
                    </h3>
                    <p className="text-xs text-slate-600">
                      How to import an occupational qualification without manually typing dozens of modules and criteria.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Open Add Course Modal</strong>
                        <p className="text-xs text-slate-600">
                          Go to <strong>Courses</strong> and click the <strong>+ Add Course</strong> button in the top bar. Enter the Course Code (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">OQ99446</code>) and Title.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Copy NotebookLM Master Prompt</strong>
                        <p className="text-xs text-slate-600">
                          Click <strong>&quot;📋 Copy Prompt for Gemini NotebookLM&quot;</strong> in the modal. This copies a prompt instructing Gemini to analyze your uploaded Curriculum Framework and EISA specifications.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Paste Prompt into Google NotebookLM</strong>
                        <p className="text-xs text-slate-600">
                          In your Gemini Notebook where you uploaded the QCTO Curriculum and EISA PDFs, paste the prompt into the chat and hit Enter. NotebookLM will output a structured Markdown table with 5 columns.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#6DC082] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Paste Table Back into LearnBlended</strong>
                        <p className="text-xs text-slate-600">
                          Paste the Markdown table into the <strong>Master Mapping Table</strong> box. The app instantly detects all 7 clusters, their weightings, and recommended question counts. Click <strong>Create Course</strong> to auto-build your course structure!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: QUESTION SETS & SCALING */}
              {helpTab === 'question_sets' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Phase 2: Question Sets & Scaling Rules (8 to 15 Questions)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Why question counts vary per cluster and how to generate high-yield workplace assessments.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Curriculum Weighting Scaling Matrix
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase block">Foundational (&lt;20%)</span>
                        <div className="text-lg font-black text-slate-900">8 Questions</div>
                        <p className="text-[11px] text-slate-500">~20-25 mins. Clusters 1.1 (15%) &amp; 2.4 (10%).</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">Core Operational (20-44%)</span>
                        <div className="text-lg font-black text-slate-900">10-12 Questions</div>
                        <p className="text-[11px] text-slate-500">~28-34 mins. Clusters 2.1 (20%), 2.2 (25%), 2.3 (25%).</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block">High-Stakes EISA (≥45%)</span>
                        <div className="text-lg font-black text-slate-900">15 Questions</div>
                        <p className="text-[11px] text-slate-500">~36-45 mins. Clusters 1.2 (50%) &amp; 1.3 (50%).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900">Three Types of Question Sets:</h4>
                    <ul className="space-y-2 list-disc pl-4 text-slate-700">
                      <li><strong>Generic Standard:</strong> Pure curriculum and SOP standard questions for foundational knowledge checks.</li>
                      <li><strong>Custom Workplace (e.g. Spur DC):</strong> Uses the client context (cold chain, hot oil, blast freezers) to contextualize questions.</li>
                      <li><strong>Cluster FSA Mock:</strong> Authentic national exam mock strictly scoped to that specific cluster, featuring multi-step math (15% VAT, delivery note variance, CRAVED loss calculations).</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    💡 <strong>Adjusting Marks:</strong> Each question card has a <strong>Marks: [ X pt ]</strong> dropdown (1 to 5 pts). Calculation questions (VAT, variance) should typically be 3 to 5 marks to reflect multi-step working.
                  </div>
                </div>
              )}

              {/* TAB 4: PAPER & PEER MARKING */}
              {helpTab === 'paper_assessment' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Phase 3: Paper Assessments & Peer Marking Flow
                    </h3>
                    <p className="text-xs text-slate-600">
                      How to run quick formative paper assessments where learners mark each other&apos;s work against the screen.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Print Clean Assessment Papers</strong>
                        <p className="text-xs text-slate-600">
                          Click <strong>&quot;Print / Export Paper&quot;</strong> in any cluster view. Select <strong>&quot;📝 Printable Paper&quot;</strong> and click <strong>&quot;Print / Save PDF&quot;</strong>. The paper prints cleanly on A4 with NO bureaucratic headers or government clutter.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Learners Complete the Test</strong>
                        <p className="text-xs text-slate-600">
                          Hand the papers to learners. Learners write their names and answer the questions, writing out calculation steps (subtotal, 15% VAT, delivery shortages) in the dotted working lines.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Learners Swap Papers (Peer Check)</strong>
                        <p className="text-xs text-slate-600">
                          When time is up, ask learners to swap papers with their desk partner. The peer writes their name in the <strong>&quot;Peer Reviewer (Checked By)&quot;</strong> block.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#6DC082] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Project Model Answers on the Classroom Screen</strong>
                        <p className="text-xs text-slate-600">
                          In the paper modal, click <strong>&quot;📺 Projector Mode (Model Answers)&quot;</strong> and toggle <strong>Fullscreen</strong>. The projector displays the step-by-step numbers, calculations, and marking rubric in large, crisp text. Learners grade their partner&apos;s paper and write the total score!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LIVE POLLING */}
              {helpTab === 'live_quizzes' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Phase 4: Live Collaborative Polling & Group Deliberation
                    </h3>
                    <p className="text-xs text-slate-600">
                      How to launch live interactive sessions with zero delay or technical friction.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#6DC082] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">1-Click Launch Live</strong>
                        <p className="text-xs text-slate-600">
                          Click the green <strong>Launch Live</strong> button in the top navigation bar. It instantly launches the presenter screen for your selected cluster with zero popups!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Learners Join via QR Code or PIN</strong>
                        <p className="text-xs text-slate-600">
                          Learners scan the big QR code on the projector or go to <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">/play</code> and enter the 6-digit PIN. In Table Group mode, one phone per table enters their table name (e.g. &quot;Receiving Team Alpha&quot;).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#4682B4] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Table Deliberation & Locking In</strong>
                        <p className="text-xs text-slate-600">
                          Start the question. Tables consult their Learner Guides, debate options, and lock in consensus answers. The timer counts down on the main screen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-[#6DC082] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 block text-xs">Reveal Answers & Classroom Debrief</strong>
                        <p className="text-xs text-slate-600">
                          Click <strong>Reveal Answer</strong>. The screen lights up with animated bar charts showing class vote distribution, reveals the correct option in green, and displays the dual <strong>🟢 Model Answer</strong> and <strong>📝 Marking Guidance</strong> for classroom discussion!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: HISTORY & AUDIT */}
              {helpTab === 'history' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Phase 5: Session History, Scores & Audit Export
                    </h3>
                    <p className="text-xs text-slate-600">
                      Where to access past cohort performances and export audit-ready evidence records.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700">
                    <p>
                      <strong>Accessing History:</strong> Click the <strong>Settings (Gear)</strong> icon in the top header and click <strong>&quot;Open History&quot;</strong>, or navigate to <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">/history</code>.
                    </p>
                    <p>
                      <strong>What You Can View:</strong>
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Complete list of past live sessions sorted by date and cohort.</li>
                      <li>Leaderboards showing table team scores and rankings.</li>
                      <li>Question-by-question breakdown showing which questions learners struggled with most.</li>
                      <li>Full audit trail logs suitable for SETA / QCTO quality assurance verification.</li>
                    </ul>
                    <p>
                      <strong>Exporting Data:</strong> Click <strong>&quot;Export Audit CSV&quot;</strong> on any past session to download a detailed spreadsheet of team responses and scores.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                💡 Tip: You can reopen this guide anytime by clicking <strong>&quot;Guide &amp; Help&quot;</strong> in the top header.
              </span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
