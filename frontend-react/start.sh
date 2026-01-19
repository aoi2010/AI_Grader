#!/bin/bash

# AI Grader React Frontend - Quick Start Script

echo "🚀 AI Grader React Frontend Setup"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Navigate to frontend-react directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully!"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 Starting development server..."
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://127.0.0.1:8000"
echo ""
echo "⚠️  Make sure the backend is running:"
echo "   cd .."
echo "   .\\venv\\Scripts\\Activate.ps1"
echo "   uvicorn backend.main:app --reload"
echo ""

# Start dev server
npm run dev
