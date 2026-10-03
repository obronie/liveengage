'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AppStore } from '@/lib/store';
import { Session, Participant, ResponseRecord } from '@/types';
import { 
  History, 
  Search, 
  Calendar, 
  Users, 
  Award, 
  Building2, 
  Layers, 
  ArrowUpRight, 
  Trash2, 
  CheckCircle2, 
  FileSpreadsheet,
  BarChart3,
  X
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<Participant[]>([]);
  const [sessionResponses, setSessionResponses] = useState<ResponseRecord[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const list = AppStore.getSessions();
    setSessions(list);
  };

  const handleOpenDetail = (sess: Session) => {
    setSelectedSession(sess);
    const p = AppStore.getParticipants(sess.id);
    setSessionParticipants(p);
    const r = AppStore.getResponses(sess.id);
    setSessionResponses(r);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this session archive? This action cannot be undone.')) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);
      if (typeof window !== 'undefined') {
        localStorage.setItem('liveengage_sessions', JSON.stringify(remaining));
      }
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const handleExportCSV = (sess: Session) => {
    const p = AppStore.getParticipants(sess.id);
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Client,Cohort,Session Title,Room PIN,Entry Mode,Participant Name,Total Score\n';

    p.forEach(item => {
      const row = [
        `"${sess.group?.client_name || ''}"`,
        `"${sess.group?.group_name || ''}"`,
        `"${sess.title}"`,
        `"${sess.room_code}"`,
        `"${sess.entry_mode}"`,
        `"${item.display_name}"`,
        item.score
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Session_Archive_${sess.room_code}_${sess.group?.client_name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const clientMatch = s.group?.client_name?.toLowerCase().includes(q) || false;
    const groupMatch = s.group?.group_name?.toLowerCase().includes(q) || false;
    const pinMatch = s.room_code.includes(q);
    return titleMatch || clientMatch || groupMatch || pinMatch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Corporate Session Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Session Archive & Attendance Roster
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Persistent audit trail of corporate training cohorts, client records, and learner score distributions.
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, cohort, or PIN..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No session archives found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Completed or launched classroom polling sessions are archived automatically here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((sess) => {
                const pCount = AppStore.getParticipants(sess.id).length;
                const qCount = sess.questions?.length || 0;

                return (
                  <div
                    key={sess.id}
                    onClick={() => handleOpenDetail(sess)}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          PIN: {sess.room_code}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {sess.title}
                      </h3>

                      <div className="mt-3 space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-medium text-slate-300">{sess.group?.client_name || 'Client'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sess.group?.group_name || 'Cohort'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          {pCount} {sess.entry_mode === 'group' ? 'Teams' : 'Learners'}
                        </span>
                        <span>•</span>
                        <span>{qCount} Questions</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/presenter/${sess.room_code}`);
                          }}
                          className="p-1.5 text-indigo-400 hover:text-white rounded-lg hover:bg-indigo-600/20 transition-colors"
                          title="Launch Presenter View"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Session Drilldown Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    PIN: {selectedSession.room_code}
                  </span>
                  <span className="text-xs text-slate-400">
                    Mode: {selectedSession.entry_mode === 'group' ? 'Group Competition' : 'Individual'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedSession.title}</h3>
                <p className="text-xs text-slate-400">
                  {selectedSession.group?.client_name} • {selectedSession.group?.group_name}
                </p>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* Roster & Scores */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Participant / Table Roster ({sessionParticipants.length})
                  </h4>
                  <button
                    onClick={() => handleExportCSV(selectedSession)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {sessionParticipants.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No participants logged for this session.</p>
                ) : (
                  <div className="space-y-2">
                    {sessionParticipants.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-slate-800 font-mono font-bold flex items-center justify-center text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-white">{p.display_name}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {p.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Question Items ({selectedSession.questions?.length || 0})
                </h4>
                <div className="space-y-2.5">
                  {selectedSession.questions?.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-400">Question #{idx + 1} ({q.format})</span>
                        <span className="text-[11px] text-slate-500">Duration: {q.duration}s</span>
                      </div>
                      <p className="font-medium text-white">{q.body}</p>
                      {q.additional_text && (
                        <p className="text-[11px] text-slate-400 italic">
                          Rationale: {q.additional_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => router.push(`/presenter/${selectedSession.room_code}`)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Re-launch Room</span>
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
