#!/bin/bash
echo "========================================"
echo "AI Grader - Indian Board Exam System"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[1/4] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        echo "Please ensure Python 3.11+ is installed"
        exit 1
    fi
else
    echo "[1/4] Virtual environment already exists"
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate

echo "[3/4] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo "[4/4] Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env and add your Gemini API key!"
    echo "Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
    echo "After adding your API key, run this script again."
    exit 0
fi

echo ""
echo "========================================"
echo "Starting AI Grader Application..."
echo "========================================"
echo ""
echo "Application will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

python -m backend.main
