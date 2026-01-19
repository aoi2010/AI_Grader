# AI Grader - React Architecture Visual Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI GRADER - REACT FRONTEND                            │
│                     http://localhost:3000                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │          App.jsx (Router)             │
                │    - Screen-based navigation          │
                └───────────────────┬───────────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬────────────┐
        ▼               ▼           ▼           ▼            ▼
   SetupScreen    ExamReadyScreen ExamScreen SubmissionScreen EvaluationScreen
   (Create)       (Ready)         (Answer)   (Upload)        (Results)
        │               │           │           │            │
        └───────────────┴───────────┴───────────┴────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │      Shared Components        │
                    ├───────────────────────────────┤
                    │  • QuestionDisplay            │
                    │  • QuestionNavigator          │
                    │  • AnswerInput                │
                    │  • PDFUpload                  │
                    │  • Timer                      │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐           ┌──────────────┐
│ Custom Hooks │          │   Zustand    │           │  API Service │
├──────────────┤          │    Store     │           ├──────────────┤
│ • useTimer   │◄─────────┤examStore.js  │──────────►│ • examAPI    │
│ • useMathJax │          │              │           │ • answerAPI  │
└──────────────┘          │ Global State │           │ • evalAPI    │
                          └──────────────┘           └──────┬───────┘
                                                            │
                                                            ▼
                                                   ┌────────────────┐
                                                   │  Vite Proxy    │
                                                   │  /api → :8000  │
                                                   └────────┬───────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                                   │
│                    http://127.0.0.1:8000                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Routers → Database → Gemini Service → Google AI                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
App
├── SetupScreen
│   ├── Form inputs
│   ├── Syllabus upload
│   └── Submit button
│
├── ExamReadyScreen
│   ├── Exam details
│   ├── Instructions
│   └── Start button
│
├── ExamScreen ⭐ (Most Complex)
│   ├── Header
│   │   ├── Exam title
│   │   ├── Timer
│   │   └── Action buttons
│   ├── Main Content
│   │   ├── QuestionDisplay
│   │   │   ├── Question text (Markdown + LaTeX)
│   │   │   ├── MCQ options
│   │   │   └── OR question
│   │   ├── AnswerInput
│   │   │   ├── Textarea
│   │   │   └── Live preview
│   │   ├── PDFUpload
│   │   │   ├── File input
│   │   │   └── Uploaded files
│   │   └── Navigation buttons
│   └── Sidebar
│       └── QuestionNavigator
│           └── Question grid
│
├── SubmissionScreen
│   ├── Final PDF upload
│   └── Submit button
│
└── EvaluationScreen
    ├── Summary stats
    ├── Evaluation report
    └── Download buttons
```

## Data Flow

```
User Action → Component → API Service → Backend → Database/AI → Response → Component → UI Update
```

## File Structure

```
frontend-react/
├── src/
│   ├── App.jsx                      # Screen router
│   ├── main.jsx                     # Entry point
│   ├── index.css                    # Global styles
│   ├── screens/                     # 5 main screens
│   │   ├── SetupScreen.jsx
│   │   ├── ExamReadyScreen.jsx
│   │   ├── ExamScreen.jsx           # Largest component
│   │   ├── SubmissionScreen.jsx
│   │   └── EvaluationScreen.jsx
│   ├── components/                  # 5 reusable components
│   │   ├── QuestionDisplay.jsx
│   │   ├── QuestionNavigator.jsx
│   │   ├── AnswerInput.jsx
│   │   ├── PDFUpload.jsx
│   │   └── Timer.jsx
│   ├── services/
│   │   └── api.js                   # API layer
│   ├── store/
│   │   └── examStore.js             # Zustand state
│   ├── hooks/
│   │   ├── useTimer.js
│   │   └── useMathJax.js
│   └── utils/
│       └── formatTime.js
├── package.json
├── vite.config.js
└── index.html
```

---

**Visual guide to understand the React application architecture**
