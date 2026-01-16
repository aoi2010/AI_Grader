"""
Exam Router - Handles exam creation, starting, and question navigation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from backend.database import get_db
from backend.models import User, Exam, Question, Answer, ExamStatus, QuestionType
from backend.schemas import (
    ExamCreateRequest, ExamResponse, ExamStartRequest,
    CurrentQuestionResponse, QuestionResponse, AnswerResponse,
    NextQuestionRequest
)
from backend.gemini_service import gemini_service

router = APIRouter()


@router.post("/create", response_model=ExamResponse)
async def create_exam(request: ExamCreateRequest, db: Session = Depends(get_db)):
    """
    Create a new exam and generate the question paper using Gemini
    
    Steps:
    1. Create or get user
    2. Generate question paper via Gemini
    3. Create exam record
    4. Create all question records
    5. Return exam details
    """
    try:
        # Step 1: Get or create user
        user = db.query(User).filter(User.email == request.user_email).first()
        if not user:
            user = User(name=request.user_name, email=request.user_email)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Step 2: Generate question paper using Gemini
        paper_json = gemini_service.generate_question_paper(
            board=request.board.value,
            class_num=request.class_num,
            subject=request.subject,
            chapter_focus=request.chapter_focus
        )
        
        # Step 3: Create exam record with custom duration validation
        default_duration = paper_json['duration_minutes']
        final_duration = default_duration
        
        # Allow custom duration only if it's lower than default
        if request.custom_duration_minutes is not None:
            if request.custom_duration_minutes < default_duration:
                final_duration = request.custom_duration_minutes
            # Silently ignore if custom duration is higher than default
        
        exam = Exam(
            user_id=user.id,
            board=request.board,
            class_num=request.class_num,
            subject=request.subject,
            chapter_focus=request.chapter_focus,
            duration_minutes=final_duration,
            total_marks=paper_json['total_marks'],
            paper_json=paper_json,
            status=ExamStatus.CREATED,
            current_question_index=0
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        # Step 4: Create question records
        question_number = 1
        for section_data in paper_json['sections']:
            section = section_data['section']
            for q_data in section_data['questions']:
                question = Question(
                    exam_id=exam.id,
                    section=section,
                    sequence_number=question_number,
                    question_text=q_data['question_text'],
                    question_type=QuestionType[q_data['question_type'].upper().replace(" ", "_")],
                    marks=q_data['marks'],
                    has_internal_choice=q_data.get('has_internal_choice', False),
                    alternative_question_text=q_data.get('alternative_question_text'),
                    options_json=q_data.get('options'),
                    correct_answer=q_data.get('correct_answer')
                )
                db.add(question)
                question_number += 1
        
        db.commit()
        
        # Count total questions
        total_questions = db.query(Question).filter(Question.exam_id == exam.id).count()
        
        return ExamResponse(
            id=exam.id,
            board=exam.board,
            class_num=exam.class_num,
            subject=exam.subject,
            chapter_focus=exam.chapter_focus,
            duration_minutes=exam.duration_minutes,
            total_marks=exam.total_marks,
            status=exam.status,
            started_at=exam.started_at,
            current_question_index=exam.current_question_index,
            total_questions=total_questions
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create exam: {str(e)}"
        )


@router.post("/start", response_model=CurrentQuestionResponse)
async def start_exam(request: ExamStartRequest, db: Session = Depends(get_db)):
    """
    Start an exam - sets status to IN_PROGRESS and returns first question
    """
    exam = db.query(Exam).filter(Exam.id == request.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.CREATED:
        raise HTTPException(status_code=400, detail="Exam already started or completed")
    
    # Update exam status
    exam.status = ExamStatus.IN_PROGRESS
    exam.started_at = datetime.utcnow()
    exam.time_remaining_seconds = exam.duration_minutes * 60
    exam.current_question_index = 0
    db.commit()
    db.refresh(exam)
    
    return await get_current_question(request.exam_id, db)


@router.get("/{exam_id}/questions", response_model=List[QuestionResponse])
async def get_all_questions(exam_id: int, db: Session = Depends(get_db)):
    """
    Get all questions for an exam (for navigation)
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    questions = db.query(Question).filter(
        Question.exam_id == exam_id
    ).order_by(Question.sequence_number).all()
    
    return [
        QuestionResponse(
            id=q.id,
            section=q.section,
            sequence_number=q.sequence_number,
            question_text=q.question_text,
            question_type=q.question_type,
            marks=q.marks,
            has_internal_choice=q.has_internal_choice,
            alternative_question_text=q.alternative_question_text,
            options_json=q.options_json,
            correct_answer=q.correct_answer
        )
        for q in questions
    ]


@router.get("/{exam_id}/answers", response_model=List[AnswerResponse])
async def get_all_answers(exam_id: int, db: Session = Depends(get_db)):
    """
    Get all answers for an exam (to check which questions are answered)
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    answers = db.query(Answer).join(Question).filter(
        Question.exam_id == exam_id
    ).all()
    
    return [
        AnswerResponse(
            id=a.id,
            question_id=a.question_id,
            typed_answer=a.typed_answer,
            selected_option=a.selected_option,
            selected_choice=a.selected_choice,
            has_uploaded_files=len(a.uploaded_files) > 0
        )
        for a in answers
    ]


@router.get("/{exam_id}/current", response_model=CurrentQuestionResponse)
async def get_current_question(exam_id: int, db: Session = Depends(get_db)):
    """
    Get the current question for an exam based on sequential state
    
    CRITICAL: Enforces sequential answering rules
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get all questions ordered by sequence
    all_questions = db.query(Question).filter(
        Question.exam_id == exam_id
    ).order_by(Question.sequence_number).all()
    
    total_questions = len(all_questions)
    
    # Check if exam is complete
    if exam.current_question_index >= total_questions:
        return CurrentQuestionResponse(
            exam=ExamResponse(
                id=exam.id,
                board=exam.board,
                class_num=exam.class_num,
                subject=exam.subject,
                chapter_focus=exam.chapter_focus,
                duration_minutes=exam.duration_minutes,
                total_marks=exam.total_marks,
                status=exam.status,
                started_at=exam.started_at,
                current_question_index=exam.current_question_index,
                total_questions=total_questions
            ),
            question=None,
            answer=None,
            can_proceed=False,
            is_last_question=True
        )
    
    # Get current question
    current_question = all_questions[exam.current_question_index]
    
    # Get existing answer if any
    answer = db.query(Answer).filter(
        Answer.question_id == current_question.id
    ).first()
    
    # Check if can proceed (answer saved OR PDF uploaded)
    can_proceed = False
    if answer:
        has_typed_answer = answer.typed_answer is not None and answer.typed_answer.strip() != ""
        has_mcq_answer = answer.selected_option is not None
        has_uploaded_files = len(answer.uploaded_files) > 0
        can_proceed = has_typed_answer or has_mcq_answer or has_uploaded_files
    
    # Build response
    answer_response = None
    if answer:
        answer_response = AnswerResponse(
            id=answer.id,
            question_id=answer.question_id,
            typed_answer=answer.typed_answer,
            selected_choice=answer.selected_choice,
            selected_option=answer.selected_option,
            first_saved_at=answer.first_saved_at,
            last_edited_at=answer.last_edited_at,
            has_uploaded_files=len(answer.uploaded_files) > 0
        )
    
    return CurrentQuestionResponse(
        exam=ExamResponse(
            id=exam.id,
            board=exam.board,
            class_num=exam.class_num,
            subject=exam.subject,
            chapter_focus=exam.chapter_focus,
            duration_minutes=exam.duration_minutes,
            total_marks=exam.total_marks,
            status=exam.status,
            started_at=exam.started_at,
            current_question_index=exam.current_question_index,
            total_questions=total_questions
        ),
        question=QuestionResponse(
            id=current_question.id,
            section=current_question.section,
            sequence_number=current_question.sequence_number,
            question_text=current_question.question_text,
            question_type=current_question.question_type,
            marks=current_question.marks,
            has_internal_choice=current_question.has_internal_choice,
            alternative_question_text=current_question.alternative_question_text,
            options_json=current_question.options_json
        ),
        answer=answer_response,
        can_proceed=can_proceed,
        is_last_question=(exam.current_question_index == total_questions - 1)
    )


@router.post("/{exam_id}/next", response_model=CurrentQuestionResponse)
async def next_question(exam_id: int, db: Session = Depends(get_db)):
    """
    Move to the next question
    
    CRITICAL: Validates that current question is answered before allowing progression
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Exam is not in progress")
    
    # Get current question
    all_questions = db.query(Question).filter(
        Question.exam_id == exam_id
    ).order_by(Question.sequence_number).all()
    
    if exam.current_question_index >= len(all_questions):
        raise HTTPException(status_code=400, detail="No more questions")
    
    current_question = all_questions[exam.current_question_index]
    
    # Validate that current question has an answer
    answer = db.query(Answer).filter(
        Answer.question_id == current_question.id
    ).first()
    
    if not answer:
        raise HTTPException(
            status_code=400,
            detail="Cannot proceed: Current question must be answered or have a PDF uploaded"
        )
    
    # Check if answer is valid
    has_typed_answer = answer.typed_answer is not None and answer.typed_answer.strip() != ""
    has_mcq_answer = answer.selected_option is not None
    has_uploaded_files = len(answer.uploaded_files) > 0
    
    if not (has_typed_answer or has_mcq_answer or has_uploaded_files):
        raise HTTPException(
            status_code=400,
            detail="Cannot proceed: Current question must be answered or have a PDF uploaded"
        )
    
    # Move to next question
    exam.current_question_index += 1
    db.commit()
    
    return await get_current_question(exam_id, db)


@router.post("/{exam_id}/submit")
async def submit_exam(exam_id: int, db: Session = Depends(get_db)):
    """
    Submit the exam for evaluation
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status == ExamStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Exam already submitted")
    
    # Update status
    exam.status = ExamStatus.SUBMITTED
    exam.submitted_at = datetime.utcnow()
    
    # Lock all answers
    db.query(Answer).filter(Answer.exam_id == exam_id).update({"is_locked": True})
    
    db.commit()
    
    return {"message": "Exam submitted successfully", "exam_id": exam_id}


@router.get("/{exam_id}/timer")
async def get_timer_state(exam_id: int, db: Session = Depends(get_db)):
    """
    Get the current timer state for an exam
    Allows timer to persist across page refreshes
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if exam.status != ExamStatus.IN_PROGRESS:
        return {"time_remaining_seconds": 0, "exam_started": False}
    
    if not exam.started_at:
        return {"time_remaining_seconds": exam.duration_minutes * 60, "exam_started": False}
    
    # Calculate elapsed time
    elapsed = (datetime.utcnow() - exam.started_at).total_seconds()
    total_time = exam.duration_minutes * 60
    remaining = max(0, int(total_time - elapsed))
    
    return {
        "time_remaining_seconds": remaining,
        "exam_started": True,
        "auto_submit": remaining == 0
    }


@router.post("/{exam_id}/update-timer")
async def update_timer(exam_id: int, time_remaining: int, db: Session = Depends(get_db)):
    """
    Update the timer state (for persistence)
    """
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam.time_remaining_seconds = time_remaining
    db.commit()
    
    return {"message": "Timer updated"}
