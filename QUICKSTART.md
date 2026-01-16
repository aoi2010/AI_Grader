# AI Grader - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

### Step 2: Configure the Application
1. Open `.env` file in the project root
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyD...your-actual-key-here
   ```
3. Save the file

### Step 3: Install and Run

**Windows:**
```bash
# Double-click start.bat
# OR run in terminal:
start.bat
```

**Linux/Mac:**
```bash
# Make executable
chmod +x start.sh

# Run
./start.sh
```

**Manual Start:**
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run application
python -m backend.main
```

### Step 4: Access Application
Open browser and go to: **http://localhost:8000**

## 📝 First Exam

1. **Fill Student Details:**
   - Name: Your Name
   - Email: your.email@example.com
   - Board: CBSE
   - Class: 10
   - Subject: Mathematics
   - Click "Generate Exam Paper"

2. **Wait for Generation:**
   - AI generates full question paper (~30-60 seconds)
   - Board-specific pattern applied

3. **Start Exam:**
   - Read instructions
   - Click "Start Exam"
   - Timer begins

4. **Answer Questions:**
   - Type answer (supports LaTeX)
   - Example: `$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$`
   - OR upload PDF
   - Click "Save Answer"
   - Click "Next Question"

5. **Submit & Evaluate:**
   - Complete all questions
   - Submit exam
   - AI evaluation generates detailed report

## ✏️ LaTeX Examples

**Basic Math:**
```latex
$x^2 + 2x + 1 = 0$
```

**Fractions:**
```latex
$\frac{numerator}{denominator}$
```

**Complex:**
```latex
$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

## 🔧 Troubleshooting

**"GEMINI_API_KEY not configured"**
- Check `.env` file exists
- Verify API key is correct (no extra spaces)
- Restart the application

**Port 8000 already in use**
- Stop other applications using port 8000
- OR edit `backend/main.py`, change `port=8000` to `port=8001`

**Questions not generating**
- Check internet connection
- Verify Gemini API key is valid
- Check terminal for error messages

## 📋 Features Checklist

✅ Board-specific exam patterns (CBSE/ICSE/WBBSE)
✅ AI question generation
✅ Sequential answering enforcement
✅ LaTeX math support with live preview
✅ PDF upload (multiple per question)
✅ Persistent timer across refreshes
✅ Auto-submit on timeout
✅ Step-wise AI evaluation
✅ Detailed feedback report
✅ No skipping questions (Mathematics)
✅ Internal choice support
✅ MCQ handling
✅ Answer locking post-submission

## 🎯 Best Practices

1. **For Mathematics:**
   - Show all steps in typed answer
   - Use LaTeX for equations
   - Upload PDF for complex derivations

2. **For Subjects with Diagrams:**
   - Type explanation
   - Upload PDF with diagram

3. **Time Management:**
   - Monitor timer
   - Don't spend too long on one question
   - Save answers frequently

## 🆘 Getting Help

1. Check [README.md](README.md) for detailed documentation
2. Review API errors in browser console (F12)
3. Check backend logs in terminal
4. Verify all dependencies installed correctly

## 🎓 System Requirements

- **Python:** 3.11 or higher
- **RAM:** 2GB minimum
- **Storage:** 500MB
- **Internet:** Required for AI features
- **Browser:** Chrome, Firefox, Edge (modern versions)

---

**Ready to start? Run `start.bat` and open http://localhost:8000** 🚀
