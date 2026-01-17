"""
Answer Router - Handles answer submission and PDF uploads
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime

from backend.database import get_db
from backend.models import Answer, Question, Exam, UploadedFile, ExamStatus
from backend.schemas import AnswerSaveRequest, AnswerResponse, FileUploadResponse
from backend.config import settings

router = APIRouter()


@router.get("/get/{exam_id}/{question_id}", response_model=Optional[AnswerResponse])
async def get_answer(exam_id: int, question_id: int, db: Session = Depends(get_db)):
    """
    Get an existing answer for a question (returns null if no answer exists)
    """
    # Verify exam exists
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Verify question exists and belongs to exam
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.exam_id == exam_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get answer (return None if not exists - this is not an error)
    answer = db.query(Answer).filter(Answer.question_id == question_id).first()
    if not answer:
        return None
    
    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        typed_answer=answer.typed_answer,
        selected_option=answer.selected_option,
        selected_choice=answer.selected_choice,
        has_uploaded_files=len(answer.uploaded_files) > 0
    )


@router.post("/save", response_model=AnswerResponse)
async def save_answer(request: AnswerSaveRequest, db: Session = Depends(get_db)):
    """
    Save or update an answer for a question
    
    CRITICAL: Preserves LaTeX - NEVER strips backslashes
    """
    # Validate exam and question
    exam = db.query(Exam).filter(Exam.id == request.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status == ExamStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Cannot edit answers - exam is submitted")
    
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question or question.exam_id != request.exam_id:
        raise HTTPException(status_code=404, detail="Question not found or doesn't belong to this exam")
    
    # Get or create answer (no sequential enforcement - can answer any question)
    answer = db.query(Answer).filter(Answer.question_id == request.question_id).first()
    
    if answer:
        # Update existing answer
        if request.typed_answer is not None:
            # CRITICAL: Store raw LaTeX with all backslashes preserved
            answer.typed_answer = request.typed_answer
        if request.selected_choice is not None:
            answer.selected_choice = request.selected_choice
        if request.selected_option is not None:
            answer.selected_option = request.selected_option
        answer.last_edited_at = datetime.utcnow()
    else:
        # Create new answer
        answer = Answer(
            exam_id=request.exam_id,
            question_id=request.question_id,
            typed_answer=request.typed_answer,
            selected_choice=request.selected_choice,
            selected_option=request.selected_option
        )
        db.add(answer)
    
    db.commit()
    db.refresh(answer)
    
    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        typed_answer=answer.typed_answer,
        selected_choice=answer.selected_choice,
        selected_option=answer.selected_option,
        first_saved_at=answer.first_saved_at,
        last_edited_at=answer.last_edited_at,
        has_uploaded_files=len(answer.uploaded_files) > 0
    )


@router.post("/upload-pdf/{exam_id}/{question_id}", response_model=FileUploadResponse)
async def upload_pdf(
    exam_id: int,
    question_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF answer sheet for a specific question
    
    - Validates file type (PDF only)
    - Validates file size
    - Stores file with unique name
    - Links to answer record
    """
    # Validate exam
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status == ExamStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Cannot upload - exam is submitted")
    
    # Validate question
    question = db.query(Question).filter(Question.id == question_id, Question.exam_id == exam_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Get or create answer record
    answer = db.query(Answer).filter(Answer.question_id == question_id).first()
    if not answer:
        answer = Answer(
            exam_id=exam_id,
            question_id=question_id
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, f"exam_{exam_id}")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"q{question.sequence_number}_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create database record
    uploaded_file = UploadedFile(
        answer_id=answer.id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size
    )
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)
    
    return FileUploadResponse(
        id=uploaded_file.id,
        filename=uploaded_file.filename,
        file_size=uploaded_file.file_size,
        uploaded_at=uploaded_file.uploaded_at
    )


@router.get("/{answer_id}/files")
async def get_uploaded_files(answer_id: int, db: Session = Depends(get_db)):
    """Get all uploaded files for an answer"""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    files = [
        FileUploadResponse(
            id=f.id,
            filename=f.filename,
            file_size=f.file_size,
            uploaded_at=f.uploaded_at
        )
        for f in answer.uploaded_files
    ]
    
    return {"files": files, "count": len(files)}


@router.post("/final-upload/{exam_id}", response_model=FileUploadResponse)
async def final_pdf_upload(
    exam_id: int,
    file: UploadFile = File(...),
    question_number: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload PDF after exam submission (final upload phase)
    
    If question_number is 0, uploads as a general answer sheet (attached to first question)
    Otherwise, uploads to the specific question number
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Handle question_number=0 (full answer sheet upload)
    if question_number == 0:
        # Attach to first question as a general answer sheet
        question = db.query(Question).filter(
            Question.exam_id == exam_id
        ).order_by(Question.sequence_number).first()
        
        if not question:
            raise HTTPException(status_code=404, detail="No questions found for this exam")
    else:
        # Find question by sequence number
        question = db.query(Question).filter(
            Question.exam_id == exam_id,
            Question.sequence_number == question_number
        ).first()
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")
    
    # Use the same upload logic
    return await upload_pdf(exam_id, question.id, file, db)
