'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppStore } from '@/lib/store';
import { Session, Question, Participant, ResponseRecord } from '@/types';
import { 
  Radio, 
  Users, 
  User, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Send, 
  Trophy, 
  AlertCircle,
  HelpCircle,
  Tag
} from 'lucide-react';

function ParticipantPlayContent() {
  const searchParams = useSearchParams();
  const roomQuery = searchParams.get('room');

  // Stages: 'pin' | 'identity' | 'waiting' | 'active' | 'revealed' | 'completed'
  const [stage, setStage] = useState<'pin' | 'identity' | 'waiting' | 'active' | 'revealed' | 'completed'>('pin');

  // Session & Participant state
  const [pin, setPin] = useState(roomQuery || '');
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active question interaction
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [wordSubmission, setWordSubmission] = useState<string>('');
  const [justSubmittedFeedback, setJustSubmittedFeedback] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<ResponseRecord | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Initialize client UUID for reconnection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedUuid = localStorage.getItem('liveengage_device_id');
      if (!storedUuid) {
        storedUuid = 'dev-' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('liveengage_device_id', storedUuid);
      }
      setDeviceIdentifier(storedUuid);

      if (roomQuery) {
        setPin(roomQuery);
        lookupRoom(roomQuery);
      }
    }
  }, [roomQuery]);

  // Reconnection Engine: Re-sync state on mobile wake-up / tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.room_code) {
        lookupRoom(session.room_code);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session?.room_code]);

  // Lookup Room by PIN
  const lookupRoom = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) return;

    setErrorMessage(null);
    const foundSession = await AppStore.getSessionByRoomCode(clean);
    if (!foundSession) {
      setErrorMessage(`Room PIN ${clean} not found. Please check with facilitator.`);
      return;
    }

    setSession(foundSession);

    // Identity Gate Rule:
    // Group Mode: MUST prompt for team name every session. Never assume device identity from prior sessions!
    // Individual Mode: Remembers name locally with one-tap switch.
    if (foundSession.entry_mode === 'group') {
      setDisplayName('');
      setStage('identity');
    } else {
      const remembered = typeof window !== 'undefined' ? localStorage.getItem('liveengage_individual_name') || '' : '';
      if (remembered) {
        setDisplayName(remembered);
      }
      setStage('identity');
    }
  };

  const handleJoinSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim() || !session) return;

    if (session.entry_mode === 'individual' && typeof window !== 'undefined') {
      localStorage.setItem('liveengage_individual_name', displayName.trim());
    }

    const p = await AppStore.joinSession(
      session.id,
      session.room_code,
      displayName.trim(),
      deviceIdentifier
    );
    setParticipant(p);

    // Determine initial stage based on session status
    if (session.status === 'lobby') {
      setStage('waiting');
    } else if (session.status === 'question_active' || session.status === 'question_locked') {
      setStage('active');
    } else if (session.status === 'revealed') {
      setStage('revealed');
    } else if (session.status === 'completed') {
      setStage('completed');
    }
  };

  // Subscribe to room events (BroadcastChannel + Supabase Realtime)
  useEffect(() => {
    if (!session?.room_code) return;

    const unsubscribe = AppStore.subscribeToRoom(session.room_code, (event) => {
      if (event.type === 'SESSION_UPDATED') {
        const updatedSess = event.payload as Session;
        setSession((prev) => ({ ...(prev || {}), ...updatedSess }));

        if (updatedSess.status === 'lobby') {
          setStage('waiting');
        } else if (updatedSess.status === 'question_active') {
          setStage('active');
          setJustSubmittedFeedback(false);
        } else if (updatedSess.status === 'question_locked') {
          // Keep active view but disable choices
        } else if (updatedSess.status === 'revealed') {
          setStage('revealed');
        } else if (updatedSess.status === 'completed') {
          setStage('completed');
          // Clear temporary group cache so shared tablets are fresh
          if (updatedSess.entry_mode === 'group' && typeof window !== 'undefined') {
            localStorage.removeItem('liveengage_group_table');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [session?.room_code]);

  // Synchronized countdown timer based on server question_timer_end
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === 'question_active' && session.question_timer_end) {
      interval = setInterval(() => {
        const diffMs = new Date(session.question_timer_end!).getTime() - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));
        setTimeLeft(secondsRemaining);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status, session?.question_timer_end]);

  const activeQIndex = session?.current_question_index ?? 0;
  const currentQ = session?.questions?.[activeQIndex];

  // Reset selections when question changes
  useEffect(() => {
    if (session && session.questions) {
      const q = session.questions[activeQIndex];
      if (q) {
        setSelectedChoices([]);
        setWordSubmission('');
        setJustSubmittedFeedback(false);

        if (participant) {
          const existing = AppStore.getResponses(session.id, q.id).find(
            r => r.participant_id === participant.id
          );
          if (existing) {
            if (Array.isArray(existing.selected_options)) {
              setSelectedChoices(existing.selected_options);
            } else if (typeof existing.selected_options === 'string') {
              setWordSubmission(existing.selected_options);
            }
            setCurrentResponse(existing);
          }
        }
      }
    }
  }, [activeQIndex, session?.id, participant?.id]);

  // Handle Option Selection (Blind Review: can freely toggle/change until locked)
  const handleSelectOption = async (optionIndex: number) => {
    if (!session || !currentQ || !participant) return;
    if (session.status === 'question_locked' || session.status === 'revealed' || session.status === 'completed') {
      return;
    }

    let updatedSelection: number[];
    if (currentQ.format === 'MCQ' || currentQ.format === 'BINARY' || currentQ.format === 'SCALE') {
      updatedSelection = [optionIndex];
    } else {
      // MULTIPLE choice
      if (selectedChoices.includes(optionIndex)) {
        updatedSelection = selectedChoices.filter(i => i !== optionIndex);
      } else {
        updatedSelection = [...selectedChoices, optionIndex];
      }
    }

    setSelectedChoices(updatedSelection);
    setJustSubmittedFeedback(true);

    const elapsed = currentQ.duration > 0 ? Math.max(0, currentQ.duration - timeLeft) : 0;
    const resp = await AppStore.submitResponse(
      session,
      currentQ,
      participant,
      updatedSelection,
      elapsed
    );
    setCurrentResponse(resp);
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !currentQ || !participant || !wordSubmission.trim()) return;
    if (session.status === 'question_locked' || session.status === 'revealed') return;

    setJustSubmittedFeedback(true);
    const resp = await AppStore.submitResponse(
      session,
      currentQ,
      participant,
      wordSubmission.trim(),
      0
    );
    setCurrentResponse(resp);
  };

  return (
    <div className="min-h-screen bg-[#F1F9F3] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Top Mobile Bar in LearnBlended Palette */}
      <header className="h-14 px-4 bg-white border-b border-[#D5E3EF] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4682B4] flex items-center justify-center text-white shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">LearnBlended Poll</span>
        </div>

        {session && participant && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#4682B4] border border-slate-200">
              PIN: {session.room_code}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6DC082]/15 border border-[#6DC082]/30 text-xs font-bold text-[#2e7d32]">
              {session.entry_mode === 'group' ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[110px]">{participant.display_name}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[110px]">{participant.display_name}</span>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Mobile Screen */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-md w-full mx-auto justify-center">
        
        {/* STAGE 1: PIN ENTRY */}
        {stage === 'pin' && (
          <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-[#4682B4]/10 border border-[#4682B4]/20 flex items-center justify-center text-[#4682B4] mx-auto mb-4 shadow-xs">
                <Radio className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-800">Join Live Session</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit room PIN displayed on the classroom screen
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupRoom(pin);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-black tracking-widest px-4 py-3.5 rounded-2xl bg-white border-2 border-[#4682B4]/40 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#4682B4] shadow-sm"
              />

              {errorMessage && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={pin.trim().length !== 6}
                className="w-full py-3.5 rounded-xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-bold text-sm shadow-md shadow-[#4682B4]/20 disabled:opacity-50 transition-all min-h-[48px]"
              >
                Continue to Session
              </button>
            </form>
          </div>
        )}

        {/* STAGE 2: STRICT IDENTITY GATE (Individual vs Group) */}
        {stage === 'identity' && session && (
          <div className="my-auto space-y-6 animate-in fade-in duration-150">
            <div className="text-center">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#4682B4]/15 text-[#4682B4] border border-[#4682B4]/30">
                ROOM PIN: {session.room_code}
              </span>
              <h1 className="text-xl font-bold text-slate-800 mt-2">{session.title}</h1>
              <p className="text-xs text-slate-500 mt-1">
                {session.client_name} • Cohort {session.cohort_number}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#D5E3EF] shadow-sm space-y-4">
              {session.entry_mode === 'group' ? (
                /* Group Mode: Prompt for Table Number or Team Name */
                <div>
                  <div className="flex items-center gap-2 text-[#4682B4] text-xs font-bold uppercase tracking-wider mb-1">
                    <Users className="w-4 h-4" />
                    <span>Table Team Identity</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Tap your Table Number (1–10) or type your team name:
                  </p>
                  
                  {/* Quick Table Buttons 1 to 10 */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = displayName === `Table ${num}` || displayName === `Group ${num}`;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setDisplayName(`Table ${num}`)}
                          className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                            isSelected
                              ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#4682B4]'
                          }`}
                        >
                          T{num}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Table 1 or The Titans"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4] font-semibold"
                  />
                  <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Always prompted fresh — shared tablet identity is never assumed.</span>
                  </p>
                </div>
              ) : (
                /* Individual Mode */
                <div>
                  <div className="flex items-center gap-2 text-[#4682B4] text-xs font-bold uppercase tracking-wider mb-1">
                    <User className="w-4 h-4" />
                    <span>Individual Learner</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Enter your Name and Surname:
                  </p>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sipho Dlamini"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4] font-semibold min-h-[48px]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleJoinSession()}
                disabled={!displayName.trim()}
                className="w-full py-3.5 rounded-xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-bold text-sm shadow-md shadow-[#4682B4]/20 disabled:opacity-50 transition-all min-h-[48px]"
              >
                Join Live Room
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: WAITING ROOM */}
        {stage === 'waiting' && session && (
          <div className="my-auto space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-3xl bg-[#4682B4]/10 border border-[#4682B4]/20 flex items-center justify-center text-[#4682B4] mx-auto relative shadow-xs">
              <Sparkles className="w-10 h-10 animate-pulse text-[#6DC082]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6DC082] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#6DC082]" />
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#2e7d32] uppercase tracking-widest">
                Connected & Ready
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                {session.title}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                {session.client_name} • Cohort {session.cohort_number}
              </p>
            </div>

            {session.facilitator_instructions && (
              <div className="p-4 rounded-2xl bg-white border border-[#D5E3EF] text-xs text-slate-700 leading-relaxed font-medium shadow-xs">
                &ldquo;{session.facilitator_instructions}&rdquo;
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#D5E3EF]/40 border border-[#D5E3EF] text-xs text-slate-700 text-left">
              <span className="text-[#4682B4] font-bold">📖 Facilitation Tip: </span>
              Have your physical or digital Learner Guide open! Questions are structured to reward authentic navigation of SOP headings.
            </div>

            <p className="text-xs text-slate-400 italic animate-pulse">
              Waiting for facilitator to start the active question...
            </p>
          </div>
        )}

        {/* STAGE 4: ACTIVE QUESTION (Blind Review Answering State) */}
        {stage === 'active' && session && currentQ && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-4 animate-in fade-in duration-150">
            {/* Top Learner Guide Prompt Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#4682B4]/10 to-[#6DC082]/10 border border-[#4682B4]/30 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1e3a5f]">
                <BookOpen className="w-4 h-4 text-[#4682B4] shrink-0" />
                <span>📖 Look inside your Learner Guide for this answer!</span>
              </div>
            </div>

            {/* Group Deliberation Cue */}
            {session.entry_mode === 'group' && (
              <div className="text-[11px] font-semibold text-[#2e7d32] bg-[#6DC082]/10 p-2 rounded-lg border border-[#6DC082]/20 text-center">
                👥 Table Rule: Discuss and reach consensus before selecting your final answer!
              </div>
            )}

            {/* Question Stem */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Question {activeQIndex + 1} of {session.questions?.length}</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                  {currentQ.format}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                {currentQ.body}
              </h2>
            </div>

            {/* Options Choices / Word Cloud Input with Particify Tactile Buttons */}
            <div className="my-auto space-y-2.5">
              {currentQ.format === 'WORD_CLOUD' ? (
                <form onSubmit={handleWordSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={wordSubmission}
                    onChange={(e) => setWordSubmission(e.target.value)}
                    placeholder="Enter your key word or term..."
                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#4682B4] min-h-[48px] shadow-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#4682B4] hover:bg-[#3b6f9a] text-white font-bold text-sm shadow-md shadow-[#4682B4]/20 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit to Word Cloud</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedChoices.includes(idx);
                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        disabled={session.status === 'question_locked'}
                        className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[56px] ${
                          isSelected
                            ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-md ring-2 ring-[#4682B4]/30'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white text-[#4682B4]'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-semibold text-sm leading-snug pt-0.5">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Optimistic Playful Nudge upon answer selection */}
              {justSubmittedFeedback && (
                <div className="p-3 bg-[#6DC082]/15 border border-[#6DC082]/30 rounded-xl text-center animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-[#2e7d32]">
                    &quot;Submitted, was the learner guide used in this answer? I wonder :-)&quot;
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    You can change your choice freely until the timer ends or facilitator locks.
                  </p>
                </div>
              )}

              {/* Active Waiting Nudge */}
              {selectedChoices.length > 0 && !justSubmittedFeedback && (
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] text-slate-600 font-medium">
                    ✅ Choice logged! While waiting: Check your Learner Guide index for the exact heading.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status Indicator */}
            <div className="pt-2 text-center text-xs text-slate-500">
              {session.status === 'question_locked' ? (
                <span className="text-amber-600 font-bold">Submissions Locked by Facilitator</span>
              ) : (
                <span>Submissions open • Timer synced with classroom projector</span>
              )}
            </div>
          </div>
        )}

        {/* STAGE 5: REVEAL SCREEN */}
        {stage === 'revealed' && session && currentQ && (
          <div className="my-auto space-y-4 animate-in fade-in duration-200">
            {/* Score & Correctness Header */}
            {currentQ.format !== 'WORD_CLOUD' && currentResponse && (
              <div
                className={`p-4 rounded-2xl border text-center shadow-xs ${
                  currentResponse.is_correct
                    ? 'bg-[#6DC082]/15 border-[#6DC082]/40 text-[#2b773f]'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {currentResponse.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#6DC082]" />
                      <span className="text-base font-black">Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-base font-black">Incorrect Choice</span>
                    </>
                  )}
                </div>
                <p className="text-xs font-bold">
                  +{currentResponse.points_awarded} Points Awarded
                </p>
              </div>
            )}

            {/* Correct Option Highlighting */}
            {currentQ.format !== 'WORD_CLOUD' && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Answer Breakdown:
                </span>
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = currentQ.correct_options.includes(idx);
                  const isUserSelection = selectedChoices.includes(idx);

                  let borderClass = 'border-slate-200 bg-white text-slate-500';
                  if (isCorrect) {
                    borderClass = 'border-[#6DC082] bg-[#6DC082]/10 text-slate-900 font-bold';
                  } else if (isUserSelection && !isCorrect) {
                    borderClass = 'border-red-300 bg-red-50 text-red-700 line-through';
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs bg-slate-100 text-slate-700">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-[#2e7d32] bg-[#6DC082]/20 px-2 py-0.5 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Learner Guide Workplace Rationale Card */}
            {currentQ.additional_text && (
              <div className="p-4 rounded-2xl bg-white border border-[#D5E3EF] shadow-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4682B4] uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-[#6DC082]" />
                  <span>Workplace Rationale & Debrief:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentQ.additional_text}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400 italic text-center animate-pulse pt-2">
              Waiting for facilitator to proceed to the next question...
            </p>
          </div>
        )}

        {/* STAGE 6: SESSION COMPLETED */}
        {stage === 'completed' && participant && (
          <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-500 mx-auto shadow-sm">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-800">Training Session Complete!</h1>
              <p className="text-xs text-slate-500 mt-1">
                Outstanding participation. Your final score has been logged.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#D5E3EF] shadow-sm max-w-xs mx-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Final Score
              </span>
              <div className="text-4xl font-mono font-black text-[#4682B4] mt-1">
                {participant.score} pts
              </div>
              <span className="text-xs font-semibold text-slate-600 block mt-1">
                {participant.display_name}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Shared tablet cache cleared. Device ready for the next cohort.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Session...</div>}>
      <ParticipantPlayContent />
    </Suspense>
  );
}
