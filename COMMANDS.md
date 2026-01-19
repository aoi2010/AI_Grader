# 🎯 AI Grader - Command Reference Card

## Quick Commands

### Setup (First Time Only)
```powershell
# Navigate to React frontend
cd frontend-react

# Install dependencies
npm install
```

### Development
```powershell
# Start React dev server
npm run dev

# Access at: http://localhost:3000
```

### Backend (Must Run Concurrently)
```powershell
# In separate terminal, from project root
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload

# Runs on: http://127.0.0.1:8000
```

### Production
```powershell
# Build for production
npm run build

# Preview production build
npm run preview

# Serve with backend (update backend/main.py first)
# See SETUP_GUIDE.md for details
```

### Quick Start Scripts
```powershell
# PowerShell (Windows)
.\start.ps1

# Bash (Mac/Linux)
./start.sh
```

## Project Navigation

```powershell
# Main project directory
cd C:\Users\Aoishik\Desktop\Projects\AI_Grader

# React frontend
cd frontend-react

# Vanilla JS frontend (legacy)
cd frontend

# Backend
cd backend
```

## File Locations

### Documentation
- `INSTALL.md` - Installation guide
- `REACT_MIGRATION_COMPLETE.md` - Migration summary
- `BUILD_COMPLETE.md` - Build summary
- `frontend-react/README.md` - React README
- `frontend-react/SETUP_GUIDE.md` - Detailed setup

### Configuration
- `.env` - Environment variables (GEMINI_API_KEY)
- `frontend-react/package.json` - Dependencies
- `frontend-react/vite.config.js` - Build config

### Source Code
- `frontend-react/src/` - React source files
  - `screens/` - 5 main screens
  - `components/` - 5 reusable components
  - `services/` - API layer
  - `store/` - Zustand state
  - `hooks/` - Custom hooks

## NPM Scripts

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Lint code (if configured)
```

## Common Tasks

### Install New Package
```bash
npm install package-name
```

### Update Dependencies
```bash
npm update
```

### Clear Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Troubleshooting

### Port Already in Use
```powershell
# Windows - Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Backend Not Connecting
```bash
# Check backend is running on port 8000
# Check vite.config.js proxy settings
```

### MathJax Not Rendering
```bash
# Check internet connection (CDN required)
# Check index.html has MathJax script tags
# Check browser console for errors
```

## URLs

- **React Dev**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs
- **Vanilla JS**: http://127.0.0.1:8000 (when backend serves it)

## Environment Variables

Create/edit `.env` in project root:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

## Git Commands (if using version control)

```bash
git status
git add .
git commit -m "React migration complete"
git push origin main
```

## Testing Workflow

1. Start backend → `uvicorn backend.main:app --reload`
2. Start frontend → `npm run dev`
3. Open browser → http://localhost:3000
4. Create exam → Fill form → Generate
5. Start exam → Answer questions
6. Submit → View evaluation

## File Sizes

- `node_modules/` → ~150 MB (not committed to git)
- `dist/` (after build) → ~200 KB
- `src/` → ~50 KB

## Browser DevTools

- **F12** - Open DevTools
- **Console** - See logs and errors
- **Network** - Monitor API calls
- **React DevTools** - Inspect React components

## Useful VS Code Extensions

- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier
- Vite
- Path Intellisense

---

**Keep this card handy for quick reference! 📋**
