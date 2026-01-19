# AI Grader React Frontend - Quick Start Script (PowerShell)

Write-Host "🚀 AI Grader React Frontend Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
$npmVersion = npm --version
Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Navigate to frontend-react directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Starting development server..." -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend API: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Make sure the backend is running:" -ForegroundColor Yellow
Write-Host "   cd .." -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   uvicorn backend.main:app --reload" -ForegroundColor Gray
Write-Host ""

# Start dev server
npm run dev
