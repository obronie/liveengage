'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  History, 
  Settings, 
  Radio, 
  Smartphone, 
  Check, 
  Database,
  CloudLightning,
  X
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function Navbar() {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGemini = localStorage.getItem('liveengage_gemini_key') || '';
      const storedSupaUrl = localStorage.getItem('liveengage_supabase_url') || '';
      const storedSupaKey = localStorage.getItem('liveengage_supabase_key') || '';
      setGeminiKey(storedGemini);
      setSupabaseUrl(storedSupaUrl);
      setSupabaseKey(storedSupaKey);
      setIsCloudActive(isSupabaseConfigured());
    }
  }, [showSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveengage_gemini_key', geminiKey.trim());
      localStorage.setItem('liveengage_supabase_url', supabaseUrl.trim());
      localStorage.setItem('liveengage_supabase_key', supabaseKey.trim());
      setSavedSuccess(true);
      setIsCloudActive(isSupabaseConfigured());
      setTimeout(() => {
        setSavedSuccess(false);
        setShowSettings(false);
        window.location.reload();
      }, 700);
    }
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-[#0d121f]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  LiveEngage <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">POLL</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1">Adult Training & Corporate Facilitation</span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === '/' 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Session Builder</span>
            </Link>

            <Link
              href="/courses"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/courses') 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Course Library</span>
            </Link>

            <Link
              href="/history"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/history') 
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Archive</span>
            </Link>

            <Link
              href="/play"
              target="_blank"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors flex items-center gap-1.5 ml-1"
              title="Open Learner Mobile View in New Tab"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Learner Screen</span>
            </Link>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors relative ml-1"
              title="Configuration & API Keys"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
              {isCloudActive ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400/80" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">System Settings & Connections</h3>
                <p className="text-xs text-slate-400">Manage Google Gemini AI and Supabase Realtime synchronization</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Sync Status Banner */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-slate-300">Sync Engine:</span>
                </div>
                <div>
                  {isCloudActive ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                      <CloudLightning className="w-3 h-3" /> Supabase Cloud Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                      ● Local High-Speed Realtime (BroadcastChannel)
                    </span>
                  )}
                </div>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Powers instant question generation with Structured Outputs. If omitted, built-in occupational training sample questions are used.
                </p>
              </div>

              {/* Supabase URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Supabase Project URL (Optional)
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Supabase Anon Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Supabase Anon Key (Optional)
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to run on automatic zero-config local storage + multi-tab synchronization.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      Saved!
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
