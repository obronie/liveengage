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
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ShieldAlert, 
  ArrowRight,
  Plus,
  Play
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
        // Update participant score in leaderboard
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

    // Trigger subtle confetti if high percentage correct
    const currentQ = session.questions?.[session.current_question_index];
    if (currentQ && currentQ.format !== 'WORD_CLOUD') {
      const correctCount = responses.filter(r => r.is_correct).length;
      if (correctCount > 0 && correctCount >= responses.length / 2) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!session || !session.questions) return;
    const nextIdx = session.current_question_index + 1;

    if (nextIdx >= session.questions.length) {
      // Completed!
      const updated: Session = { ...session, status: 'completed' };
      setSession(updated);
      await AppStore.saveSession(updated);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      setShowLeaderboard(true);
      return;
    }

    const nextQ = session.questions[nextIdx];
    const duration = nextQ.duration > 0 ? nextQ.duration : 60;
    const updated: Session = {
      ...session,
      current_question_index: nextIdx,
      status: 'question_active',
      question_timer_end: new Date(Date.now() + duration * 1000).toISOString(),
    };

    setSession(updated);
    setTimeLeft(duration);
    setInitialDuration(duration);
    setIsTimerRunning(nextQ.duration > 0);
    setResponses(AppStore.getResponses(session.id, nextQ.id));
    setHiddenWords(AppStore.getHiddenWords(nextQ.id));
    setShowLeaderboard(false);
    await AppStore.saveSession(updated);
  };

  const handlePrevQuestion = async () => {
    if (!session || !session.questions || session.current_question_index <= 0) return;
    const prevIdx = session.current_question_index - 1;
    const prevQ = session.questions[prevIdx];
    const duration = prevQ.duration > 0 ? prevQ.duration : 60;

    const updated: Session = {
      ...session,
      current_question_index: prevIdx,
      status: 'question_active',
    };

    setSession(updated);
    setTimeLeft(duration);
    setInitialDuration(duration);
    setIsTimerRunning(prevQ.duration > 0);
    setResponses(AppStore.getResponses(session.id, prevQ.id));
    setHiddenWords(AppStore.getHiddenWords(prevQ.id));
    setShowLeaderboard(false);
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

  if (!session) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold">Connecting to Room {roomCode}...</h2>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions?.[session.current_question_index];
  const participantUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/play?room=${roomCode}`
    : `https://poll.learnblended.co.za/play?room=${roomCode}`;

  // Timer Progress Calculation & Color Shifts (Green -> Amber -> Red)
  const timerPercentage = initialDuration > 0 ? (timeLeft / initialDuration) * 100 : 100;
  let timerColorClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  let progressBarClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';

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

  // Ranked Participants
  const rankedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Projector Header Bar */}
      <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            ← Exit to Builder
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Room PIN:</span>
            <span className="text-lg font-mono font-black text-indigo-400 tracking-wider bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
              {roomCode}
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden md:inline">
            • {session.group?.client_name || 'Client'} ({session.group?.group_name || 'Cohort'})
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connected Participants Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              {participants.length} {session.entry_mode === 'group' ? 'Teams' : 'Learners'} Connected
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen Projector Mode"
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
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs sm:text-sm font-semibold uppercase tracking-widest inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Training Session Ready
              </span>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {session.title}
              </h1>

              {session.facilitator_instructions && (
                <p className="text-base sm:text-lg text-indigo-200/80 mt-3 font-medium">
                  {session.facilitator_instructions}
                </p>
              )}

              {/* QR Code and PIN Callout */}
              <div className="mt-10 p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
                <div className="p-4 bg-white rounded-2xl shadow-xl shrink-0">
                  <QRCodeSVG value={participantUrl} size={180} level="M" />
                </div>

                <div className="text-left space-y-3">
                  <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                    Join on Mobile or Tablet
                  </p>
                  <p className="text-base text-slate-300">
                    Scan the QR code or open:
                  </p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    {participantUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <div className="pt-2">
                    <span className="text-xs text-slate-400 block mb-1">Enter 6-digit room PIN:</span>
                    <span className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-indigo-400">
                      {roomCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Teams / Learners Roster */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Connected {session.entry_mode === 'group' ? 'Table Groups' : 'Learners'} ({participants.length}):
                </p>
                {participants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic animate-pulse">
                    Waiting for first participants to join...
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {participants.map((p) => (
                      <span
                        key={p.id}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-300 shadow flex items-center gap-1.5 animate-in fade-in"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {p.display_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Session Trigger */}
              <div className="mt-10">
                <button
                  onClick={handleStartFirstQuestion}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg shadow-2xl shadow-emerald-500/30 flex items-center gap-3 mx-auto transition-transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>Start Live Session</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE / LOCKED / REVEALED QUESTION STATES */}
        {(session.status === 'question_active' || session.status === 'question_locked' || session.status === 'revealed') && currentQuestion && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-150">
            {/* Top Bar: Progress Bar & Timer */}
            <div className="w-full space-y-4">
              {/* Animated Progress Bar */}
              <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${progressBarClass}`}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>

              {/* Question Meta & Massive Timer Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs sm:text-sm">
                    Question {session.current_question_index + 1} of {session.questions?.length || 0}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                    {currentQuestion.format}
                  </span>
                  {currentQuestion.guide_topic_hint && (
                    <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{currentQuestion.guide_topic_hint}</span>
                    </span>
                  )}
                </div>

                {/* Massive Timer Digits */}
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
                      <Lock className="w-3.5 h-3.5" /> Submissions Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Question Stem */}
              <div className="pt-2 pb-4">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  {currentQuestion.body}
                </h2>
              </div>
            </div>

            {/* Answer Display Area: Structured Choices or Word Cloud */}
            <div className="my-auto py-6">
              {currentQuestion.format === 'WORD_CLOUD' ? (
                /* Dynamic Word Cloud View with 1-Click Moderation */
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 min-h-[280px] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
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
                        const colors = ['text-indigo-400', 'text-emerald-400', 'text-teal-300', 'text-purple-400', 'text-amber-300', 'text-sky-400'];
                        const colorClass = colors[word.length % colors.length];

                        return (
                          <button
                            key={word}
                            onClick={() => handleHideWord(word)}
                            className={`font-black hover:opacity-75 transition-transform hover:scale-110 active:scale-95 px-3 py-1 rounded-xl bg-slate-800/50 hover:bg-red-500/20 border border-slate-700/50 hover:border-red-500/40 cursor-pointer ${colorClass}`}
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
                /* Structured Options Cards & Bar Chart Distribution */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    const isCorrect = currentQuestion.correct_options.includes(idx);
                    const isRevealed = session.status === 'revealed';
                    const count = optionCounts[idx] || 0;
                    const totalResponses = responses.length;
                    const percent = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    let cardClasses = 'bg-slate-900/90 border-slate-800 text-slate-200';
                    if (isRevealed) {
                      if (isCorrect) {
                        cardClasses = 'bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.25)]';
                      } else {
                        cardClasses = 'bg-slate-900/40 border-slate-800/50 text-slate-400 opacity-60';
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
                              isCorrect ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isRevealed && isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-300'
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
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
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

              {/* Rationale / Additional Text revealed card */}
              {session.status === 'revealed' && currentQuestion.additional_text && (
                <div className="mt-6 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Curriculum Rationale & Learner Guide Explanation</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                    {currentQuestion.additional_text}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Live Controls Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">
                  Responses: <strong className="text-white font-mono">{responses.length}</strong> / {participants.length}
                </span>

                {/* Extra time */}
                <button
                  onClick={() => handleAddExtraTime(15)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+15s</span>
                </button>

                {/* Lock / Unlock */}
                {session.status === 'question_active' ? (
                  <button
                    onClick={handleLockSubmissions}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Submissions</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnlockSubmissions}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Re-open Submissions</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Leaderboard</span>
                </button>

                {/* Reveal Answer Button */}
                {session.status !== 'revealed' ? (
                  <button
                    onClick={handleRevealAnswers}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Reveal Correct Answer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                  >
                    <span>
                      {session.current_question_index + 1 < (session.questions?.length || 0)
                        ? 'Next Question'
                        : 'Finish & View Podium'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPLETED SESSION STATE */}
        {session.status === 'completed' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              Session Completed!
            </h1>
            <p className="text-base text-slate-400 mt-2 max-w-xl">
              Great work! Scores have been recorded. Results are preserved in the session archive.
            </p>

            {/* Podium Leaderboard */}
            <div className="mt-8 max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Final Leaderboard ({session.entry_mode === 'group' ? 'Group Tables' : 'Participants'})
              </h3>
              <div className="space-y-2.5">
                {rankedParticipants.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                      idx === 0
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : idx === 1
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 font-mono font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm text-white">{p.display_name}</span>
                    </div>
                    <span className="font-mono font-black text-base text-emerald-400">
                      {p.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push('/history')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                View Session Archive
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Create New Session
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Leaderboard Modal / Overlay */}
      {showLeaderboard && session.status !== 'completed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Live Leaderboard</h3>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {rankedParticipants.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No participants scored yet.</p>
              ) : (
                rankedParticipants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-slate-800 font-mono font-bold text-xs flex items-center justify-center text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-white">{p.display_name}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{p.score} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
