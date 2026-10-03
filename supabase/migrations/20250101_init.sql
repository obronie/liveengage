-- LiveEngage / LearnBlended Poll - Supabase Database Schema Migration
-- Enables real-time pub/sub, tables, relations, and RLS policies

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. COURSE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.course_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('curriculum', 'learner_guide', 'workbook', 'model_answers')),
    file_name TEXT NOT NULL,
    storage_path TEXT,
    extracted_text TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. SESSION GROUPS (Cohorts & Clients)
CREATE TABLE IF NOT EXISTS public.session_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.session_groups(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    room_code VARCHAR(6) UNIQUE NOT NULL,
    entry_mode TEXT NOT NULL DEFAULT 'group' CHECK (entry_mode IN ('individual', 'group')),
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'question_active', 'question_locked', 'revealed', 'completed')),
    current_question_index INTEGER DEFAULT 0 NOT NULL,
    facilitator_instructions TEXT,
    question_timer_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    question_order INTEGER NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('MCQ', 'MULTIPLE', 'BINARY', 'SCALE', 'WORD_CLOUD')),
    body TEXT NOT NULL,
    additional_text TEXT,
    options JSONB DEFAULT '[]'::jsonb NOT NULL,
    correct_options JSONB DEFAULT '[]'::jsonb NOT NULL,
    duration INTEGER DEFAULT 60 NOT NULL, -- 0 indicates untimed / manual lock
    guide_topic_hint TEXT
);

-- 6. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT NOT NULL,
    device_identifier TEXT NOT NULL,
    score INTEGER DEFAULT 0 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_session_device UNIQUE (session_id, device_identifier)
);

-- 7. RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    selected_options JSONB NOT NULL,
    is_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0 NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_question_participant UNIQUE (question_id, participant_id)
);

-- 8. HIDDEN WORDS (Word Cloud Facilitator Moderation)
CREATE TABLE IF NOT EXISTS public.hidden_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_question_hidden_word UNIQUE (question_id, word)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON public.sessions (room_code);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON public.questions (session_id, question_order);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON public.participants (session_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON public.responses (session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses (question_id);
CREATE INDEX IF NOT EXISTS idx_course_documents_course_id ON public.course_documents (course_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_words ENABLE ROW LEVEL SECURITY;

-- Allow public access for easy training-room operation without login barriers
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access courses" ON public.courses;
    CREATE POLICY "Public access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access course_documents" ON public.course_documents;
    CREATE POLICY "Public access course_documents" ON public.course_documents FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access session_groups" ON public.session_groups;
    CREATE POLICY "Public access session_groups" ON public.session_groups FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access sessions" ON public.sessions;
    CREATE POLICY "Public access sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access questions" ON public.questions;
    CREATE POLICY "Public access questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access participants" ON public.participants;
    CREATE POLICY "Public access participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access responses" ON public.responses;
    CREATE POLICY "Public access responses" ON public.responses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access hidden_words" ON public.hidden_words;
    CREATE POLICY "Public access hidden_words" ON public.hidden_words FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Enable Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'questions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'hidden_words'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hidden_words;
    END IF;
END $$;
