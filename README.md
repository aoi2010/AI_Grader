# AI Grader - Indian Board Exam System

A full-stack web application for generating and evaluating exam papers for Indian school students (CBSE, ICSE, WBBSE) using AI.

## 🎯 Features

### Core Functionality
- **AI-Powered Question Generation**: Uses Google Gemini to generate board-specific exam papers
- **Sequential Answering**: Enforces strict one-by-one question answering (critical for Mathematics)
- **LaTeX Support**: Full mathematical expression support with MathJax rendering
- **PDF Upload**: Multi-PDF support per question for handwritten answers
- **Smart Timer**: Persistent timer across page refreshes with auto-submit
- **AI Evaluation**: Gemini-powered examiner with step-wise evaluation

### Supported Boards
- CBSE (Classes 6-12)
- ICSE (Classes 6-12)
- WBBSE (Classes 6-12)

### Question Types
- Multiple Choice Questions (MCQ)
- Short Answer Questions
- Long Answer Questions
- Case Study Questions
- Numerical Problems

## 🏗️ Technology Stack

**Backend:**
- Python 3.11
- FastAPI
- SQLAlchemy (SQLite/PostgreSQL-ready)
- Google Gemini API

**Frontend:**
- HTML5
- CSS3 (Custom design)
- Vanilla JavaScript
- MathJax 3 (LaTeX rendering)

**Database:**
- SQLite (default)
- PostgreSQL-ready schema

## 📋 Prerequisites

- Python 3.11 or higher
- Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))
- Modern web browser with JavaScript enabled

## 🚀 Installation

### 1. Clone or Download
```bash
cd AI_Grader
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Run the Application
```bash
python -m backend.main
```

The application will start at: **http://localhost:8000**

## 📖 Usage Guide

### For Students

1. **Create Exam**
   - Enter your details (name, email)
   - Select board (CBSE/ICSE/WBBSE)
   - Choose class (6-12)
   - Enter subject
   - Optionally specify chapter focus
   - Click "Generate Exam Paper"

2. **Take Exam**
   - Read instructions carefully
   - Start exam (timer begins)
   - Answer questions one by one
   - Type answers with LaTeX support or upload PDF
   - Cannot skip questions (sequential enforcement)
   - Submit exam when complete

3. **View Results**
   - Upload any final PDFs
   - Submit for AI evaluation
   - Receive detailed feedback report
   - Download full report

### LaTeX Quick Reference

```latex
Fractions: $\frac{numerator}{denominator}$
Powers: $x^2$, $x^{10}$
Subscripts: $x_1$, $x_{10}$
Square Root: $\sqrt{x}$, $\sqrt[3]{x}$
Integrals: $\int x dx$
Limits: $\lim_{x \to 0}$
Summation: $\sum_{i=1}^{n}$
Greek: $\alpha$, $\beta$, $\pi$
```

## 🔧 Configuration

### Board Patterns

Board-specific exam patterns are configured in `backend/config.py`. Each pattern includes:
- Duration (minutes)
- Total marks
- Section structure
- Question types per section
- Internal choice rules

### Modifying Patterns

Edit `BOARD_PATTERNS` in `backend/config.py`:

```python
BOARD_PATTERNS = {
    "CBSE": {
        "class_9_to_10": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 20, "marks_each": 1},
                # ... more sections
            }
        }
    }
}
```

## 🗄️ Database Schema

### Tables
- **users**: Student information
- **exams**: Exam sessions
- **questions**: Generated questions
- **answers**: Student answers
- **uploaded_files**: PDF submissions

### Migration to PostgreSQL

Update `.env`:
```
DATABASE_URL=postgresql://username:password@localhost/ai_grader
```

All models are PostgreSQL-compatible.

## 🔐 Security Features

- Server-side sequential validation
- Answer locking after submission
- File type validation (PDF only)
- File size limits (10MB default)
- No exam editing post-submission

## 🎨 Customization

### Styling
Edit `frontend/styles.css` to customize colors, fonts, and layout.

### Adding New Boards
1. Add board to `BoardEnum` in `backend/models.py`
2. Add pattern to `BOARD_PATTERNS` in `backend/config.py`
3. Update frontend dropdown in `frontend/index.html`

## 🐛 Troubleshooting

### Common Issues

**"GEMINI_API_KEY not configured"**
- Ensure `.env` file exists
- Verify API key is correct
- Check for spaces or quotes in the key

**Timer not working**
- Check browser console for errors
- Ensure backend is running
- Verify exam is in IN_PROGRESS status

**LaTeX not rendering**
- Wait for MathJax to load
- Check browser console for errors
- Ensure proper LaTeX syntax

**PDF upload fails**
- Check file is actually PDF
- Verify file size < 10MB
- Ensure answer exists for that question

## 📁 Project Structure

```
AI_Grader/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration & board patterns
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── gemini_service.py    # Gemini AI integration
│   └── routers/
│       ├── exam.py          # Exam endpoints
│       ├── answer.py        # Answer endpoints
│       └── evaluation.py    # Evaluation endpoints
├── frontend/
│   ├── index.html           # Main HTML
│   ├── styles.css           # Styling
│   └── app.js               # Frontend logic
├── uploads/                 # PDF storage
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

## 🔄 API Endpoints

### Exam Management
- `POST /api/exam/create` - Create exam
- `POST /api/exam/start` - Start exam
- `GET /api/exam/{id}/current` - Get current question
- `POST /api/exam/{id}/next` - Move to next question
- `POST /api/exam/{id}/submit` - Submit exam
- `GET /api/exam/{id}/timer` - Get timer state

### Answers
- `POST /api/answer/save` - Save answer
- `POST /api/answer/upload-pdf/{exam_id}/{question_id}` - Upload PDF
- `GET /api/answer/{id}/files` - Get uploaded files

### Evaluation
- `POST /api/evaluation/evaluate` - Evaluate exam
- `GET /api/evaluation/{exam_id}/report` - Get report
- `GET /api/evaluation/{exam_id}/summary` - Get summary
- `GET /api/evaluation/{exam_id}/full-paper` - Get full paper

## 🤝 Contributing

This is an educational project. Contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⚖️ License

This project is for educational purposes.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- MathJax for LaTeX rendering
- FastAPI framework
- Indian education boards (CBSE, ICSE, WBBSE)

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify environment configuration

## 🔮 Future Enhancements

- [ ] User authentication system
- [ ] Multiple exam sessions per user
- [ ] Detailed analytics dashboard
- [ ] Export to PDF (formatted report)
- [ ] Mobile app version
- [ ] Offline mode support
- [ ] Question bank management
- [ ] Peer comparison (anonymized)

---

**Built with ❤️ for Indian students**
