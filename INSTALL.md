# 🚀 AI Grader - Installation & Quick Start

## Complete React Migration - Ready to Use!

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```powershell
cd frontend-react
npm install
```

### Step 2: Start Backend
```powershell
cd ..
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload
```

### Step 3: Start Frontend
```powershell
cd frontend-react
npm run dev
```

**Or use the quick start script:**
```powershell
cd frontend-react
.\start.ps1
```

---

## 🌐 Access the Application

- **React Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs

---

## 📦 What Gets Installed

### NPM Packages
```
react@18.2.0              # UI library
react-dom@18.2.0          # React DOM renderer
vite@5.0.8                # Build tool
zustand@4.4.7             # State management
axios@1.6.2               # HTTP client
react-markdown@9.0.1      # Markdown rendering
remark-math@6.0.0         # Math support
rehype-katex@7.0.0        # LaTeX rendering
katex@0.16.9              # LaTeX library
```

Total install size: ~150 MB (includes dev dependencies)

---

## 📋 System Requirements

### Required
- **Node.js**: 16.x or higher
- **npm**: 7.x or higher
- **Python**: 3.8+ (for backend)
- **FastAPI**: Already installed in backend

### Check Versions
```powershell
node --version    # Should be v16+ or v18+
npm --version     # Should be 7+ or 8+
python --version  # Should be 3.8+
```

---

## 🔧 Troubleshooting

### Issue: `npm install` fails
**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

### Issue: Backend not connecting
**Solution:**
- Ensure backend is running on port 8000
- Check `vite.config.js` proxy settings
- Verify `.env` has `GEMINI_API_KEY`

### Issue: MathJax not rendering
**Solution:**
- Check browser console for errors
- Ensure internet connection (MathJax CDN)
- Verify `index.html` has MathJax script tags

### Issue: Port 3000 already in use
**Solution:**
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or change port in vite.config.js
```

---

## 📖 First Time Setup

### 1. Clone/Download Project
```powershell
git clone <repository-url>
cd AI_Grader
```

### 2. Setup Backend (First Time Only)
```powershell
# Create virtual environment
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install Python packages
pip install -r requirements.txt

# Create .env file
New-Item .env
# Add: GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Setup Frontend (First Time Only)
```powershell
cd frontend-react
npm install
```

### 4. Run Application
```powershell
# Terminal 1: Backend
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload

# Terminal 2: Frontend
cd frontend-react
npm run dev
```

---

## 🎯 Usage Workflow

1. **Open** http://localhost:3000
2. **Fill** exam creation form (name, email, board, class, subject)
3. **Upload** syllabus (optional, .pdf/.txt/.doc)
4. **Generate** exam with AI
5. **Review** instructions and start exam
6. **Answer** questions (typed answers or MCQ)
7. **Upload** PDFs of handwritten work (optional)
8. **Navigate** between questions using grid
9. **Monitor** timer (auto-submits when time expires)
10. **Submit** exam for AI evaluation
11. **View** results and download reports

---

## 📁 Project Structure Overview

```
AI_Grader/
├── backend/                  # FastAPI backend
│   ├── main.py              # Entry point
│   ├── gemini_service.py    # AI integration
│   └── routers/             # API endpoints
├── frontend/                 # Original vanilla JS (backup)
├── frontend-react/           # NEW React application
│   ├── src/
│   │   ├── screens/         # 5 main screens
│   │   ├── components/      # 5 reusable components
│   │   ├── services/        # API layer
│   │   ├── store/           # Zustand state
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── vite.config.js
├── venv/                     # Python virtual environment
├── .env                      # Environment variables
└── README.md                 # Project overview
```

---

## 🧪 Testing Checklist

After installation, test these features:

### Basic Flow
- [ ] Open app at localhost:3000
- [ ] Create exam (fill all required fields)
- [ ] Upload syllabus file
- [ ] Start exam
- [ ] Answer a question (typed)
- [ ] Select MCQ option
- [ ] Upload PDF for a question
- [ ] Navigate between questions
- [ ] Check timer countdown
- [ ] Submit exam
- [ ] View evaluation results

### Advanced Features
- [ ] LaTeX math rendering ($x^2$)
- [ ] Markdown formatting (bold, italic, lists)
- [ ] OR questions (internal choice)
- [ ] Download question paper
- [ ] Download evaluation report
- [ ] Question navigator states (current/answered/visited)
- [ ] Timer color warnings (yellow/red)
- [ ] Final PDF upload (multiple files)

---

## 🎨 Customization

### Change API Endpoint
Edit `frontend-react/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://your-backend-url:8000',
    changeOrigin: true,
  },
}
```

### Change Theme Colors
Edit `frontend-react/src/index.css`:
```css
:root {
  --primary-color: #2563eb;  /* Change to your color */
  --success-color: #10b981;
  --danger-color: #ef4444;
}
```

### Change Timer Warnings
Edit `frontend-react/src/hooks/useTimer.js`:
```javascript
if (timerSeconds < 300) return 'danger'      // < 5 minutes
if (timerSeconds < 600) return 'warning'     // < 10 minutes
```

---

## 📞 Support & Documentation

- **Setup Guide**: `frontend-react/SETUP_GUIDE.md`
- **Migration Details**: `REACT_MIGRATION_COMPLETE.md`
- **API Docs**: http://127.0.0.1:8000/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

## 🔄 Switching Between Frontends

### Use React (Recommended)
```powershell
cd frontend-react
npm run dev
# Access at localhost:3000
```

### Use Vanilla JS (Legacy)
```powershell
# Backend serves it automatically
# Access at localhost:8000
```

Both frontends work with the same backend!

---

## 🏗️ Building for Production

### Build React App
```powershell
cd frontend-react
npm run build
```

### Serve with Backend
Update `backend/main.py`:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend-react/dist", html=True), name="static")
```

### Run Production Build
```powershell
uvicorn backend.main:app --host 0.0.0.0 --port 8000
# Access at localhost:8000
```

---

## ✅ Installation Complete!

You're ready to use the AI Grader React application! 🎉

### Quick Commands Reference
```powershell
# Install
cd frontend-react && npm install

# Develop
npm run dev

# Build
npm run build

# Preview
npm run preview
```

**Happy Grading! 📝🤖**
