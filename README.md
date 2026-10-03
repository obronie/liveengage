# LiveEngage / LearnBlended Poll

A lean, purpose-built, real-time live polling, quiz, and classroom engagement platform designed for adult workplace training and corporate facilitation (up to 20 learners or table groups).

LiveEngage completely replaces the fragmented legacy workflow of Google AI Studio, intermediate Google Sheets, custom Apps Script macros, and Particify.

---

## 🌟 Key Features

1. **Persistent Course Library & Document Ingestion**
   - Upload curriculum frameworks, learner guides, workbooks, and model answers once per course module (`.pdf`, `.docx`, `.txt`).
   - Text is parsed and stored for automatic interrogation by AI.

2. **Google Gemini AI Question Generator**
   - Native integration with Gemini API utilizing **Structured Outputs** (`responseSchema`).
   - System prompts calibrated for occupational curriculum design.
   - Strictly frames questions to reference the learner guide without providing explicit page numbers, driving authentic index and heading search navigation.

3. **In-App Review Grid**
   - Card-based editor to adjust question stems, option choices, correct toggles, timers, and explanatory rationale (`additional_text`).
   - Supports 5 core formats: **Single Choice (MCQ)**, **Multiple Choice (Select all)**, **Binary (True/False)**, **Rating Scale (1–5)**, and **Word Cloud**.

4. **High-Contrast Presenter Screen (Projector & MS Teams Mode)**
   - High-contrast, projection-ready dark interface.
   - Lobby with 6-digit room PIN and dynamic QR code (`qrcode.react`).
   - Massive countdown timer digits (e.g., `01:45`) centered with full-width progress bar dynamically shifting **Green ➔ Amber ➔ Red**.
   - Synchronized correct answer reveal, animated bar chart distributions, and explanation cards.
   - Dynamic Word Cloud with **1-click "Click-to-Hide" presenter moderation**.

5. **Participant Mobile Web App (PWA)**
   - Progressive Web App with service worker caching for resilience against spotty training room Wi-Fi and load shedding.
   - **Strict Identity Gate**:
     - *Group Mode*: Mandatory team name prompt every session (e.g. "Table 1"). Never assumes device identity from prior cohorts, solving Particify's shared tablet caching flaw.
     - *Individual Mode*: Remembers learner name with a quick 1-tap "Switch User" option.
   - **Blind Review Answering State**: Learners can adjust choices freely while the timer runs without seeing correct/incorrect indicators.
   - **Learner Guide Nudges**:
     - Screen banner: *"📖 Look inside your Learner Guide for this answer!"*
     - Playful confirmation upon tap: *"Submitted, was the learner guide used in this answer? I wonder :-)"*
   - Automatic cache clearance upon session conclusion for shared training room tablets.

6. **Dual Realtime Engine (Zero-Config Local + Cloud Supabase)**
   - Immediate out-of-the-box local operation using `BroadcastChannel` and `localStorage` (test multiple windows/tabs immediately without cloud setup).
   - Instant cloud synchronization when connected to Supabase Realtime WebSockets.

---

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Presenter & Participant URLs
- **Facilitator / Session Builder**: [http://localhost:3000](http://localhost:3000)
- **Course Library**: [http://localhost:3000/courses](http://localhost:3000/courses)
- **Participant Mobile View**: [http://localhost:3000/play](http://localhost:3000/play)
- **Session History & Archive**: [http://localhost:3000/history](http://localhost:3000/history)

---

## 🗄️ Supabase Cloud Database Setup

To enable cloud-wide synchronization across external phones and tablets:

1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/migrations/20250101_init.sql`](file:///c:/Users/Owner/antigravity/Particify%20Clone/supabase/migrations/20250101_init.sql) and execute the SQL script.
   - Creates the 8 relational tables (`courses`, `course_documents`, `session_groups`, `sessions`, `questions`, `participants`, `responses`, `hidden_words`).
   - Sets up Row Level Security (RLS) policies.
   - Adds tables to the `supabase_realtime` publication.
4. Copy your project **URL** and **Anon Key** from *Project Settings ➔ API*.
5. Either add them to `.env.local` or click the **Settings ⚙️** icon in the LiveEngage top bar to save them in-app.

---

## 🤖 Google Gemini API Configuration

1. Obtain an API Key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Or click the **Settings ⚙️** button in the app navigation to configure it directly in your browser.
3. When generating questions, Gemini automatically structures questions according to the strict occupational assessment schema with Learner Guide prompts.

---

## 📦 Tech Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom projection-ready dark tokens
- **Real-Time Pub/Sub**: Supabase Realtime WebSockets + BroadcastChannel local fallback
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.5-flash`) with Structured Outputs
- **Document Ingestion**: `pdf-parse` (PDF) & `mammoth` (DOCX)
- **PWA & Offline**: Custom Service Worker + Web App Manifest
- **Icons & Graphics**: Lucide Icons + `qrcode.react` + `canvas-confetti`
