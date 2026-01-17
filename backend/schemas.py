"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.models import BoardEnum, ExamStatus, QuestionType


# ========== Exam Schemas ==========

class ExamCreateRequest(BaseModel):
    """Request schema for creating a new exam"""
    user_name: str = Field(..., min_length=1, max_length=200)
    user_email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    board: BoardEnum
    class_num: int = Field(..., ge=6, le=12)
    subject: str = Field(..., min_length=1, max_length=100)
    chapter_focus: Optional[str] = None
    custom_duration_minutes: Optional[int] = Field(None, ge=1, description="Custom exam duration (can only be lower than default)")
    difficulty_level: Optional[str] = Field("medium", description="Difficulty: easy, medium, hard, extreme, ultra_extreme")
    syllabus_content: Optional[str] = Field(None, description="Extracted syllabus content from uploaded PDF")


class ExamStartRequest(BaseModel):
    """Request to start an exam"""
    exam_id: int


class QuestionResponse(BaseModel):
    """Response schema for a single question"""
    id: int
    section: str
    sequence_number: int
    question_text: str
    question_type: QuestionType
    marks: int
    has_internal_choice: bool
    alternative_question_text: Optional[str] = None
    options_json: Optional[Dict[str, str]] = None
    
    class Config:
        from_attributes = True


class ExamResponse(BaseModel):
    """Response schema for exam details"""
    id: int
    board: BoardEnum
    class_num: int
    subject: str
    chapter_focus: Optional[str]
    duration_minutes: int
    total_marks: int
    status: ExamStatus
    started_at: Optional[datetime]
    current_question_index: int
    total_questions: int
    
    class Config:
        from_attributes = True


# ========== Answer Schemas ==========

class AnswerSaveRequest(BaseModel):
    """Request schema for saving an answer"""
    exam_id: int
    question_id: int
    typed_answer: Optional[str] = None
    selected_choice: Optional[str] = None  # "main" or "alternative"
    selected_option: Optional[str] = None  # For MCQs: A, B, C, D


class AnswerResponse(BaseModel):
    """Response schema for an answer"""
    id: int
    question_id: int
    typed_answer: Optional[str]
    selected_choice: Optional[str]
    selected_option: Optional[str]
    first_saved_at: Optional[datetime] = None
    last_edited_at: Optional[datetime] = None
    has_uploaded_files: bool
    
    class Config:
        from_attributes = True


# ========== File Upload Schemas ==========

class FileUploadResponse(BaseModel):
    """Response schema for file upload"""
    id: int
    filename: str
    file_size: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# ========== Navigation Schemas ==========

class NextQuestionRequest(BaseModel):
    """Request to navigate to next question"""
    exam_id: int


class CurrentQuestionResponse(BaseModel):
    """Response with current question and answer state"""
    exam: ExamResponse
    question: Optional[QuestionResponse]
    answer: Optional[AnswerResponse]
    can_proceed: bool  # True if answer saved/uploaded
    is_last_question: bool


# ========== Evaluation Schemas ==========

class EvaluationRequest(BaseModel):
    """Request to evaluate exam"""
    exam_id: int


class EvaluationResponse(BaseModel):
    """Response with evaluation results"""
    exam_id: int
    evaluation_report: str
    evaluated_at: datetime
    
    class Config:
        from_attributes = True
