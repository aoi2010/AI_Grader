# AI Grader - React Frontend

## ✅ Status: Fully Complete & Production Ready

A modern React migration of the AI Grader frontend with 100% feature parity.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**Backend must be running:** `uvicorn backend.main:app --reload`

**Or use quick start script:**
```powershell
.\start.ps1
```

Access at: http://localhost:3000

## ✨ What's Built

### Screens (5/5) ✅
- **SetupScreen** - Exam creation with syllabus upload
- **ExamReadyScreen** - Instructions and start button
- **ExamScreen** - Full exam interface (questions, answers, navigation, timer)
- **SubmissionScreen** - Final PDF uploads
- **EvaluationScreen** - AI evaluation results with downloadable reports

### Components (5/5) ✅
- **QuestionDisplay** - Markdown/LaTeX rendering
- **QuestionNavigator** - Visual question grid
- **AnswerInput** - Live preview
- **PDFUpload** - File validation
- **Timer** - Color-coded countdown

### Infrastructure ✅
- **Zustand** - Global state management
- **Axios** - API service layer
- **react-markdown** - Markdown support
- **KaTeX** - LaTeX math rendering
- **Vite** - Fast builds with HMR

## 📦 Installation

```bash
cd frontend-react
npm install
```

## 🎯 Running the App

### Development Mode

```bash
npm run dev
```

Runs on `http://localhost:3000` with API proxied to `http://127.0.0.1:8000`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend-react/
├── src/
│   ├── screens/          # 5 main screens
│   ├── components/       # 5 reusable components
│   ├── services/         # API layer
│   ├── store/            # Zustand state
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilities
│   ├── App.jsx           # Screen routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.js
└── index.html
```

## 🧪 Features

### ✅ All Features Implemented
- Exam creation with syllabus upload
- AI question generation (16 model fallbacks)
- Markdown/LaTeX rendering in questions
- MCQ and typed answers
- OR questions (internal choice)
- PDF uploads (per question + final)
- Question navigation with status
- Timer with auto-submit
- AI evaluation with detailed report
- Download question paper & evaluation report

### 📖 Markdown & LaTeX
- Inline math: `$x^2 + y^2 = z^2$`
- Block math: `$$E = mc^2$$`
- All questions, options, and answers support Markdown

### 🎨 UI/UX
- Same styling as vanilla version
- Question navigator (current/answered/visited)
- Timer warnings (yellow < 10min, red < 5min)
- Live answer preview
- Responsive design

## 🔧 Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Axios** - HTTP client
- **React-Markdown** - Markdown rendering
- **KaTeX** - LaTeX math

## 📚 Documentation

- **SETUP_GUIDE.md** - Complete setup instructions
- **../INSTALL.md** - Installation guide
- **../REACT_MIGRATION_COMPLETE.md** - Migration summary
- **../BUILD_COMPLETE.md** - Build summary

## 🎉 Ready to Use!

All screens, components, hooks, and services are fully functional. Install dependencies and start the dev server to begin using the modern React version!
