"""
AI Grader - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import engine, Base
from backend.routers import exam, answer, evaluation

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Grader - Indian Board Exam System",
    description="Full-stack exam generation and evaluation system for CBSE/ICSE/WBBSE",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(exam.router, prefix="/api/exam", tags=["Exam"])
app.include_router(answer.router, prefix="/api/answer", tags=["Answer"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["Evaluation"])

# Serve static files (frontend)
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI Grader Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
