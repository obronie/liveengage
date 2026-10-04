'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { AppStore } from '@/lib/store';
import { Session, Question, Participant, ResponseRecord } from '@/types';
import { 
  Users, 
  Clock, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Trophy, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ArrowRight,
  Plus,
  Play,
  UserX,
  Radio,
  Tag
} from 'lucide-react';

export default function PresenterPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [initialDuration, setInitialDuration] = useState<number>(60);

  // Presenter view modes
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showRationale, setShowRationale] = useState<boolean>(true); // Shared Classroom Debrief Card Toggle
  const [showAnsweredDropdown, setShowAnsweredDropdown] = useState<boolean>(false); // Top right answered tracker popover
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Session Data & subscribe to updates
  useEffect(() => {
    if (!roomCode) return;

    const loadSession = async () => {
      const sess = await AppStore.getSessionByRoomCode(roomCode);
      if (sess) {
        setSession(sess);
        const pList = AppStore.getParticipants(sess.id);
        setParticipants(pList);

        const currentQ = sess.questions?.[sess.current_question_index];
        if (currentQ) {
          const rList = AppStore.getResponses(sess.id, currentQ.id);
          setResponses(rList);
          const hw = AppStore.getHiddenWords(currentQ.id);
          setHiddenWords(hw);

          if (sess.status === 'question_active') {
            setTimeLeft(currentQ.duration > 0 ? currentQ.duration : 60);
            setInitialDuration(currentQ.duration > 0 ? currentQ.duration : 60);
            setIsTimerRunning(currentQ.duration > 0);
          }
        }
      }
    };

    loadSession();

    // Reconcile on window focus / visibility change (reconnect if screen was asleep)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Subscribe to live events (BroadcastChannel + Supabase Realtime)
    const unsubscribe = AppStore.subscribeToRoom(roomCode, (event) => {
      if (event.type === 'PARTICIPANT_JOINED') {
        setParticipants((prev) => {
          const exists = prev.some(p => p.id === event.payload.id || p.device_identifier === event.payload.device_identifier);
          if (exists) {
            return prev.map(p => p.id === event.payload.id ? event.payload : p);
          }
          return [...prev, event.payload];
        });
      } else if (event.type === 'RESPONSE_SUBMITTED') {
        setResponses((prev) => {
          const filtered = prev.filter(r => !(r.question_id === event.payload.question_id && r.participant_id === event.payload.participant_id));
          return [...filtered, event.payload];
        });
        setParticipants((prev) =>
          prev.map(p => p.id === event.payload.participant_id
            ? { ...p, score: p.score + (event.payload.points_awarded || 0) }
            : p
          )
        );
      } else if (event.type === 'SESSION_UPDATED') {
        setSession((prev) => ({ ...(prev || {}), ...event.payload }));
      } else if (event.type === 'WORD_HIDDEN') {
        setHiddenWords((prev) => [...prev, event.payload.word.toLowerCase()]);
      }
    });

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode]);

  // Countdown timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            handleAutoLock();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleAutoLock = async () => {
    if (!session) return;
    const updated: Session = { ...session, status: 'question_locked' };
    setSession(updated);
    await AppStore.saveSession(updated);
  };

  const handleStartFirstQuestion = async () => {
    if (!session || !session.questions || session.questions.length === 0) return;
    const firstQ = session.questions[0];
    const duration = firstQ.duration > 0 ? firstQ.duration : 60;

    const updated: Session = {
      ...session,
      status: 'question_active',
      current_question_index: 0,
      question_timer_end: new Date(Date.now() + duration * 1000).toISOString(),
    };
    setSession(updated);
    setTimeLeft(duration);
    setInitialDuration(duration);
    setIsTimerRunning(firstQ.duration > 0);
    setResponses([]);
    setShowRationale(true);
    await AppStore.saveSession(updated);
  };

  const handleLockSubmissions = async () => {
    if (!session) return;
    setIsTimerRunning(false);
    const updated: Session = { ...session, status: 'question_locked' };
    setSession(updated);
    await AppStore.saveSession(updated);
  };

  const handleUnlockSubmissions = async () => {
    if (!session) return;
    const currentQ = session.questions?.[session.current_question_index];
    const duration = currentQ?.duration || 45;
    setTimeLeft(duration);
    setIsTimerRunning(duration > 0);
    const updated: Session = { ...session, status: 'question_active' };
    setSession(updated);
    await AppStore.saveSession(updated);
  };

  const handleAddExtraTime = (seconds: number = 15) => {
    setTimeLeft((prev) => prev + seconds);
    setInitialDuration((prev) => prev + seconds);
    if (!isTimerRunning) setIsTimerRunning(true);
  };

  const handleRevealAnswers = async () => {
    if (!session) return;
    setIsTimerRunning(false);
    const updated: Session = { ...session, status: 'revealed' };
    setSession(updated);
    await AppStore.saveSession(updated);

    const currentQ = session.questions?.[session.current_question_index];
    if (currentQ && currentQ.format !== 'WORD_CLOUD') {
      const correctCount = responses.filter(r => r.is_correct).length;
      if (correctCount > 0 && correctCount >= responses.length / 2) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4682B4', '#6DC082', '#D5E3EF', '#ffffff']
        });
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!session || !session.questions) return;
    const nextIdx = session.current_question_index + 1;

    if (nextIdx >= session.questions.length) {
      const updated: Session = { 
        ...session, 
        status: 'completed',
        completed_at: session.completed_at || new Date().toISOString()
      };
      setSession(updated);
      await AppStore.saveSession(updated);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#4682B4', '#6DC082', '#ffffff'] });
      setShowLeaderboard(true);
      return;
    }

    const nextQ = session.questions[nextIdx];
    const isPostSessionReview = !!session.completed_at;
    const duration = nextQ.duration > 0 ? nextQ.duration : 60;

    const updated: Session = {
      ...session,
      current_question_index: nextIdx,
      status: isPostSessionReview ? 'question_locked' : 'question_active',
      question_timer_end: isPostSessionReview ? undefined : new Date(Date.now() + duration * 1000).toISOString(),
    };

    setSession(updated);
    setTimeLeft(isPostSessionReview ? 0 : duration);
    setInitialDuration(duration);
    setIsTimerRunning(!isPostSessionReview && nextQ.duration > 0);
    setResponses(AppStore.getResponses(session.id, nextQ.id));
    setHiddenWords(AppStore.getHiddenWords(nextQ.id));
    setShowLeaderboard(false);
    setShowRationale(true);
    await AppStore.saveSession(updated);
  };

  const handlePrevQuestion = async () => {
    if (!session || !session.questions || session.current_question_index <= 0) return;
    const prevIdx = session.current_question_index - 1;
    const prevQ = session.questions[prevIdx];
    const isPostSessionReview = !!session.completed_at;
    const duration = prevQ.duration > 0 ? prevQ.duration : 60;

    const updated: Session = {
      ...session,
      current_question_index: prevIdx,
      status: isPostSessionReview ? 'question_locked' : 'question_active',
      question_timer_end: isPostSessionReview ? undefined : new Date(Date.now() + duration * 1000).toISOString(),
    };

    setSession(updated);
    setTimeLeft(isPostSessionReview ? 0 : duration);
    setInitialDuration(duration);
    setIsTimerRunning(!isPostSessionReview && prevQ.duration > 0);
    setResponses(AppStore.getResponses(session.id, prevQ.id));
    setHiddenWords(AppStore.getHiddenWords(prevQ.id));
    setShowLeaderboard(false);
    setShowRationale(true);
    await AppStore.saveSession(updated);
  };

  // Jump to Beginning (Question 1) to review questions together with answers hidden until Reveal is clicked
  const handleJumpToBeginningReview = async () => {
    if (!session || !session.questions || session.questions.length === 0) return;
    const firstQ = session.questions[0];

    const updated: Session = {
      ...session,
      current_question_index: 0,
      status: 'question_locked', // Locked so answers remain hidden until facilitator clicks Reveal Results
      question_timer_end: undefined,
    };

    setSession(updated);
    setIsTimerRunning(false);
    setTimeLeft(0);
    setResponses(AppStore.getResponses(session.id, firstQ.id));
    setHiddenWords(AppStore.getHiddenWords(firstQ.id));
    setShowLeaderboard(false);
    setShowRationale(true);
    await AppStore.saveSession(updated);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleHideWord = async (word: string) => {
    if (!session || !currentQuestion) return;
    await AppStore.hideWord(currentQuestion.id, session.room_code, word);
    setHiddenWords((prev) => [...prev, word.toLowerCase()]);
  };

  // Kick / Reset accidental table device registration in lobby
  const handleKickParticipant = (participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  // Global Keyboard Shortcuts for Presenter (clicker & key navigation friendly)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        setShowLeaderboard(false);
        setShowAnsweredDropdown(false);
        return;
      }

      if (session?.status === 'lobby') {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'F5' || e.key === 'PageDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleStartFirstQuestion();
        }
        return;
      }

      // Next Question: 'n', ArrowRight, or clicker Forward (PageDown)
      if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextQuestion();
      } 
      // Previous Question: 'p', ArrowLeft, or clicker Backward (PageUp)
      else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevQuestion();
      } 
      // Reveal Results: 'r', or clicker Blank/Black button ('b' or '.')
      else if (e.key === 'r' || e.key === 'R' || e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        if (session?.status !== 'revealed') {
          handleRevealAnswers();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (session?.status === 'question_active') {
          handleLockSubmissions();
        } else {
          handleUnlockSubmissions();
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowLeaderboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, isTimerRunning]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4682B4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold">Connecting to Room {roomCode}...</h2>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions?.[session.current_question_index];
  const participantUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/play?room=${roomCode}`
    : `https://poll.learnblended.co.za/play?room=${roomCode}`;

  // Timer Progress Calculation & Color Shifts (Emerald Green -> Amber -> Red)
  const timerPercentage = initialDuration > 0 ? (timeLeft / initialDuration) * 100 : 100;
  let timerColorClass = 'text-[#6DC082] border-[#6DC082]/40 bg-[#6DC082]/10';
  let progressBarClass = 'bg-[#6DC082] shadow-[0_0_15px_rgba(109,192,130,0.5)]';

  if (timerPercentage <= 25) {
    timerColorClass = 'text-red-400 border-red-500/40 bg-red-500/15 timer-critical';
    progressBarClass = 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]';
  } else if (timerPercentage <= 50) {
    timerColorClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    progressBarClass = 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]';
  }

  // Word Cloud Aggregation with Normalization
  const wordFrequencies: { [key: string]: number } = {};
  if (currentQuestion?.format === 'WORD_CLOUD') {
    responses.forEach(r => {
      const text = typeof r.selected_options === 'string' ? r.selected_options : '';
      if (!text) return;
      const normalized = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      if (normalized && !hiddenWords.includes(normalized)) {
        wordFrequencies[normalized] = (wordFrequencies[normalized] || 0) + 1;
      }
    });
  }

  // Bar Chart Distribution Calculation
  const optionCounts: number[] = currentQuestion ? new Array(currentQuestion.options.length).fill(0) : [];
  if (currentQuestion && currentQuestion.format !== 'WORD_CLOUD') {
    responses.forEach(r => {
      const selected = Array.isArray(r.selected_options) ? r.selected_options : [];
      selected.forEach(idx => {
        if (typeof idx === 'number' && idx < optionCounts.length) {
          optionCounts[idx]++;
        }
      });
    });
  }

  const rankedParticipants = [...participants].sort((a, b) => b.score - a.score);

  // Live Answered vs Pending status tracking
  const answeredParticipantIds = new Set(responses.map(r => r.participant_id));
  const answeredParticipants = participants.filter(p => answeredParticipantIds.has(p.id));
  const pendingParticipants = participants.filter(p => !answeredParticipantIds.has(p.id));

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Projector Header Bar */}
      <header className="h-16 px-6 sm:px-8 border-b border-[#1e2e4a] bg-[#121b2d]/90 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#0a0f1d] border border-[#1e2e4a] transition-colors"
          >
            ← Exit
          </button>
          <div className="h-4 w-[1px] bg-[#1e2e4a]" />
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Room PIN:</span>
            <span className="text-xl font-mono font-black text-[#4682B4] tracking-widest bg-[#4682B4]/15 px-3 py-0.5 rounded-xl border border-[#4682B4]/30 shadow-inner">
              {roomCode.slice(0, 3)} {roomCode.slice(3)}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>•</span>
            <span className="text-white font-semibold">{session.client_name || 'Client'}</span>
            <span>(Cohort {session.cohort_number || 1})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Answered Status Tracker on Top Right */}
          {session.status !== 'lobby' && (
            <div className="relative">
              <button
                onClick={() => setShowAnsweredDropdown(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a0f1d] hover:bg-slate-800 border border-[#1e2e4a] text-xs font-semibold transition-colors"
                title="Click to see who has answered vs pending"
              >
                <CheckCircle2 className="w-4 h-4 text-[#6DC082]" />
                <span>
                  Answered: <strong className="text-white font-mono">{answeredParticipants.length}</strong> / {participants.length}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAnsweredDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover showing Answered vs Pending */}
              {showAnsweredDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#121b2d] border border-[#1e2e4a] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2e4a]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Submission Tracker
                    </span>
                    <span className="text-xs font-mono font-bold text-[#6DC082]">
                      {answeredParticipants.length}/{participants.length} Answered
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {/* Answered List */}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6DC082] mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Answered ({answeredParticipants.length})
                      </div>
                      {answeredParticipants.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic pl-1">Awaiting first answer...</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {answeredParticipants.map(p => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                            >
                              ✓ {p.display_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending List */}
                    {pendingParticipants.length > 0 && (
                      <div className="pt-2 border-t border-[#1e2e4a]/60">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Waiting ({pendingParticipants.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pendingParticipants.map(p => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-medium"
                            >
                              ⏳ {p.display_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connected Participants Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a0f1d] border border-[#1e2e4a] text-xs font-semibold text-slate-300">
            <Users className="w-4 h-4 text-[#6DC082]" />
            <span>
              {participants.length} {session.entry_mode === 'group' ? 'Teams' : 'Learners'} Connected
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen Projector View"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Surface */}
      <main className="flex-1 flex flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full justify-between overflow-y-auto">
        {/* LOBBY STATE */}
        {session.status === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-3xl w-full">
              <span className="px-4 py-1.5 rounded-full bg-[#4682B4]/15 border border-[#4682B4]/30 text-[#4682B4] text-xs sm:text-sm font-semibold uppercase tracking-widest inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#6DC082]" />
                Live Training Session Ready
              </span>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {session.title}
              </h1>

              {session.facilitator_instructions && (
                <p className="text-base sm:text-lg text-slate-300 mt-3 font-medium max-w-2xl mx-auto">
                  {session.facilitator_instructions}
                </p>
              )}

              {/* High-Impact QR Code & PIN Center Stage */}
              <div className="my-8 p-6 sm:p-8 rounded-3xl bg-[#121b2d] border border-[#1e2e4a] shadow-2xl inline-flex flex-col sm:flex-row items-center gap-8 text-left">
                <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
                  <QRCodeSVG value={participantUrl} size={180} level="M" />
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Scan QR or Join via Mobile:
                  </div>
                  <div className="text-sm font-mono text-slate-300 break-all">
                    {participantUrl}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Enter Room PIN:</span>
                    <span className="text-4xl sm:text-5xl font-mono font-black text-[#4682B4] tracking-widest">
                      {roomCode.slice(0, 3)} {roomCode.slice(3)}
                    </span>
                  </div>
                  <div className="text-xs text-[#6DC082] font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Mode: {session.entry_mode === 'group' ? 'Group Competition (Table Consensus)' : 'Individual Fast Poll'}</span>
                  </div>
                </div>
              </div>

              {/* Connected Participant Pills with Kick control */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Connected {session.entry_mode === 'group' ? 'Table Teams' : 'Learners'} ({participants.length}):
                </h3>
                {participants.length === 0 ? (
                  <p className="text-slate-500 italic text-sm animate-pulse">
                    Waiting for participants to scan QR code or enter PIN...
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="px-3.5 py-1.5 rounded-full bg-[#121b2d] border border-[#1e2e4a] text-xs font-bold text-slate-200 shadow-xs flex items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#6DC082] animate-pulse" />
                        <span>{p.display_name}</span>
                        <button
                          onClick={() => handleKickParticipant(p.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity ml-1"
                          title="Reset / Kick this device if wrong table name"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Session Trigger */}
              <div>
                <button
                  onClick={handleStartFirstQuestion}
                  disabled={!session.questions || session.questions.length === 0}
                  className="px-8 py-4 rounded-2xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-[#4682B4]/25 transition-all flex items-center gap-3 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Live Question 1</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE / LOCKED / REVEALED QUESTION STATE */}
        {session.status !== 'lobby' && currentQuestion && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
            {/* Top Row: Progress Bar & Timer */}
            <div className="space-y-4">
              {/* Dynamic Smooth Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-[#1e2e4a]">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${progressBarClass}`}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-[#4682B4]/15 border border-[#4682B4]/30 text-[#4682B4] text-xs font-bold uppercase tracking-wider">
                    Question {session.current_question_index + 1} of {session.questions?.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {currentQuestion.format === 'MCQ' && 'Single Choice'}
                    {currentQuestion.format === 'MULTIPLE' && 'Multiple Choice (Select all)'}
                    {currentQuestion.format === 'BINARY' && 'True / False'}
                    {currentQuestion.format === 'SCALE' && 'Scale 1-5'}
                    {currentQuestion.format === 'WORD_CLOUD' && 'Word Cloud Response'}
                  </span>
                  {currentQuestion.guide_topic_hint && (
                    <span className="text-xs text-[#6DC082] hidden md:inline font-medium">
                      • {currentQuestion.guide_topic_hint}
                    </span>
                  )}
                </div>

                {/* Massive Digital Timer */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-6 py-2 rounded-2xl border font-mono font-black text-2xl sm:text-3xl flex items-center gap-2 shadow-lg transition-colors ${timerColorClass}`}
                  >
                    <Clock className="w-6 h-6 animate-pulse" />
                    <span>
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                      {(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {session.status === 'question_locked' && (
                    <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Question Stem */}
              <div className="pt-2 pb-2">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  {currentQuestion.body}
                </h2>
              </div>

              {/* Live Participant Turn-In Status Strip */}
              {participants.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Live Turn-in:
                  </span>
                  {participants.map(p => {
                    const hasAnswered = answeredParticipantIds.has(p.id);
                    return (
                      <span
                        key={p.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          hasAnswered
                            ? 'bg-[#6DC082]/20 text-[#6DC082] border border-[#6DC082]/40 shadow-sm shadow-[#6DC082]/20'
                            : 'bg-slate-900/80 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {hasAnswered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#6DC082]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                        )}
                        <span>{p.display_name}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Answer Display Area: Structured Choices or Word Cloud */}
            <div className="my-auto py-6">
              {currentQuestion.format === 'WORD_CLOUD' ? (
                /* Dynamic Word Cloud View with 1-Click Moderation */
                <div className="p-8 rounded-3xl bg-[#121b2d] border border-[#1e2e4a] min-h-[280px] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
                    <MessageSquare className="w-4 h-4 text-[#4682B4]" />
                    <span>Word Cloud Submissions ({responses.length} responses) • Click any word to hide inappropriate submissions</span>
                  </div>

                  {Object.keys(wordFrequencies).length === 0 ? (
                    <p className="text-slate-500 italic text-sm animate-pulse">
                      Awaiting participant submissions on mobile screens...
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl">
                      {Object.entries(wordFrequencies).map(([word, count]) => {
                        const fontSize = Math.min(18 + count * 10, 60);
                        const colors = ['text-[#4682B4]', 'text-[#6DC082]', 'text-teal-300', 'text-sky-300', 'text-amber-300'];
                        const colorClass = colors[word.length % colors.length];

                        return (
                          <button
                            key={word}
                            onClick={() => handleHideWord(word)}
                            className={`font-black hover:opacity-75 transition-transform hover:scale-110 active:scale-95 px-3 py-1 rounded-xl bg-[#0a0f1d] hover:bg-red-500/20 border border-[#1e2e4a] hover:border-red-500/40 cursor-pointer ${colorClass}`}
                            style={{ fontSize: `${fontSize}px` }}
                            title="Click to Hide/Moderate word"
                          >
                            {word}
                            <span className="text-xs font-normal text-slate-400 ml-1.5 opacity-70">
                              ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Structured Options Cards & Bar Chart Distribution in LearnBlended Styling */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    const isCorrect = currentQuestion.correct_options.includes(idx);
                    const isRevealed = session.status === 'revealed';
                    const count = optionCounts[idx] || 0;
                    const totalResponses = responses.length;
                    const percent = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    let cardClasses = 'bg-[#121b2d] border-[#1e2e4a] text-slate-200';
                    if (isRevealed) {
                      if (isCorrect) {
                        cardClasses = 'bg-[#6DC082]/20 border-[#6DC082] text-white shadow-[0_0_25px_rgba(109,192,130,0.3)]';
                      } else {
                        cardClasses = 'bg-[#121b2d]/50 border-[#1e2e4a]/60 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[96px] ${cardClasses}`}
                      >
                        {/* Animated background bar in revealed state */}
                        {isRevealed && (
                          <div
                            className={`absolute inset-0 h-full opacity-20 pointer-events-none transition-all duration-1000 ${
                              isCorrect ? 'bg-[#6DC082]' : 'bg-slate-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                isRevealed && isCorrect
                                  ? 'bg-[#6DC082] text-white'
                                  : 'bg-[#0a0f1d] text-[#4682B4] border border-[#1e2e4a]'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-base sm:text-lg font-bold leading-snug">
                              {opt}
                            </span>
                          </div>

                          {isRevealed && (
                            <div className="shrink-0 flex items-center gap-1.5 font-mono text-sm font-bold">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-[#6DC082]" />
                              ) : (
                                <XCircle className="w-5 h-5 text-slate-500" />
                              )}
                              <span>{percent}%</span>
                              <span className="text-xs text-slate-400">({count})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Shared Classroom Debrief Card (Workplace Rationale & Common Misconceptions) */}
              {session.status === 'revealed' && currentQuestion.additional_text && showRationale && (() => {
                const text = currentQuestion.additional_text;
                const hasModelAnswer = text.includes('Model Answer') || text.includes('🟢');
                const hasAssessorNotes = text.includes('Assessor Marks') || text.includes('📝');

                if (hasModelAnswer && hasAssessorNotes) {
                  const parts = text.split(/(?=📝|How the Assessor Marks This)/i);
                  const modelPart = parts[0]?.replace(/^🟢\s*Model Answer:\s*/i, '').trim();
                  const assessorPart = parts[1]?.replace(/^(📝\s*)?(How the Assessor Marks This:\s*)?/i, '').trim();

                  return (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                      {/* Model Answer Card */}
                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>🟢 The Model Answer (Calculations & Steps)</span>
                          </div>
                          <span className="text-[10px] text-emerald-300/70 font-semibold uppercase">Exam Benchmark</span>
                        </div>
                        <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed whitespace-pre-line font-mono">
                          {modelPart}
                        </p>
                      </div>

                      {/* Assessor Marking Guidance Card */}
                      {assessorPart && (
                        <div className="p-4 rounded-2xl bg-[#4682B4]/15 border border-[#4682B4]/40 shadow-lg">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 text-sky-300 text-xs font-extrabold uppercase tracking-wider">
                              <BookOpen className="w-4 h-4 text-sky-400" />
                              <span>📝 How the Assessor Marks This (Points & Traps)</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Classroom Debrief Guide</span>
                          </div>
                          <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                            {assessorPart}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="mt-6 p-5 rounded-2xl bg-[#4682B4]/15 border border-[#4682B4]/40 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-[#6DC082] text-xs font-bold uppercase tracking-wider">
                        <BookOpen className="w-4 h-4 text-[#6DC082]" />
                        <span>Workplace Rationale & Assessor Debrief</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Classroom Discussion Prompt</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {text}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Live Controls Bar */}
            <div className="pt-4 border-t border-[#1e2e4a] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  Submissions: <strong className="text-white font-mono">{responses.length}</strong> / {participants.length}
                </span>

                {/* Extra time */}
                <button
                  onClick={() => handleAddExtraTime(15)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121b2d] hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-[#1e2e4a] flex items-center gap-1 transition-colors"
                  title="Add 15 seconds to question countdown"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+15s</span>
                </button>

                {/* Lock / Unlock */}
                {session.status === 'question_active' ? (
                  <button
                    onClick={handleLockSubmissions}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock [L]</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnlockSubmissions}
                    className="px-2.5 py-1.5 rounded-lg bg-[#121b2d] hover:bg-slate-800 text-slate-300 border border-[#1e2e4a] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Re-open</span>
                  </button>
                )}

                {/* Jump to Beginning (Q1) Review Button */}
                <button
                  onClick={handleJumpToBeginningReview}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121b2d] hover:bg-slate-800 text-xs font-semibold text-sky-400 border border-[#1e2e4a] flex items-center gap-1.5 transition-colors"
                  title="Jump directly to Question 1 with answers hidden for cohort review"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Q1</span>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Previous Question [P] */}
                <button
                  onClick={handlePrevQuestion}
                  disabled={session.current_question_index <= 0}
                  className="px-3 py-2 rounded-xl bg-[#121b2d] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#121b2d] text-slate-300 font-semibold text-xs border border-[#1e2e4a] flex items-center gap-1.5 transition-colors"
                  title="Previous Question [P]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev [P]</span>
                </button>

                {/* 1-Click Show / Hide Rationale on Projector Screen */}
                {session.status === 'revealed' && currentQuestion.additional_text && (
                  <button
                    onClick={() => setShowRationale(!showRationale)}
                    className="px-3 py-1.5 rounded-lg bg-[#121b2d] hover:bg-slate-800 text-slate-300 border border-[#1e2e4a] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Toggle Classroom Rationale Card on Projector"
                  >
                    {showRationale ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showRationale ? 'Hide Rationale' : 'Show Rationale'}</span>
                  </button>
                )}

                {/* Scores Standings */}
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-3.5 py-2 rounded-xl bg-[#121b2d] hover:bg-slate-800 text-amber-400 font-semibold text-xs border border-[#1e2e4a] flex items-center gap-1.5 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Scores [S]</span>
                </button>

                {/* Reveal Answer Button */}
                {session.status !== 'revealed' ? (
                  <button
                    onClick={handleRevealAnswers}
                    className="px-4 sm:px-5 py-2 rounded-xl bg-[#6DC082] hover:bg-[#5cb372] text-white font-bold text-xs shadow-lg shadow-[#6DC082]/30 flex items-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Reveal Results [R]</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Revealed</span>
                  </span>
                )}

                {/* Always-on Next Question [N] Button */}
                <button
                  onClick={handleNextQuestion}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-bold text-xs shadow-lg shadow-[#4682B4]/30 flex items-center gap-2 transition-all"
                  title="Next Question [N] (available at all times)"
                >
                  <span>
                    {session.current_question_index + 1 >= (session.questions?.length || 0)
                      ? 'Finish Session'
                      : 'Next Question [N]'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {session.status === 'completed' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl sm:text-5xl font-black text-white">Session Completed!</h1>
            <p className="text-slate-400 mt-2">
              Results and submission timestamps have been automatically archived.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleJumpToBeginningReview}
                className="px-6 py-3 rounded-xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#4682B4]/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Review from Beginning (Q1)</span>
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                <Trophy className="w-4 h-4" />
                <span>View Final Leaderboard</span>
              </button>
              <button
                onClick={() => router.push('/history')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
              >
                Go to Session Archive
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121b2d] border border-[#1e2e4a] rounded-3xl max-w-xl w-full shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2e4a]">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black text-white">Leaderboard Standings</h3>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close [Esc]
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {rankedParticipants.length === 0 ? (
                <p className="text-slate-500 italic text-center py-8">
                  No responses recorded yet.
                </p>
              ) : (
                rankedParticipants.map((p, index) => {
                  let rankBadge = `${index + 1}`;
                  let rankBg = 'bg-slate-800 text-slate-300';
                  if (index === 0) {
                    rankBadge = '🥇';
                    rankBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                  } else if (index === 1) {
                    rankBadge = '🥈';
                    rankBg = 'bg-slate-400/20 text-slate-200 border border-slate-400/40';
                  } else if (index === 2) {
                    rankBadge = '🥉';
                    rankBg = 'bg-amber-700/20 text-amber-600 border border-amber-700/40';
                  }

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-[#0a0f1d] border border-[#1e2e4a] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${rankBg}`}>
                          {rankBadge}
                        </span>
                        <span className="font-bold text-slate-100 text-sm sm:text-base">
                          {p.display_name}
                        </span>
                      </div>
                      <span className="font-mono font-black text-lg text-[#6DC082]">
                        {p.score} pts
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
