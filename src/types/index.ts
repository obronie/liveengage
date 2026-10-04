export type QuestionFormat = 'MCQ' | 'MULTIPLE' | 'BINARY' | 'SCALE' | 'WORD_CLOUD';

export type SessionEntryMode = 'individual' | 'group';

export type SessionStatus = 'lobby' | 'question_active' | 'question_locked' | 'revealed' | 'completed';

export type DocumentType = 'curriculum' | 'eisa_specification' | 'learner_guide' | 'workbook' | 'model_answers';

export type CognitiveTargetLevel = 'foundational' | 'operational' | 'advanced';

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  is_qcto?: boolean;
  master_iac_mapping?: string;
  created_at: string;
  documents?: CourseDocument[];
  clusters?: CourseCluster[];
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

export interface CourseCluster {
  id: string;
  course_id: string;
  cluster_number: string; // e.g. "1", "2.4", "3.1"
  title: string;
  description?: string;
  eisa_focus_area?: string; // e.g. "Focus Area 1 (Receive Stock — 50%)"
  mapped_iacs?: string; // e.g. "KM-03-KT01, PM-01-PS01"
  weighting_percentage?: number; // e.g. 50
  recommended_question_count?: number; // e.g. 8 for 50% focus vs 4 for foundational
  created_at: string;
  question_sets?: QuestionSet[];
}

export interface QuestionSet {
  id: string;
  cluster_id: string;
  set_number?: number; // 1, 2, 3...
  title: string; // e.g. "Generic Standard Set" or "Spur - Montague Gardens"
  is_custom: boolean;
  is_fsa_mock?: boolean;
  client_name?: string; // e.g. "Spur Corporation" or "Generic Standard"
  eisa_focus_area?: string; // e.g. "Focus Area 1: Receiving Stock (50%)"
  // Persistent source notes kept for future reference
  raw_notebook_extract?: string;
  learner_guide_notes?: string;
  assessment_activities_notes?: string;
  practical_activities_notes?: string;
  custom_background_context?: string; // e.g. "Spur employees in Montague Gardens cold storage"
  target_level: CognitiveTargetLevel;
  default_entry_mode: SessionEntryMode;
  total_marks?: number; // Sum of marks for formal cluster assessment
  time_allowed_minutes?: number; // e.g. 30, 45, 60 minutes
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface SessionGroup {
  id: string;
  client_name: string;
  group_name: string; // e.g. "Cohort 1"
  created_at: string;
}

export interface Question {
  id: string;
  session_id?: string;
  question_order: number;
  format: QuestionFormat;
  body: string;
  additional_text?: string; // Workplace rationale & explanation displayed upon reveal
  options: string[];
  correct_options: number[]; // zero-based indexes
  duration: number; // 0 for untimed / manual lock
  marks?: number; // Mark allocation: 1 for recall, 2-3 for calculations / workplace scenarios
  guide_topic_hint?: string;
}

export interface Session {
  id: string;
  group_id?: string | null;
  course_id?: string | null;
  cluster_id?: string | null;
  question_set_id?: string | null;
  title: string;
  room_code: string;
  client_name?: string;
  cohort_number: number; // 1 to 10
  entry_mode: SessionEntryMode;
  status: SessionStatus;
  pacing_mode?: 'waiting_screen' | 'start_now';
  current_question_index: number;
  facilitator_instructions?: string;
  question_timer_end?: string | null; // ISO timestamp
  created_at: string;
  completed_at?: string | null;
  course?: Course;
  cluster?: CourseCluster;
  question_set?: QuestionSet;
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
  submitted_at: string; // ISO timestamp
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
  marks?: number;
  guideTopicHint?: string;
}

export interface GenerateQuestionsRequest {
  prompt?: string;
  model?: string; // default: 'gemini-3.8-flash'
  courseCode?: string;
  courseTitle?: string;
  clusterNumber?: string;
  clusterTitle?: string;
  courseContext?: string; // Curriculum framework text
  // Modular NotebookLM extracts
  rawNotebookExtract?: string;
  learnerGuideNotes?: string;
  assessmentActivitiesNotes?: string;
  practicalActivitiesNotes?: string;
  customBackground?: string; // e.g. Spur Montague Gardens
  isFsaMock?: boolean;
  questionCount?: number;
  targetLevel?: CognitiveTargetLevel;
  formats?: QuestionFormat[];
  apiKey?: string;
}
