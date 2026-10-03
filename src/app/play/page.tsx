'use client';

import React, { useState, useEffect } from 'react';
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
  RotateCcw, 
  Trophy, 
  AlertCircle,
  HelpCircle
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

      // Check if room is in query
      if (roomQuery) {
        setPin(roomQuery);
        lookupRoom(roomQuery);
      }
    }
  }, [roomQuery]);

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
      const remembered = localStorage.getItem('liveengage_individual_name') || '';
      if (remembered) {
        setDisplayName(remembered);
      }
      setStage('identity');
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !session) return;

    if (session.entry_mode === 'individual') {
      localStorage.setItem('liveengage_individual_name', displayName.trim());
    }

    const p = await AppStore.joinSession(
      session.id,
      session.room_code,
      displayName.trim(),
      deviceIdentifier
    );
    setParticipant(p);

    if (session.status === 'lobby') {
      setStage('waiting');
    } else if (session.status === 'completed') {
      setStage('completed');
    } else if (session.status === 'revealed') {
      setStage('revealed');
    } else {
      setStage('active');
    }
  };

  // Real-time synchronization subscription
  useEffect(() => {
    if (!session?.room_code) return;

    const unsubscribe = AppStore.subscribeToRoom(session.room_code, (event) => {
      if (event.type === 'SESSION_UPDATED') {
        const updatedSession = event.payload as Session;
        setSession(updatedSession);

        if (updatedSession.status === 'lobby') {
          setStage('waiting');
        } else if (updatedSession.status === 'completed') {
          setStage('completed');
          // Automatically clear group identity cache so shared classroom tablet is clean for next cohort!
          if (updatedSession.entry_mode === 'group') {
            setDisplayName('');
          }
        } else if (updatedSession.status === 'revealed') {
          setStage('revealed');
        } else if (updatedSession.status === 'question_active') {
          setStage('active');
        }
      }
    });

    return () => unsubscribe();
  }, [session?.room_code]);

  // Handle choice selection (Blind Review - can change choices freely while timer runs!)
  const handleToggleOption = (optIndex: number) => {
    if (!session || session.status === 'question_locked' || session.status === 'revealed') return;

    const currentQ = session.questions?.[session.current_question_index];
    if (!currentQ) return;

    let updated: number[] = [];
    if (currentQ.format === 'MCQ' || currentQ.format === 'BINARY' || currentQ.format === 'SCALE') {
      updated = [optIndex];
    } else if (currentQ.format === 'MULTIPLE') {
      if (selectedChoices.includes(optIndex)) {
        updated = selectedChoices.filter(i => i !== optIndex);
      } else {
        updated = [...selectedChoices, optIndex];
      }
    }

    setSelectedChoices(updated);
    submitChoiceToStore(updated);
  };

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordSubmission.trim()) return;
    submitChoiceToStore(wordSubmission.trim());
  };

  const submitChoiceToStore = async (val: number[] | string) => {
    if (!session || !participant) return;
    const currentQ = session.questions?.[session.current_question_index];
    if (!currentQ) return;

    // Show playful confirmation immediately
    setJustSubmittedFeedback(true);

    const resp = await AppStore.submitResponse(
      session,
      currentQ,
      participant,
      val,
      currentQ.duration - timeLeft
    );
    setCurrentResponse(resp);
  };

  // Reset selections when question changes
  useEffect(() => {
    if (session && session.questions) {
      const currentQ = session.questions[session.current_question_index];
      if (currentQ) {
        setSelectedChoices([]);
        setWordSubmission('');
        setJustSubmittedFeedback(false);

        // Load existing response if any
        if (participant) {
          const existing = AppStore.getResponses(session.id, currentQ.id).find(
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
  }, [session?.current_question_index, session?.id, participant?.id]);

  const currentQ = session?.questions?.[session.current_question_index];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Mobile Bar */}
      <header className="h-14 px-4 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">LiveEngage</span>
        </div>

        {session && participant && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
              PIN: {session.room_code}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-emerald-300">
              {session.entry_mode === 'group' ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">Group: {participant.display_name}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{participant.display_name}</span>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-md w-full mx-auto justify-center">
        {/* STAGE 1: PIN ENTRY */}
        {stage === 'pin' && (
          <div className="my-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <Radio className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white">Join Training Session</h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit room PIN displayed on the facilitator screen
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
                className="w-full text-center text-3xl font-mono font-black tracking-widest px-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500"
              />

              {errorMessage && (
                <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={pin.trim().length !== 6}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all min-h-[48px]"
              >
                Continue to Session
              </button>
            </form>
          </div>
        )}

        {/* STAGE 2: IDENTITY GATE (Individual vs Group) */}
        {stage === 'identity' && session && (
          <div className="my-auto space-y-6 animate-in fade-in duration-150">
            <div className="text-center">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ROOM PIN: {session.room_code}
              </span>
              <h1 className="text-xl font-bold text-white mt-2">{session.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {session.group?.client_name} • {session.group?.group_name}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              {session.entry_mode === 'group' ? (
                /* Group Mode: Mandatory Team Name Prompt */
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Users className="w-4 h-4" />
                    <span>Group Table Identity</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Enter your Table or Team name (e.g. Table 1, Table 2, Safety Crew).
                  </p>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Table 1"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold min-h-[48px]"
                  />
                  <p className="text-[10px] text-amber-400/90 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Always fresh per session — shared tablet memory is never assumed.</span>
                  </p>
                </div>
              ) : (
                /* Individual Mode */
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <User className="w-4 h-4" />
                    <span>Learner Identity</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Enter your Name and Surname.
                  </p>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sipho Dlamini"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold min-h-[48px]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleJoinSession}
                disabled={!displayName.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all min-h-[48px]"
              >
                Join Live Room
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: WAITING ROOM */}
        {stage === 'waiting' && session && (
          <div className="my-auto space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto relative">
              <Sparkles className="w-10 h-10 animate-pulse text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
                Connected & Ready
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {session.title}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Facilitator: {session.group?.client_name} ({session.group?.group_name})
              </p>
            </div>

            {session.facilitator_instructions && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-indigo-200/90 leading-relaxed font-medium">
                &ldquo;{session.facilitator_instructions}&rdquo;
              </div>
            )}

            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">Tip: </span>
              Have your physical or digital Learner Guide open! Questions are framed to challenge your guide navigation skills.
            </div>

            <p className="text-xs text-slate-500 italic animate-pulse">
              Waiting for facilitator to start the first question...
            </p>
          </div>
        )}

        {/* STAGE 4: ACTIVE QUESTION (Blind Review) */}
        {stage === 'active' && session && currentQ && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-4 animate-in fade-in duration-150">
            {/* Top Learner Guide Prompt Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/15 border border-indigo-500/30 flex items-center justify-between gap-2 shadow">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>📖 Look inside your Learner Guide for this answer!</span>
              </div>
            </div>

            {/* Question Stem */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Question {session.current_question_index + 1} of {session.questions?.length}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  {currentQ.format}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQ.body}
              </h2>
            </div>

            {/* Options Choices / Word Cloud Input */}
            <div className="my-auto space-y-2.5">
              {currentQ.format === 'WORD_CLOUD' ? (
                <form onSubmit={handleWordSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={wordSubmission}
                    onChange={(e) => setWordSubmission(e.target.value)}
                    placeholder="Enter your key word or term..."
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-indigo-500 min-h-[48px]"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit to Word Cloud</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedChoices.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleOption(idx)}
                        className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center justify-between gap-3 min-h-[56px] active:scale-[0.98] ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/50'
                            : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Playful Confirmation Message upon choice */}
            {justSubmittedFeedback && (
              <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-center animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-semibold text-emerald-300">
                  Submitted, was the learner guide used in this answer? I wonder :-)
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  You can change your selection freely before the facilitator locks.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STAGE 5: REVEALED RESULTS */}
        {stage === 'revealed' && session && currentQ && (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-4 animate-in fade-in duration-200">
            {/* Result Badge */}
            {currentQ.format !== 'WORD_CLOUD' && currentResponse && (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  currentResponse.is_correct
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                }`}
              >
                {currentResponse.is_correct ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-base">
                    {currentResponse.is_correct ? 'Correct! Well Done!' : 'Check your Learner Guide!'}
                  </h3>
                  <p className="text-xs opacity-90">
                    {currentResponse.is_correct
                      ? `Awarded ${currentResponse.points_awarded} points!`
                      : 'Keep your guide open for the next question.'}
                  </p>
                </div>
              </div>
            )}

            {/* Question Stem */}
            <div>
              <span className="text-xs font-semibold text-slate-400">Question Stem</span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {currentQ.body}
              </h2>
            </div>

            {/* Revealed Choices with Correct Highlight */}
            {currentQ.format !== 'WORD_CLOUD' && (
              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = currentQ.correct_options.includes(idx);
                  const isMySelection = selectedChoices.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                        isCorrect
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold'
                          : isMySelection
                          ? 'bg-red-950/30 border-red-500/40 text-red-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation / Additional Text */}
            {currentQ.additional_text && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 space-y-1">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <BookOpen className="w-3.5 h-3.5" /> Learner Guide Rationale
                </span>
                <p className="leading-relaxed">{currentQ.additional_text}</p>
              </div>
            )}

            <p className="text-center text-xs text-slate-500 italic py-2 animate-pulse">
              Waiting for facilitator to move to next question...
            </p>
          </div>
        )}

        {/* STAGE 6: COMPLETED SESSION */}
        {stage === 'completed' && (
          <div className="my-auto space-y-6 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Quiz Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Thank you for participating! Check the facilitator screen for the podium awards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-xs mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Score
              </span>
              <p className="text-4xl font-mono font-black text-emerald-400 mt-1">
                {participant?.score || 0} pts
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              Shared device cache has been cleared for the next group cohort.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ParticipantPlayPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">Loading Live Room...</div>}>
      <ParticipantPlayContent />
    </React.Suspense>
  );
}
