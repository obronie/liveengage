import { Course, CourseDocument, Session, Question, Participant, ResponseRecord, HiddenWord } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const COURSES_STORAGE_KEY = 'liveengage_courses';
const SESSIONS_STORAGE_KEY = 'liveengage_sessions';
const PARTICIPANTS_STORAGE_KEY = 'liveengage_participants';
const RESPONSES_STORAGE_KEY = 'liveengage_responses';
const HIDDEN_WORDS_STORAGE_KEY = 'liveengage_hidden_words';
const OFFLINE_QUEUE_KEY = 'liveengage_offline_queue';

// Sample preloaded courses for instant testing
const INITIAL_COURSES: Course[] = [
  {
    id: 'course-oq99446',
    code: 'OQ99446',
    title: 'Occupational Store Person: Warehouse Housekeeping & Safety',
    description: 'Unit standard covering workplace safety, chemical hazard identification, PPE compliance, and housekeeping procedures.',
    created_at: new Date().toISOString(),
    documents: [
      {
        id: 'doc-oq99446-guide',
        course_id: 'course-oq99446',
        doc_type: 'learner_guide',
        file_name: 'LG_OQ99446_Warehouse_Housekeeping_Rev4.pdf',
        extracted_text: `MODULE 2: HOUSEKEEPING AND CHEMICAL SAFETY IN THE WAREHOUSE
Section 2.1 - Core Workplace Housekeeping Duties
According to your Learner Guide, housekeeping is not merely cleaning up; it is an ongoing standard operating discipline required to avert trips, slips, falls, and chemical contamination.
Mandatory standard procedures require:
1. Aisles, emergency exit doorways, and electrical distribution boards must remain unobstructed by at least 1.2 meters of clear clearance perimeter at all times.
2. Pallets must never be stacked more than 3 tiers high unless locked within calibrated drive-in racking bays. Broken pallets or splintered stringers must be red-tagged and decommissioned immediately.
3. Liquid spills must be barricaded with high-visibility chevron cones within 60 seconds and neutralised using designated spill kits (hydrocarbon absorbent for diesel/oils; universal clay granular for non-corrosive liquids).

Section 2.2 - Chemical Hazards & Safety Data Sheets (SDS)
The Learner Guide specifies the 16-section Globally Harmonized System (GHS) SDS. Section 8 details Personal Protective Equipment (PPE) requirements and exposure thresholds.
When handling industrial degreasers and battery acid:
- Nitrile gloves (minimum 0.4mm thickness) and chemical splash goggles with indirect ventilation are mandatory.
- Flammable aerosol lubricants must be kept in fire-rated yellow safety cabinets at least 10 meters away from battery charging bays.`,
        uploaded_at: new Date().toISOString(),
      },
      {
        id: 'doc-oq99446-curriculum',
        course_id: 'course-oq99446',
        doc_type: 'curriculum',
        file_name: 'Curriculum_Framework_OQ99446.pdf',
        extracted_text: `Curriculum Outcomes:
1. Explain occupational health and safety requirements in storage environments.
2. Demonstrate correct deployment of personal protective equipment and spill management kits.
3. Conduct pre-shift inspection checklists and report non-conformances.`,
        uploaded_at: new Date().toISOString(),
      }
    ]
  }
];

export class AppStore {
  private static broadcastChannels: Map<string, BroadcastChannel> = new Map();

  private static getChannel(roomCode: string): BroadcastChannel | null {
    if (typeof window === 'undefined') return null;
    if (!this.broadcastChannels.has(roomCode)) {
      try {
        const channel = new BroadcastChannel(`liveengage_${roomCode}`);
        this.broadcastChannels.set(roomCode, channel);
      } catch {
        return null;
      }
    }
    return this.broadcastChannels.get(roomCode) || null;
  }

  // --- Course Operations ---
  static getCourses(): Course[] {
    if (typeof window === 'undefined') return INITIAL_COURSES;
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(INITIAL_COURSES));
      return INITIAL_COURSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_COURSES;
    }
  }

  static async fetchCourses(): Promise<Course[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*, documents:course_documents(*)');
        if (!error && data && data.length > 0) {
          localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCourses error, falling back to local:', err);
      }
    }
    return this.getCourses();
  }

  static async saveCourse(course: Course): Promise<Course> {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.unshift(course);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').upsert({
          id: course.id,
          code: course.code,
          title: course.title,
          description: course.description,
          created_at: course.created_at,
        });

        if (course.documents && course.documents.length > 0) {
          for (const doc of course.documents) {
            await supabase.from('course_documents').upsert({
              id: doc.id,
              course_id: doc.course_id,
              doc_type: doc.doc_type,
              file_name: doc.file_name,
              extracted_text: doc.extracted_text,
              uploaded_at: doc.uploaded_at,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase saveCourse failed, stored locally:', e);
      }
    }
    return course;
  }

  static async deleteCourse(courseId: string): Promise<void> {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').delete().eq('id', courseId);
      } catch (e) {
        console.warn('Supabase deleteCourse error:', e);
      }
    }
  }

  // --- Session Operations ---
  static getSessions(): Session[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static async getSessionByRoomCode(roomCode: string): Promise<Session | null> {
    const normalized = roomCode.trim().toUpperCase();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*, questions(*), participants(*)')
          .eq('room_code', normalized)
          .single();

        if (!error && data) {
          // Sort questions by question_order
          if (data.questions) {
            data.questions.sort((a: Question, b: Question) => a.question_order - b.question_order);
          }
          return data as Session;
        }
      } catch (err) {
        console.warn('Supabase getSession error, falling back to local:', err);
      }
    }

    // Local fallback
    const sessions = this.getSessions();
    return sessions.find(s => s.room_code.toUpperCase() === normalized) || null;
  }

  static async saveSession(session: Session): Promise<Session> {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id || s.room_code === session.room_code);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }

    // Broadcast local event
    const channel = this.getChannel(session.room_code);
    if (channel) {
      channel.postMessage({ type: 'SESSION_UPDATED', payload: session });
    }

    // Supabase sync
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sessions').upsert({
          id: session.id,
          group_id: session.group_id,
          course_id: session.course_id,
          title: session.title,
          room_code: session.room_code,
          entry_mode: session.entry_mode,
          status: session.status,
          current_question_index: session.current_question_index,
          facilitator_instructions: session.facilitator_instructions,
          question_timer_end: session.question_timer_end,
          created_at: session.created_at,
        });

        if (session.questions && session.questions.length > 0) {
          for (const q of session.questions) {
            await supabase.from('questions').upsert({
              id: q.id,
              session_id: session.id,
              question_order: q.question_order,
              format: q.format,
              body: q.body,
              additional_text: q.additional_text,
              options: q.options,
              correct_options: q.correct_options,
              duration: q.duration,
              guide_topic_hint: q.guide_topic_hint,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase saveSession error:', err);
      }
    }

    return session;
  }

  // --- Participants Operations ---
  static getParticipants(sessionId: string): Participant[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: Participant[] = JSON.parse(raw);
      return all.filter(p => p.session_id === sessionId);
    } catch {
      return [];
    }
  }

  static async joinSession(
    sessionId: string,
    roomCode: string,
    displayName: string,
    deviceIdentifier: string
  ): Promise<Participant> {
    const existing = this.getParticipants(sessionId);
    let participant = existing.find(p => p.device_identifier === deviceIdentifier);

    if (!participant) {
      participant = {
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        session_id: sessionId,
        display_name: displayName,
        device_identifier: deviceIdentifier,
        score: 0,
        joined_at: new Date().toISOString(),
      };
      const allRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      const all: Participant[] = allRaw ? JSON.parse(allRaw) : [];
      all.push(participant);
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(all));
    } else {
      // Update display name if changed
      participant.display_name = displayName;
      const allRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      const all: Participant[] = allRaw ? JSON.parse(allRaw) : [];
      const idx = all.findIndex(p => p.id === participant!.id);
      if (idx >= 0) all[idx] = participant;
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(all));
    }

    // Broadcast local event
    const channel = this.getChannel(roomCode);
    if (channel) {
      channel.postMessage({ type: 'PARTICIPANT_JOINED', payload: participant });
    }

    // Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('participants').upsert({
          id: participant.id,
          session_id: sessionId,
          display_name: participant.display_name,
          device_identifier: participant.device_identifier,
          score: participant.score,
          joined_at: participant.joined_at,
        });
      } catch (err) {
        console.warn('Supabase joinSession error:', err);
      }
    }

    return participant;
  }

  // --- Responses & Scoring Operations ---
  static getResponses(sessionId: string, questionId?: string): ResponseRecord[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: ResponseRecord[] = JSON.parse(raw);
      return all.filter(r => r.session_id === sessionId && (!questionId || r.question_id === questionId));
    } catch {
      return [];
    }
  }

  static async submitResponse(
    session: Session,
    question: Question,
    participant: Participant,
    selectedOptions: number[] | string,
    elapsedSeconds: number
  ): Promise<ResponseRecord> {
    // Calculate scoring
    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    if (question.format === 'WORD_CLOUD') {
      isCorrect = null;
      pointsAwarded = 0;
    } else {
      const selected = Array.isArray(selectedOptions) ? selectedOptions : [];
      const correct = question.correct_options || [];

      // Check exact match
      const sortedSelected = [...selected].sort((a, b) => a - b);
      const sortedCorrect = [...correct].sort((a, b) => a - b);
      isCorrect = (
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((val, idx) => val === sortedCorrect[idx])
      );

      if (isCorrect) {
        if (session.entry_mode === 'group') {
          // Flat 100 points, zero speed bonuses
          pointsAwarded = 100;
        } else {
          // Individual: 100 base + 10 bonus if within first 50% of countdown timer
          pointsAwarded = 100;
          if (question.duration > 0 && elapsedSeconds <= (question.duration / 2)) {
            pointsAwarded += 10;
          }
        }
      }
    }

    const response: ResponseRecord = {
      id: 'resp-' + Math.random().toString(36).substring(2, 9),
      session_id: session.id,
      question_id: question.id,
      participant_id: participant.id,
      selected_options: selectedOptions,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      submitted_at: new Date().toISOString(),
    };

    // Save locally
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    let all: ResponseRecord[] = raw ? JSON.parse(raw) : [];
    // Allow updating choices before lock: filter out previous response for same question & participant
    all = all.filter(r => !(r.question_id === question.id && r.participant_id === participant.id));
    all.push(response);
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(all));

    // Update participant total score
    const pRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (pRaw) {
      const pAll: Participant[] = JSON.parse(pRaw);
      const targetP = pAll.find(p => p.id === participant.id);
      if (targetP) {
        // Recalculate participant total score
        const pResponses = all.filter(r => r.participant_id === participant.id);
        targetP.score = pResponses.reduce((sum, r) => sum + r.points_awarded, 0);
        localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(pAll));
      }
    }

    // Broadcast local event
    const channel = this.getChannel(session.room_code);
    if (channel) {
      channel.postMessage({ type: 'RESPONSE_SUBMITTED', payload: response });
    }

    // Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('responses').upsert({
          session_id: session.id,
          question_id: question.id,
          participant_id: participant.id,
          selected_options: selectedOptions,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
          submitted_at: response.submitted_at,
        }, {
          onConflict: 'question_id,participant_id'
        });

        // Update score in Supabase
        await supabase.from('participants').update({
          score: participant.score + pointsAwarded
        }).eq('id', participant.id);
      } catch (err) {
        console.warn('Supabase submitResponse error, queued locally:', err);
      }
    }

    return response;
  }

  // --- Hidden Words Moderation (Word Cloud) ---
  static getHiddenWords(questionId: string): string[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(HIDDEN_WORDS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: HiddenWord[] = JSON.parse(raw);
      return all.filter(h => h.question_id === questionId).map(h => h.word.toLowerCase());
    } catch {
      return [];
    }
  }

  static async hideWord(questionId: string, roomCode: string, word: string): Promise<void> {
    const normalized = word.trim().toLowerCase();
    const raw = localStorage.getItem(HIDDEN_WORDS_STORAGE_KEY);
    const all: HiddenWord[] = raw ? JSON.parse(raw) : [];
    if (!all.some(h => h.question_id === questionId && h.word === normalized)) {
      all.push({
        id: 'hw-' + Math.random().toString(36).substring(2, 9),
        question_id: questionId,
        word: normalized,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(HIDDEN_WORDS_STORAGE_KEY, JSON.stringify(all));
    }

    const channel = this.getChannel(roomCode);
    if (channel) {
      channel.postMessage({ type: 'WORD_HIDDEN', payload: { questionId, word: normalized } });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('hidden_words').upsert({
          question_id: questionId,
          word: normalized,
        }, { onConflict: 'question_id,word' });
      } catch (err) {
        console.warn('Supabase hideWord error:', err);
      }
    }
  }

  // --- Realtime Subscription Listener ---
  static subscribeToRoom(roomCode: string, callback: (event: { type: string; payload: any }) => void) {
    if (typeof window === 'undefined') return () => {};

    // 1. BroadcastChannel listener (Instant local & multi-tab)
    const channel = this.getChannel(roomCode);
    const localHandler = (e: MessageEvent) => {
      callback(e.data);
    };
    if (channel) {
      channel.addEventListener('message', localHandler);
    }

    // 2. Supabase Realtime channel listener (Sub-second cloud WebSockets)
    const supabase = getSupabaseClient();
    let supabaseChannel: any = null;
    if (supabase) {
      try {
        supabaseChannel = supabase
          .channel(`room_${roomCode}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
            callback({ type: 'SESSION_UPDATED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
            callback({ type: 'PARTICIPANT_JOINED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, (payload) => {
            callback({ type: 'RESPONSE_SUBMITTED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'hidden_words' }, (payload) => {
            callback({ type: 'WORD_HIDDEN', payload: payload.new });
          })
          .subscribe();
      } catch (e) {
        console.warn('Supabase Realtime subscribe error:', e);
      }
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', localHandler);
      }
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }
}
