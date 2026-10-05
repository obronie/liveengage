# LearnBlended Poll (LiveEngage) — Master Project Handover & Knowledge Transfer

**Last Updated**: October 2026  
**System Status**: Production build verified (0 errors), Next.js daemon running on `http://localhost:3000`.  
**Target Environment**: Windows, Node.js, Next.js 14 (App Router), Tailwind CSS, Lucide React, Supabase PostgreSQL + LocalStorage fallback.  
**Domain**: Occupational adult training engagement & formative assessment in South Africa (QCTO / SETA Framework, SAQA ID 99446 — Store Person / Dispatching & Receiving Clerk).  
**Git Remotes**:  
- `origin`: `https://github.com/obronie/liveengage.git`  
- `liveengageza`: `https://github.com/obronie/liveengageza.git`  

---

## 1. Executive Summary & Core Mission

**LearnBlended Poll (LiveEngage)** is a real-time, interactive classroom polling and formative assessment platform purpose-built for occupational workplace training. It solves the engagement, literacy, and compliance challenges in corporate occupational qualifications by:
1. **Bridging Official Curriculum & Daily Reality**: Translating bulky QCTO Knowledge Modules (KM), Practical Modules (PM), and Workplace Modules (WM) into bite-sized, gamified live poll sets.
2. **Dual-Audience Flexibility**: Providing **Generic Standard** question sets (aligned with national qualifications) and **Custom Workplace** question sets (grounded in client-specific distribution centers like Shoprite DC, Takealot, Bidvest, Spur, Imperial).
3. **Formative Assessment & Peer Review (FSA)**: Generating compact printable assessment papers and classroom projector model answers with step-by-step rubrics for peer marking.
4. **Offline Resilience & Zero-Cost AI**: Powered by Google's **Gemini 3.8 Flash** with zero-cost tier optimization and an authentic occupational question fallback pool.

---

## 2. System Architecture & Tech Stack

```
Particify Clone/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Auto-redirects to /courses
│   │   ├── courses/page.tsx             # Primary workspace: Course Library, Clusters, Question Editor & FSA Modal
│   │   ├── presenter/[roomCode]/page.tsx# Facilitator Live Big-Screen Projector Dashboard
│   │   ├── play/page.tsx                # Learner Mobile PIN Entry & Interactive Answering Screen
│   │   ├── play/[roomCode]/page.tsx     # Direct PIN routing wrapper
│   │   ├── history/page.tsx             # Audit Archive & Historical Session Reports
│   │   └── api/
│   │       ├── generate-questions/route.ts  # Calls Gemini AI with structured JSON schema
│   │       └── extract-document/route.ts    # Syllabus PDF/Word extraction endpoint
│   ├── components/
│   │   ├── Navbar.tsx                   # Top navigation with Quick Launch, Learner Screen, Settings
│   │   └── ui/                          # Button, Dialog, Card, Badge components
│   ├── lib/
│   │   ├── courseParser.ts              # Parses QCTO Master Mapping Tables into structured clusters
│   │   ├── gemini.ts                    # Gemini 3.8 Flash cascade, Cloze generation & normalizer
│   │   ├── store.ts                     # AppStore (Supabase cloud sync + localStorage fallback)
│   │   └── supabase.ts                  # Supabase client configuration
│   └── types/
│       └── index.ts                     # TypeScript interfaces (Course, Cluster, Question, Session, etc.)
├── HANDOVER_NOTES.md                    # This master knowledge transfer document
├── package.json
└── tailwind.config.ts
```

### Brand & Design Tokens:
- **Steel Blue Primary**: `#4682B4` (Learner Guide actions, headers, primary buttons)
- **Emerald Green Success**: `#6DC082` (Quick Launch Live, correct answers, generate button)
- **Soft Ice Tint**: `#D5E3EF` (Card borders, subtle backgrounds)
- **Off-White Tint**: `#F1F9F3` (Custom workplace tags, positive feedback)
- **High-Contrast Badges**: Question format badges (`Single Choice (MCQ)`, `Multiple Choice`, `True / False`, `Fill in the Gap (Cloze)`, `Scale 1–5`, `Word Cloud`).

---

## 3. Key Capabilities & Recent Deliverables

### A. Question Formats & "Fill in the Gap" (Cloze with Word Bank)
- **Question Formats Supported**:
  - `MCQ`: Single choice (4 options).
  - `MULTIPLE`: Multiple correct choices (checkbox style).
  - `BINARY`: True / False scenario questions.
  - `CLOZE`: Fill in the gap with Word Bank.
  - `SCALE`: 1 to 5 rating / confidence scale.
  - `WORD_CLOUD`: Open-ended keyword submissions with live word cloud & 1-click moderation.
- **Cloze Question Architecture**:
  - **Passage Text**: Gaps marked as `[1]`, `[2]`, `[3]`.
  - **Word Bank**: Displayed above the text with selectable workplace terms (including distractors).
  - **Interactive Mobile Answering**: Learners tap words from the Word Bank to place into gap slots `Gap [1]`, `Gap [2]`, and can tap `✕` to clear and re-assign words.
  - **Question Set Editor**: Format dropdown allows selecting "Fill in the Gap (Cloze)", with interactive Word Bank term add/remove inputs and Gap-to-Word mapping selectors.
  - **Database Constraint Workaround**: Supabase PostgreSQL table `questions` has a check constraint `questions_format_check` strictly allowing `('MCQ', 'MULTIPLE', 'BINARY', 'SCALE', 'WORD_CLOUD')`. Cloze questions are saved with `format: 'MULTIPLE'` and encoded as `guide_topic_hint: 'CLOZE::...'` when written to Supabase, and transparently decoded back to `format: 'CLOZE'` when retrieved. JSONB in `question_sets` stores `CLOZE` natively.
  - **Proportional Scoring**: Evaluates positional gap matches in `submitResponse` and awards proportional marks for partial matches.

### B. Paper-Saving FSA PDF / Printout (~50–60% Paper Reduction)
- **Ultra-Compact Header**:
  - **Line 1**: Course code, title, and cluster title on left with total marks and time allowed on right.
  - **Line 2**: 1-line peer review strip: `Learner Name: _____ | Checked By (Peer): _____ | Score: _____ / {totalMarks}`.
  - **Line 3**: 1-line compact instructions banner.
- **2-Column Options Grid**:
  - `MCQ` & `MULTIPLE` options render in a 2-column grid (`.question-options-grid`), cutting vertical space in half.
  - True/False (`BINARY`) options render inline on a single line.
- **Compact Calculation Space**: Math/variance questions render a compact 1-line dotted working area.
- **Print CSS**: `@page { size: A4 portrait; margin: 6mm 10mm 6mm 10mm; }` with tight `5px` margins, fitting **5–6 questions per page** and allowing a **10-question assessment to fit on a single double-sided sheet**.
- **Three Viewing Modes**:
  1. 📝 **Printable Paper**: Clean write-in blanks `(1) _______________________` for student completion.
  2. 📺 **Projector Mode**: Classroom display with high-contrast model answers and step-by-step peer marking rubrics.
  3. 🟢 **Memorandum**: Official assessor marking guide with verified answers and rubrics.

### C. Session Timing Modes (Guaranteed Consistency)
Three distinct timing modes are supported across question generation, editing, presentation, and mobile:
1. **Overall Time**: e.g., 20-minute total session clock for the entire question set.
2. **Per-Question**: Standard 30s/45s/60s/90s/120s timer per question.
3. **Untimed / Manual**: Facilitator-paced manual progression with no auto-locking countdown.
- **Timing Guarantee**: Fixed the issue where overall or untimed sessions previously fell back to 45s/60s per question upon question changes, unlocks, or reconnections.
  - Presenter screen displays persistent overall countdown with `Overall Time` badge, or `Untimed • Manual Pace`.
  - Mobile screen displays synchronized overall countdown or `♾️ Untimed`.

### D. Card Ordering & Question Set Editing
- **Cluster Card Hierarchy**:
  1. Generic Presentation Card (displayed first).
  2. FSA Mock Exam Card (displayed second).
  3. Custom Workplace Cards (displayed alphabetically).
- **In-Place Settings Editor (`Edit3` pen icon)**:
  - Enables editing question set title, client name, timing mode (Overall, Per-Question, Untimed), duration, entry mode (Group vs Individual), and target cognitive level without needing to regenerate.

### E. Mobile Participant Experience & Review Mode
- **Persistent Reconnection**: Local device ID and room participant cache ensure learners locking their phone, switching tabs, or sleeping their device do NOT get thrown back to the name entry screen.
- **Learner Review Mode**: After all questions are completed and the facilitator clicks "Reveal Results", learners can review all questions on mobile by tapping tabs `Q1`, `Q2`, etc., seeing their selected choices vs. the correct answer, points awarded, and workplace rationale.
- **Synchronized Leaderboard & Celebratory Fireworks**: When the facilitator triggers scores (`[S]` or Scores button), scores appear on mobile screens. If the learner or group is #1, confetti fireworks fire on their phone screen.
- **Clean Group/Individual Entry**: T1–T10 buttons removed; participants type their group or learner name freely.

---

## 4. QCTO Master Mapping & Gemini Prompt Engine

The platform integrates with **NotebookLM** and **Gemini 3.8 Flash**:
- Facilitators paste the QCTO Master Mapping Table (Markdown table) during course creation to auto-create all canonical clusters in one shot, with calculated weighting percentages and recommended question counts.
- `+ Generate Set` copies structured prompts tailored to the active cluster and custom operational DC context.

---

## 5. Development & Deployment Reference

### Running the App Locally:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build

# Start production server (runs on port 3000)
npm run start
```

### Git Remotes & Pushing:
```bash
git add -A
git commit -m "your message"
git push origin main
git push liveengageza main
```

---

## 6. Prompt to Paste into a New Chat

Copy and paste the exact block below to initialize the next chat session seamlessly:

```markdown
Hello! I am continuing development on LearnBlended Poll (LiveEngage), an interactive classroom polling and formative assessment platform for occupational workplace training (QCTO Framework, SAQA ID 99446).

Please read HANDOVER_NOTES.md in the root directory for full context on architecture, database constraints, brand tokens, and completed milestones.

### Current System Status:
- Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React, Supabase + LocalStorage.
- Production build passes with 0 errors (`npm run build`).
- Git remotes: `origin` and `liveengageza` (both on branch `main`).
- Recent additions:
  1. Paper-Saving FSA Printout/PDF (50-60% paper reduction, 2-column MCQ grid, compact 1-line header).
  2. "Fill in the Gap" (Cloze with Word Bank) question format on Mobile, Projector, Paper, Memo, and Editor.
  3. Supabase PostgreSQL check constraint protection for Cloze questions (`guide_topic_hint: 'CLOZE::...'`).
  4. Timing mode consistency (Overall, Per-Question, Untimed) with zero fallback to 45s across Navbar & Course launches.
  5. Mobile reconnection persistence, answer review mode, and #1 winner fireworks.
  6. Classroom Live Delivery Milestones:
     - MULTIPLE Scoring: 75 pts/correct option, -75 wrong penalty (min 0), +50 bonus if all correct, amber "Partially Correct" header.
     - Cumulative Score Fix: True sum recalculation across session responses in Supabase & mobile state.
     - Projector Fit-to-Display: Zero scrollbar cut-off, pinned header and controls bar (`shrink-0`), scroll-contained debrief card (`max-h-[26vh]`).
     - Blind Auto-Advance: Auto-forwards to next question without revealing answers once all participants complete, with countdown banner & toggle.
     - Persistent Reveal Mode: Facilitator review stays revealed across Next/Prev navigation until explicitly toggled off.
     - Realtime Response Deserialization: Projector option bars accurately display participant percentages and counts.

I am ready to proceed with the next task.
```
