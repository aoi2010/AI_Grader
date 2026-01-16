# AI GRADER - SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI GRADER SYSTEM ARCHITECTURE                       │
│                     Indian Board Exam System (CBSE/ICSE/WBBSE)              │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         index.html (5 Screens)                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Setup   │→ │Instructions│→ │   Exam   │→ │Submission│→ │Evaluation│ │  │
│  │  │  Screen  │  │  Screen   │  │  Screen  │  │  Screen  │  │  Screen  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                            styles.css                                    │  │
│  │  • Responsive Design  • Color-Coded Timer  • Live Preview Styling       │  │
│  │  • Mobile-Friendly    • Accessibility     • Modern UI/UX                │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         app.js (Frontend Logic)                          │  │
│  │  • API Integration        • MathJax Rendering    • Sequential Validation│  │
│  │  • Timer Management       • PDF Upload          • State Persistence     │  │
│  │  • Live LaTeX Preview     • Error Handling      • Screen Management     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    MathJax 3 (CDN - LaTeX Rendering)                     │  │
│  │  • Inline Math ($...$)    • Display Math ($$...$$)   • Live Rendering   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                     ↕ HTTP/HTTPS
┌───────────────────────────────────────────────────────────────────────────────┐
│                               BACKEND LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    main.py (FastAPI Application)                         │  │
│  │  • CORS Middleware    • Static File Serving    • Router Registration    │  │
│  │  • Health Check       • Database Init          • Error Handling          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         API ROUTERS (3 modules)                          │  │
│  │                                                                           │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐ │  │
│  │  │   exam.py            │  │   answer.py          │  │ evaluation.py  │ │  │
│  │  ├──────────────────────┤  ├──────────────────────┤  ├────────────────┤ │  │
│  │  │ • create_exam        │  │ • save_answer        │  │ • evaluate     │ │  │
│  │  │ • start_exam         │  │ • upload_pdf         │  │ • get_report   │ │  │
│  │  │ • get_current_question│ │ • get_files         │  │ • get_summary  │ │  │
│  │  │ • next_question      │  │ • final_upload       │  │ • full_paper   │ │  │
│  │  │ • submit_exam        │  │                      │  │                │ │  │
│  │  │ • timer_state        │  │                      │  │                │ │  │
│  │  └──────────────────────┘  └──────────────────────┘  └────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      BUSINESS LOGIC & SERVICES                           │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │              gemini_service.py (AI Integration)                  │   │  │
│  │  ├──────────────────────────────────────────────────────────────────┤   │  │
│  │  │  • generate_question_paper()                                     │   │  │
│  │  │    - Board-specific prompts (CBSE/ICSE/WBBSE)                  │   │  │
│  │  │    - Class-wise patterns (6-8, 9-10, 11-12)                    │   │  │
│  │  │    - LaTeX-enabled questions                                    │   │  │
│  │  │    - JSON parsing & validation                                  │   │  │
│  │  │                                                                  │   │  │
│  │  │  • evaluate_exam()                                              │   │  │
│  │  │    - Step-wise evaluation logic                                │   │  │
│  │  │    - LaTeX preservation                                        │   │  │
│  │  │    - PDF reference awareness                                   │   │  │
│  │  │    - Board-style feedback                                      │   │  │
│  │  │    - No hallucination enforcement                             │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                 config.py (Configuration)                        │   │  │
│  │  ├──────────────────────────────────────────────────────────────────┤   │  │
│  │  │  • Settings (Pydantic)                                          │   │  │
│  │  │  • BOARD_PATTERNS (3 boards × 3 class ranges)                  │   │  │
│  │  │  • get_board_pattern()                                         │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      DATA LAYER (SQLAlchemy ORM)                         │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                    models.py (Database Models)                   │   │  │
│  │  ├──────────────────────────────────────────────────────────────────┤   │  │
│  │  │  User          → Student information                            │   │  │
│  │  │  Exam          → Exam sessions (state machine)                  │   │  │
│  │  │  Question      → Generated questions (LaTeX-safe)               │   │  │
│  │  │  Answer        → Student responses (LaTeX preserved)            │   │  │
│  │  │  UploadedFile  → PDF references (multi-upload)                  │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                schemas.py (Pydantic Schemas)                     │   │  │
│  │  ├──────────────────────────────────────────────────────────────────┤   │  │
│  │  │  Request Models:  ExamCreateRequest, AnswerSaveRequest, etc.    │   │  │
│  │  │  Response Models: ExamResponse, QuestionResponse, etc.          │   │  │
│  │  │  Validation:      Email, class range, file types                │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                database.py (DB Configuration)                    │   │  │
│  │  ├──────────────────────────────────────────────────────────────────┤   │  │
│  │  │  • Engine creation   • Session management   • Dependency inject  │   │  │
│  │  └──────────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                     ↕
┌───────────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │              SQLite Database (PostgreSQL-ready schema)                   │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────────┐   │  │
│  │  │ users  │─<│ exams  │─<│questions│ │answers │─<│ uploaded_files │   │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────────────┘   │  │
│  │       │          │            │           │               │              │  │
│  │    One User  Many Exams  Many Qs   Many Ans    Many PDFs per Answer     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         File Storage (uploads/)                          │  │
│  │  • PDF answer sheets   • Organized by exam_id   • Unique filenames      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                     ↕
┌───────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Google Gemini API (AI Service)                        │  │
│  │  • Question Generation   • Exam Evaluation   • Context-aware responses  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════════
                              DATA FLOW DIAGRAMS
════════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────────┐
│  FLOW 1: EXAM CREATION                                                        │
└──────────────────────────────────────────────────────────────────────────────┘

Student → Setup Form → POST /api/exam/create
                            ↓
                       Validate Input (board, class, subject)
                            ↓
                       Get/Create User in DB
                            ↓
                       Get Board Pattern (config.py)
                            ↓
                  Call Gemini API (generate_question_paper)
                            ↓
                       Parse JSON Response
                            ↓
                       Create Exam Record
                            ↓
                  Create Question Records (all questions)
                            ↓
                  Return Exam Details → Student


┌──────────────────────────────────────────────────────────────────────────────┐
│  FLOW 2: SEQUENTIAL ANSWERING                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

Student → POST /api/exam/start
              ↓
          Set status = IN_PROGRESS, Start timer
              ↓
Student ← GET /api/exam/{id}/current (Question 1)
              ↓
          Type answer with LaTeX OR Upload PDF
              ↓
          POST /api/answer/save
              ↓
          Validate: Is this the CURRENT question? ✓
              ↓
          Save answer (LaTeX preserved)
              ↓
          Enable "Next" button
              ↓
Student → POST /api/exam/{id}/next
              ↓
          Validate: Is current question answered? ✓
              ↓
          Increment current_question_index
              ↓
Student ← GET /api/exam/{id}/current (Question 2)
              ↓
          [Repeat until all questions answered]
              ↓
          Show Submission Screen


┌──────────────────────────────────────────────────────────────────────────────┐
│  FLOW 3: EVALUATION                                                           │
└──────────────────────────────────────────────────────────────────────────────┘

Student → POST /api/exam/{id}/submit
              ↓
          Lock all answers (is_locked = True)
              ↓
          Set status = SUBMITTED
              ↓
Student → POST /api/evaluation/evaluate
              ↓
          Gather all questions + answers
              ↓
          Format data for Gemini:
            • Question text (with LaTeX)
            • Typed answers (raw LaTeX)
            • Selected options (MCQ)
            • PDF upload counts
              ↓
          Call Gemini API (evaluate_exam)
              ↓
          Receive evaluation report
              ↓
          Store report in DB
              ↓
          Set status = EVALUATED
              ↓
Student ← Display Report + Summary


════════════════════════════════════════════════════════════════════════════════
                           STATE MACHINE: EXAM STATUS
════════════════════════════════════════════════════════════════════════════════

    ┌─────────────┐
    │   CREATED   │  ← Exam generated, questions created
    └──────┬──────┘
           │ POST /exam/start
           ↓
    ┌─────────────┐
    │ IN_PROGRESS │  ← Student answering questions
    └──────┬──────┘
           │ POST /exam/submit OR timeout
           ↓
    ┌─────────────┐
    │  SUBMITTED  │  ← Answers locked, awaiting evaluation
    └──────┬──────┘
           │ POST /evaluation/evaluate
           ↓
    ┌─────────────┐
    │  EVALUATED  │  ← Report generated, final state
    └─────────────┘


════════════════════════════════════════════════════════════════════════════════
                         SEQUENTIAL ANSWERING ENFORCEMENT
════════════════════════════════════════════════════════════════════════════════

Database: exam.current_question_index = N (0-based)

┌─────────────────────────────────────────────────────────────────────────────┐
│  VALIDATION RULES                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Can only view question at index N                                       │
│  2. Can only save answer for question at index N                            │
│  3. To increment N → N+1:                                                   │
│     • Question N MUST have:                                                 │
│       - Typed answer (non-empty) OR                                         │
│       - Selected MCQ option OR                                              │
│       - Uploaded PDF file                                                   │
│  4. Cannot decrement (no going back)                                        │
│  5. Page refresh → loads question at index N (state preserved)              │
│  6. Direct API calls to skip → 400 error                                    │
└─────────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════════
                              LATEX HANDLING PIPELINE
════════════════════════════════════════════════════════════════════════════════

Student Types: "The solution is $x = \frac{a}{b}$"
      ↓
Frontend: Stores in <textarea> (backslashes intact)
      ↓
Live Preview: MathJax renders in preview div
      ↓
POST /api/answer/save with JSON: {"typed_answer": "The solution is $x = \\frac{a}{b}$"}
      ↓
Backend: Receives with escaped backslashes (JSON encoding)
      ↓
Database: Stores RAW text: "The solution is $x = \frac{a}{b}$"
      ↓
GET /api/exam/{id}/current → Returns JSON: {"typed_answer": "The solution is $x = \\frac{a}{b}$"}
      ↓
Frontend: Receives, unescapes, renders via MathJax
      ↓
Evaluation: Gemini receives RAW LaTeX, preserves all backslashes
      ↓
ZERO DATA LOSS ✓


════════════════════════════════════════════════════════════════════════════════
                            SECURITY LAYERS
════════════════════════════════════════════════════════════════════════════════

1. Input Validation (Pydantic schemas)
   └→ Email format, class range, file types

2. Sequential Enforcement (Backend)
   └→ Cannot skip questions, cannot answer out of order

3. File Upload Validation
   └→ PDF only, size limits, virus scanning (optional)

4. Answer Locking
   └→ Post-submission, answers immutable

5. CORS Configuration
   └→ Restrict origins in production

6. Database Constraints
   └→ Foreign keys, unique constraints, NOT NULL

7. Environment Variables
   └→ API keys not in code


════════════════════════════════════════════════════════════════════════════════
                         PERFORMANCE CHARACTERISTICS
════════════════════════════════════════════════════════════════════════════════

Question Generation:    30-60 seconds (Gemini API)
Answer Save:           <100ms (database write)
PDF Upload:            <1 second (10MB file)
Timer Update:          <50ms (database read/write)
Evaluation:            30-60 seconds (Gemini API)
Page Load:             <500ms (static files + API call)


════════════════════════════════════════════════════════════════════════════════
                              DEPLOYMENT TOPOLOGY
════════════════════════════════════════════════════════════════════════════════

                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│ (Optional)
                    │   / HTTPS    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
       ┌──────▼───────┐         ┌──────▼───────┐
       │  App Server  │         │  App Server  │  (Horizontal Scale)
       │   (Gunicorn) │         │   (Gunicorn) │
       └──────┬───────┘         └──────┬───────┘
              │                         │
              └────────────┬────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └──────────────┘

              ┌──────────────┐
              │ File Storage │ (Shared NFS or S3)
              │   (uploads/) │
              └──────────────┘


════════════════════════════════════════════════════════════════════════════════
                            TECHNOLOGY DECISIONS
════════════════════════════════════════════════════════════════════════════════

FastAPI         → Modern, async, type-safe, auto-docs
SQLAlchemy      → ORM flexibility, PostgreSQL migration
Pydantic        → Request/response validation
Vanilla JS      → No build step, lightweight, direct control
MathJax         → Industry standard for LaTeX
Gemini          → Long context, instruction following
SQLite          → Zero-config development, prod-ready with PostgreSQL swap
