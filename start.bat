@echo off
echo ========================================
echo AI Grader - Indian Board Exam System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo [1/4] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Please ensure Python 3.11+ is installed
        pause
        exit /b 1
    )
) else (
    echo [1/4] Virtual environment already exists
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/4] Checking environment configuration...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env and add your Gemini API key!
    echo Get your API key from: https://makersuite.google.com/app/apikey
    echo.
    echo After adding your API key, run this script again.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Starting AI Grader Application...
echo ========================================
echo.
echo Application will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m backend.main

pause
