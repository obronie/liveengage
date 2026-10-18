'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Default 19-20 Corruseal Learner Roster from the Unified iLearn Classroom Hub
 * Used as the primary fallback when no custom cohort or URL parameters are passed.
 */
export const DEFAULT_CORRUSEAL_LEARNERS: string[] = [
  'Wandile Mashinini',
  'Fortune Layini',
  'Nkosinathi Gift Mabuza',
  'Zwelibanzi Mkabane',
  'Pomodzo Ramagadana',
  'Regan',
  'Bontle Mashego',
  'Wonder Shenge',
  'Nkosi',
  'Londiwe Majola',
  'Nobuhle Madhlala',
  'Mafa Makgakti',
  'Luyanda Young',
  'Sisekelo Motha',
  'Andile Manana',
  'Rejoyce Petje',
  'Edwin Mpela',
  'Bandile Ndala',
  'Emmanuel Makaula',
  'Siphamandla Dube',
];

export interface IlearnSessionMetadata {
  company?: string;
  programme?: string;
  groupNumber?: string;
  facilitator?: string;
  attendanceDate?: string;
}

const STORAGE_KEY_LEARNERS = 'ilearn_synced_learners';
const STORAGE_KEY_SESSION = 'ilearn_synced_session';
const STORAGE_KEY_EMBED = 'ilearn_is_embedded';

/**
 * Get stored learners from localStorage with fallback to Corruseal roster
 */
export function getStoredLearners(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CORRUSEAL_LEARNERS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEARNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: string) => s.trim()).filter(Boolean);
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored learners:', e);
  }
  return DEFAULT_CORRUSEAL_LEARNERS;
}

/**
 * Save learners to localStorage and notify active components
 */
export function saveStoredLearners(learners: string[]): void {
  if (typeof window === 'undefined') return;
  const cleaned = learners.map((s) => s.trim()).filter(Boolean);
  try {
    localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('ilearn_learners_updated', { detail: cleaned }));
  } catch (e) {
    console.warn('Failed to save learners:', e);
  }
}

/**
 * Check whether the app is currently running in an embedded context
 */
export function isAppEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true' || window.location.search.includes('embed=true')) {
      return true;
    }
    const stored = localStorage.getItem(STORAGE_KEY_EMBED);
    if (stored === 'true') {
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

/**
 * Hook to synchronize with the iLearn Classroom Hub via URL query parameters and window.postMessage
 */
export function useIlearnSync() {
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [learners, setLearnersState] = useState<string[]>(DEFAULT_CORRUSEAL_LEARNERS);
  const [sessionMetadata, setSessionMetadata] = useState<IlearnSessionMetadata>({});

  // Sync state and notify
  const updateLearners = useCallback((newLearners: string[]) => {
    const cleaned = newLearners.map((s) => s.trim()).filter(Boolean);
    setLearnersState(cleaned);
    saveStoredLearners(cleaned);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial check of URL parameters
    const params = new URLSearchParams(window.location.search);
    const embedParam = params.get('embed');
    const clientParam = params.get('client');
    const progParam = params.get('prog');
    const grpParam = params.get('grp');
    const facParam = params.get('fac');
    const dateParam = params.get('date');
    const learnersParam = params.get('learners');

    const embeddedNow = embedParam === 'true' || window.location.search.includes('embed=true');
    if (embeddedNow) {
      setIsEmbedded(true);
      try {
        localStorage.setItem(STORAGE_KEY_EMBED, 'true');
      } catch (e) {}
    } else {
      const storedEmbed = localStorage.getItem(STORAGE_KEY_EMBED);
      if (storedEmbed === 'true') {
        setIsEmbedded(true);
      }
    }

    // Build session metadata from URL
    const metaFromUrl: IlearnSessionMetadata = {};
    if (clientParam) metaFromUrl.company = clientParam;
    if (progParam) metaFromUrl.programme = progParam;
    if (grpParam) metaFromUrl.groupNumber = grpParam;
    if (facParam) metaFromUrl.facilitator = facParam;
    if (dateParam) metaFromUrl.attendanceDate = dateParam;

    if (Object.keys(metaFromUrl).length > 0) {
      setSessionMetadata(metaFromUrl);
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(metaFromUrl));
      } catch (e) {}
    } else {
      try {
        const storedMeta = localStorage.getItem(STORAGE_KEY_SESSION);
        if (storedMeta) {
          setSessionMetadata(JSON.parse(storedMeta));
        }
      } catch (e) {}
    }

    // 2. Load learners: URL param -> localStorage -> default Corruseal
    if (learnersParam && learnersParam.trim().length > 0) {
      const parsed = learnersParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        updateLearners(parsed);
      }
    } else {
      setLearnersState(getStoredLearners());
    }

    // 3. Listen for postMessage synchronization from Unified iLearn Classroom Hub
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'ILEARN_SESSION_SYNC') {
        const data = event.data;
        const newMeta: IlearnSessionMetadata = {
          company: data.company,
          programme: data.programme,
          groupNumber: data.groupNumber,
          facilitator: data.facilitator,
          attendanceDate: data.attendanceDate,
        };
        setSessionMetadata(newMeta);
        try {
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newMeta));
        } catch (e) {}

        if (Array.isArray(data.learners) && data.learners.length > 0) {
          const validLearners = data.learners
            .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
            .filter(Boolean);
          if (validLearners.length > 0) {
            updateLearners(validLearners);
          }
        }
      }
    };

    // 4. Listen for local storage/custom events from other tabs or modals
    const handleLocalLearnerUpdate = (event: Event) => {
      const customEvt = event as CustomEvent<string[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setLearnersState(customEvt.detail);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('ilearn_learners_updated', handleLocalLearnerUpdate);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('ilearn_learners_updated', handleLocalLearnerUpdate);
    };
  }, [updateLearners]);

  return {
    isEmbedded,
    learners,
    setLearners: updateLearners,
    sessionMetadata,
  };
}
