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
  X,
  Clock,
  Tag
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

  const loadSessions = async () => {
    const list = await AppStore.fetchSessions();
    setSessions(list);
  };

  const handleOpenDetail = async (sess: Session) => {
    setSelectedSession(sess);
    const p = await AppStore.fetchParticipants(sess.id);
    setSessionParticipants(p);
    const r = AppStore.getResponses(sess.id);
    setSessionResponses(r);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this session record? This action cannot be undone.')) {
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

  const handleExportCSV = async (sess: Session) => {
    const p = await AppStore.fetchParticipants(sess.id);
    const r = AppStore.getResponses(sess.id);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Client Name,Cohort Number,Session Title,Room PIN,Entry Mode,Session Start Time,Participant Name,Total Score,Question ID,Chosen Option,Is Correct,Points Awarded,Submitted Timestamp\n';

    if (r.length === 0) {
      p.forEach(part => {
        const row = [
          `"${sess.client_name || sess.group?.client_name || 'Client'}"`,
          `"Cohort ${sess.cohort_number || 1}"`,
          `"${sess.title}"`,
          `"${sess.room_code}"`,
          `"${sess.entry_mode}"`,
          `"${sess.created_at}"`,
          `"${part.display_name}"`,
          part.score,
          `"N/A"`,
          `"N/A"`,
          `"N/A"`,
          0,
          `"${part.joined_at}"`
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      r.forEach(item => {
        const participantObj = p.find(part => part.id === item.participant_id);
        const chosenStr = Array.isArray(item.selected_options) ? item.selected_options.join(';') : String(item.selected_options);

        const row = [
          `"${sess.client_name || sess.group?.client_name || 'Client'}"`,
          `"Cohort ${sess.cohort_number || 1}"`,
          `"${sess.title}"`,
          `"${sess.room_code}"`,
          `"${sess.entry_mode}"`,
          `"${sess.created_at}"`,
          `"${participantObj?.display_name || 'Participant'}"`,
          participantObj?.score ?? 0,
          `"${item.question_id}"`,
          `"${chosenStr}"`,
          item.is_correct ? 'TRUE' : 'FALSE',
          item.points_awarded,
          `"${item.submitted_at}"`
        ].join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Session_Log_${sess.room_code}_Cohort${sess.cohort_number || 1}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const clientMatch = (s.client_name || s.group?.client_name || '').toLowerCase().includes(q);
    const pinMatch = s.room_code.includes(q);
    return titleMatch || clientMatch || pinMatch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F9F3] text-slate-800 antialiased font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4682B4] uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Compliance & Analytics Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Session History & Learner Records
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Complete automated logging of client sessions, cohort numbers (1–10), participant rosters, and response timestamps.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, title, PIN..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#D5E3EF] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4682B4] shadow-xs"
            />
          </div>
        </div>

        {/* Sessions Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#D5E3EF] rounded-2xl p-12 text-center shadow-xs">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Past Sessions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Completed or launched live polling sessions will appear here automatically with learner rosters and timestamped responses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((sess) => {
              const participants = AppStore.getParticipants(sess.id);
              const responses = AppStore.getResponses(sess.id);
              const formattedDate = new Date(sess.created_at).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => handleOpenDetail(sess)}
                  className="bg-white border border-[#D5E3EF] hover:border-[#4682B4] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#4682B4] border border-slate-200">
                        PIN: {sess.room_code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#6DC082]/15 text-[#2b773f]">
                        Cohort {sess.cohort_number || 1}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#4682B4]" />
                        {sess.client_name || sess.group?.client_name || 'Client Cohort'}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 mt-1 leading-snug group-hover:text-[#4682B4] transition-colors line-clamp-2">
                        {sess.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{participants.length} {sess.entry_mode === 'group' ? 'Teams' : 'Learners'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{responses.length} Submissions</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>

                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Session Inspection Modal */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#D5E3EF] rounded-2xl max-w-3xl w-full shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#4682B4] border border-slate-200">
                      PIN: {selectedSession.room_code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#6DC082]/15 text-[#2b773f]">
                      Cohort {selectedSession.cohort_number || 1}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Mode: {selectedSession.entry_mode === 'group' ? 'Group Teams' : 'Individual'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedSession.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Client: {selectedSession.client_name || 'Client'} • Started: {new Date(selectedSession.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCSV(selectedSession)}
                    className="px-3 py-1.5 bg-[#4682B4] hover:bg-[#3b6f9a] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Participants & Scores Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Participant Leaderboard ({sessionParticipants.length})
                </h3>

                {sessionParticipants.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No participants logged for this session.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Rank</th>
                          <th className="py-2.5 px-4">{selectedSession.entry_mode === 'group' ? 'Table Team' : 'Learner'}</th>
                          <th className="py-2.5 px-4">Joined Timestamp</th>
                          <th className="py-2.5 px-4 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...sessionParticipants]
                          .sort((a, b) => b.score - a.score)
                          .map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                              <td className="py-2.5 px-4 font-bold text-slate-800">{p.display_name}</td>
                              <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                                {new Date(p.joined_at).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-black text-[#4682B4]">
                                {p.score} pts
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Timestamped Question Responses Audit */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#4682B4]" />
                  Timestamped Response Submissions ({sessionResponses.length})
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sessionResponses.map((r, i) => {
                    const participantObj = sessionParticipants.find(p => p.id === r.participant_id);
                    const chosen = Array.isArray(r.selected_options) ? r.selected_options.join(', ') : String(r.selected_options);

                    return (
                      <div
                        key={r.id || i}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">
                            {participantObj?.display_name || 'Participant'}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            Selected Option(s): <span className="font-mono font-semibold">{chosen}</span> •{' '}
                            {r.is_correct ? (
                              <span className="text-[#2e7d32] font-bold">Correct (+{r.points_awarded} pts)</span>
                            ) : (
                              <span className="text-red-600 font-bold">Incorrect (0 pts)</span>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(r.submitted_at).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
