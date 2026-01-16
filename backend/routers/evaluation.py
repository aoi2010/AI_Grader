"""
Evaluation Router - Handles AI-based exam evaluation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any

from backend.database import get_db
from backend.models import Exam, Question, Answer, UploadedFile, ExamStatus
from backend.schemas import EvaluationRequest, EvaluationResponse
from backend.gemini_service import gemini_service

router = APIRouter()


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
    
    if exam.status != ExamStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Exam must be submitted before evaluation")
    
    # Gather all questions with answers
    questions = db.query(Question).filter(
        Question.exam_id == request.exam_id
    ).order_by(Question.sequence_number).all()
    
    questions_with_answers = []
    for question in questions:
        answer = db.query(Answer).filter(Answer.question_id == question.id).first()
        
        answer_data = None
        if answer:
            uploaded_files_count = db.query(UploadedFile).filter(
                UploadedFile.answer_id == answer.id
            ).count()
            
            answer_data = {
                "typed_answer": answer.typed_answer,
                "selected_option": answer.selected_option,
                "selected_choice": answer.selected_choice,
                "uploaded_files_count": uploaded_files_count
            }
        
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
    
    # Generate evaluation report using Gemini
    try:
        # Get user information
        from backend.models import User
        user = db.query(User).filter(User.id == exam.user_id).first()
        
        student_info = {
            "name": user.name if user else "Unknown",
            "email": user.email if user else "Unknown"
        }
        
        evaluation_report = gemini_service.evaluate_exam(
            board=exam.board.value,
            class_num=exam.class_num,
            subject=exam.subject,
            student_info=student_info,
            questions_with_answers=questions_with_answers,
            paper_json=exam.paper_json
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
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
