export type QuestionFormat = 'MCQ' | 'MULTIPLE' | 'BINARY' | 'SCALE' | 'WORD_CLOUD';

export type SessionEntryMode = 'individual' | 'group';

export type SessionStatus = 'lobby' | 'question_active' | 'question_locked' | 'revealed' | 'completed';

export type DocumentType = 'curriculum' | 'learner_guide' | 'workbook' | 'model_answers';

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  created_at: string;
  documents?: CourseDocument[];
}

export interface CourseDocument {
  id: string;
  course_id: string;
  doc_type: DocumentType;
  file_name: string;
  storage_path?: string;
  extracted_text?: string;
  uploaded_at: string;
}

export interface SessionGroup {
  id: string;
  client_name: string;
  group_name: string;
  created_at: string;
}

export interface Question {
  id: string;
  session_id?: string;
  question_order: number;
  format: QuestionFormat;
  body: string;
  additional_text?: string;
  options: string[];
  correct_options: number[]; // zero-based indexes
  duration: number; // 0 for untimed / manual lock
  guide_topic_hint?: string;
}

export interface Session {
  id: string;
  group_id?: string | null;
  course_id?: string | null;
  title: string;
  room_code: string;
  entry_mode: SessionEntryMode;
  status: SessionStatus;
  pacing_mode?: 'waiting_screen' | 'start_now';
  current_question_index: number;
  facilitator_instructions?: string;
  question_timer_end?: string | null; // ISO timestamp
  created_at: string;
  course?: Course;
  group?: SessionGroup;
  questions?: Question[];
  participants?: Participant[];
}

export interface Participant {
  id: string;
  session_id: string;
  display_name: string;
  device_identifier: string;
  score: number;
  joined_at: string;
}

export interface ResponseRecord {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  selected_options: number[] | string; // array of indexes or word cloud submission
  is_correct?: boolean | null;
  points_awarded: number;
  submitted_at: string;
}

export interface HiddenWord {
  id: string;
  question_id: string;
  word: string;
  created_at: string;
}

// AI Question Generator payload format
export interface AIGeneratedQuestion {
  format: QuestionFormat;
  body: string;
  additionalText: string;
  options: string[];
  correctOptions: number[];
  duration: number;
  guideTopicHint?: string;
}

export interface GenerateQuestionsRequest {
  prompt: string;
  courseContext?: string;
  docType?: DocumentType;
  questionCount?: number;
  formats?: QuestionFormat[];
  apiKey?: string;
}
