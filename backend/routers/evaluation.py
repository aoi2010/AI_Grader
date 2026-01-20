"""
Evaluation Router - Handles AI-based exam evaluation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any
import logging

from backend.database import get_db
from backend.models import Exam, Question, Answer, UploadedFile, ExamStatus
from backend.schemas import EvaluationRequest, EvaluationResponse
from backend.gemini_service import gemini_service

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_exam(request: EvaluationRequest, db: Session = Depends(get_db)):
    """
    Evaluate an exam using Gemini AI as an examiner
    
    Steps:
    1. Validate exam is submitted
    2. Gather all questions and answers
    3. Format data for Gemini
    4. Send to Gemini for evaluation
    5. Store evaluation report
    6. Return results
    """
    exam = db.query(Exam).filter(Exam.id == request.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    logger.info(
        "AI: evaluation request exam_id=%s status=%s board=%s class=%s subject=%s",
        request.exam_id,
        getattr(exam.status, "value", str(exam.status)),
        exam.board.value,
        exam.class_num,
        exam.subject,
    )
    
    # If already evaluated, return stored report (idempotent)
    if exam.status == ExamStatus.EVALUATED and exam.evaluation_report:
        return EvaluationResponse(
            exam_id=exam.id,
            evaluation_report=exam.evaluation_report,
            evaluated_at=exam.evaluated_at
        )

    # Auto-submit if not yet submitted
    if exam.status in (ExamStatus.IN_PROGRESS, ExamStatus.CREATED):
        exam.status = ExamStatus.SUBMITTED
        exam.submitted_at = datetime.utcnow()
        db.query(Answer).filter(Answer.exam_id == request.exam_id).update({"is_locked": True})
        db.commit()
        db.refresh(exam)
    
    if exam.status != ExamStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Exam must be submitted before evaluation")
    
    # Gather all questions with answers
    questions = db.query(Question).filter(
        Question.exam_id == request.exam_id
    ).order_by(Question.sequence_number).all()
    
    questions_with_answers = []
    pdf_attachments = []
    for question in questions:
        answer = db.query(Answer).filter(Answer.question_id == question.id).first()
        
        answer_data = None
        if answer:
            uploaded_files = db.query(UploadedFile).filter(
                UploadedFile.answer_id == answer.id
            ).all()
            uploaded_files_count = len(uploaded_files)
            
            answer_data = {
                "typed_answer": answer.typed_answer,
                "selected_option": answer.selected_option,
                "selected_choice": answer.selected_choice,
                "uploaded_files_count": uploaded_files_count,
                "uploaded_files": [
                    {
                        "filename": f.filename,
                        "file_path": f.file_path
                    }
                    for f in uploaded_files
                ]
            }

            for f in uploaded_files:
                pdf_attachments.append({
                    "question_number": question.sequence_number,
                    "filename": f.filename,
                    "file_path": f.file_path
                })
        
        questions_with_answers.append({
            "question": {
                "sequence_number": question.sequence_number,
                "section": question.section,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "marks": question.marks,
                "correct_answer": question.correct_answer  # For MCQs
            },
            "answer": answer_data
        })
    
    # Generate evaluation report using Gemini with a simple retry on internal errors
    from backend.models import User
    user = db.query(User).filter(User.id == exam.user_id).first()

    student_info = {
        "name": user.name if user else "Unknown",
        "email": user.email if user else "Unknown"
    }

    last_error: Exception | None = None
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        try:
            evaluation_report = gemini_service.evaluate_exam(
                board=exam.board.value,
                class_num=exam.class_num,
                subject=exam.subject,
                student_info=student_info,
                questions_with_answers=questions_with_answers,
                paper_json=exam.paper_json,
                pdf_attachments=pdf_attachments
            )

            logger.info(
                "AI: evaluation completed exam_id=%s model=%s api_key=%s/%s attempt=%s",
                request.exam_id,
                gemini_service.last_model_used,
                (gemini_service.last_key_index_used + 1) if gemini_service.last_key_index_used is not None else None,
                len(gemini_service.api_keys),
                attempt,
            )

            # Store evaluation in database
            exam.evaluation_report = evaluation_report
            exam.evaluated_at = datetime.utcnow()
            exam.status = ExamStatus.EVALUATED
            db.commit()
            db.refresh(exam)

            return EvaluationResponse(
                exam_id=exam.id,
                evaluation_report=exam.evaluation_report,
                evaluated_at=exam.evaluated_at
            )
        except Exception as e:
            last_error = e
            logger.exception(
                "AI: evaluation attempt failed exam_id=%s attempt=%s/%s err=%s",
                request.exam_id,
                attempt,
                max_attempts,
                str(e),
            )
            if attempt < max_attempts:
                continue

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Evaluation failed after {max_attempts} attempts: {str(last_error)}"
    )


@router.get("/{exam_id}/report")
async def get_evaluation_report(exam_id: int, db: Session = Depends(get_db)):
    """
    Get the evaluation report for an exam
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.EVALUATED:
        raise HTTPException(status_code=400, detail="Exam has not been evaluated yet")
    
    return EvaluationResponse(
        exam_id=exam.id,
        evaluation_report=exam.evaluation_report,
        evaluated_at=exam.evaluated_at
    )


@router.get("/{exam_id}/summary")
async def get_exam_summary(exam_id: int, db: Session = Depends(get_db)):
    """
    Get a summary of the exam (for display after completion)
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Count answered questions
    total_questions = db.query(Question).filter(Question.exam_id == exam_id).count()
    
    answered_questions = db.query(Answer).filter(
        Answer.exam_id == exam_id
    ).filter(
        (Answer.typed_answer.isnot(None)) |
        (Answer.selected_option.isnot(None))
    ).count()
    
    # Count uploaded PDFs
    total_pdfs = db.query(UploadedFile).join(Answer).filter(
        Answer.exam_id == exam_id
    ).count()
    
    # Calculate time taken
    time_taken_minutes = None
    if exam.started_at and exam.submitted_at:
        time_taken_seconds = (exam.submitted_at - exam.started_at).total_seconds()
        time_taken_minutes = int(time_taken_seconds / 60)
    
    # Calculate marks achieved (for evaluated exams)
    marks_achieved = None
    percentage = None
    if exam.status == ExamStatus.EVALUATED and exam.evaluation_report:
        # Try to extract marks from evaluation report (if examiner provided)
        # This is a simple pattern match - can be enhanced
        import re
        marks_pattern = r'(?:Total\s*Marks\s*Achieved|Marks\s*Obtained|Score)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:/|out\s*of)\s*(\d+)'
        match = re.search(marks_pattern, exam.evaluation_report, re.IGNORECASE)
        if match:
            marks_achieved = float(match.group(1))
            percentage = round((marks_achieved / exam.total_marks) * 100, 2)
    
    return {
        "exam_id": exam.id,
        "board": exam.board.value,
        "class": exam.class_num,
        "subject": exam.subject,
        "status": exam.status.value,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "unanswered_questions": total_questions - answered_questions,
        "total_uploaded_pdfs": total_pdfs,
        "total_marks": exam.total_marks,
        "marks_achieved": marks_achieved,
        "percentage": percentage,
        "duration_minutes": exam.duration_minutes,
        "time_taken_minutes": time_taken_minutes,
        "started_at": exam.started_at,
        "submitted_at": exam.submitted_at,
        "evaluated_at": exam.evaluated_at
    }


@router.get("/{exam_id}/full-paper")
async def get_full_question_paper(exam_id: int, db: Session = Depends(get_db)):
    """
    Get the complete question paper (for download/printing after submission)
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status == ExamStatus.CREATED or exam.status == ExamStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400,
            detail="Question paper can only be viewed after submission"
        )
    
    # Get all questions in order
    questions = db.query(Question).filter(
        Question.exam_id == exam_id
    ).order_by(Question.sequence_number).all()
    
    # Format for display
    formatted_questions = []
    for q in questions:
        formatted_questions.append({
            "sequence_number": q.sequence_number,
            "section": q.section,
            "question_text": q.question_text,
            "question_type": q.question_type.value,
            "marks": q.marks,
            "has_internal_choice": q.has_internal_choice,
            "alternative_question_text": q.alternative_question_text,
            "options": q.options_json
        })
    
    return {
        "exam_info": {
            "board": exam.board.value,
            "class": exam.class_num,
            "subject": exam.subject,
            "total_marks": exam.total_marks,
            "duration_minutes": exam.duration_minutes
        },
        "instructions": exam.paper_json.get("instructions", []),
        "questions": formatted_questions
    }
