'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppStore } from '@/lib/store';
import { getStoredLearners } from '@/lib/ilearnSync';
import { QuestionSet } from '@/types';
import { ClassroomQAWheelModal } from '@/components/ClassroomQAWheelModal';
import { Loader2 } from 'lucide-react';

export default function StandaloneWheelPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;

  const [set, setSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [learners, setLearners] = useState<string[]>([]);

  useEffect(() => {
    if (!setId) return;

    const loadSet = async () => {
      setLoading(true);
      // Try local cache first
      let foundSet = AppStore.getQuestionSetById(setId);
      if (!foundSet) {
        // Fallback fetch from Supabase
        const allSets = await AppStore.fetchQuestionSets();
        foundSet = allSets.find((s) => s.id === setId) || null;
      }

      setSet(foundSet);
      setLearners(getStoredLearners());
      setLoading(false);
    };

    loadSet();
  }, [setId]);

  const handleClose = () => {
    try {
      window.close();
    } catch {
      router.push('/courses');
    }
    // In case window.close() is blocked because page was not opened directly by window.open
    setTimeout(() => {
      if (!window.closed) {
        router.push('/courses');
      }
    }, 200);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0b1329] flex flex-col items-center justify-center text-white gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#00B0F0]" />
        <p className="text-sm font-bold text-slate-300">Loading Classroom Q&A Wheel...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="fixed inset-0 bg-[#0b1329] flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <div className="max-w-md bg-[#121b2d] border border-[#1e2e4a] p-8 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-black text-rose-400">Question Set Not Found</h2>
          <p className="text-xs text-slate-300">
            The requested question set could not be loaded. It may have been deleted or moved.
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="px-5 py-2.5 rounded-xl bg-[#00B0F0] hover:bg-[#0090C0] text-white font-bold text-xs transition-colors"
          >
            Return to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-900">
      <ClassroomQAWheelModal
        set={set}
        initialLearners={learners}
        onClose={handleClose}
      />
    </div>
  );
}
