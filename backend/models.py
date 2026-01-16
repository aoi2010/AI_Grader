"""
SQLAlchemy Models for AI Grader
PostgreSQL-ready schema using SQLite
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.database import Base


class BoardEnum(str, enum.Enum):
    """Supported Indian education boards"""
    CBSE = "CBSE"
    ICSE = "ICSE"
    WBBSE = "WBBSE"


class ExamStatus(str, enum.Enum):
    """Exam lifecycle states"""
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"


class QuestionType(str, enum.Enum):
    """Types of questions"""
    MCQ = "MCQ"
    SHORT_ANSWER = "Short Answer"
    LONG_ANSWER = "Long Answer"
    CASE_STUDY = "Case Study"
    NUMERICAL = "Numerical"


class User(Base):
    """User model - can be extended with authentication later"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")


class Exam(Base):
    """Exam model - represents a complete exam session"""
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Exam metadata
    board = Column(SQLEnum(BoardEnum), nullable=False)
    class_num = Column(Integer, nullable=False)  # 6-12
    subject = Column(String(100), nullable=False)
    chapter_focus = Column(Text, nullable=True)  # Optional chapter-wise focus
    
    # Exam configuration
    duration_minutes = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)
    
    # Exam state
    status = Column(SQLEnum(ExamStatus), default=ExamStatus.CREATED)
    started_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    time_remaining_seconds = Column(Integer, nullable=True)  # For timer persistence
    
    # Current progress tracking (critical for sequential answering)
    current_question_index = Column(Integer, default=0)  # 0-based index
    
    # Generated paper metadata
    paper_json = Column(JSON, nullable=True)  # Full generated paper structure
    
    # Evaluation results
    evaluation_report = Column(Text, nullable=True)  # AI-generated feedback
    evaluated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="exams")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.sequence_number")
    answers = relationship("Answer", back_populates="exam", cascade="all, delete-orphan")


class Question(Base):
    """Question model - individual questions in an exam"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    
    # Question details
    section = Column(String(10), nullable=False)  # A, B, C, D, E
    sequence_number = Column(Integer, nullable=False)  # Global question number
    question_text = Column(Text, nullable=False)  # May contain LaTeX
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    marks = Column(Integer, nullable=False)
    
    # Internal choice
    has_internal_choice = Column(Boolean, default=False)
    alternative_question_text = Column(Text, nullable=True)  # Alternative question if choice exists
    
    # For MCQs
    options_json = Column(JSON, nullable=True)  # {"A": "option1", "B": "option2", ...}
    correct_answer = Column(String(10), nullable=True)  # For MCQs only
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exam = relationship("Exam", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class Answer(Base):
    """Answer model - student answers for questions"""
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, unique=True)
    
    # Answer content
    typed_answer = Column(Text, nullable=True)  # Raw text + LaTeX (NEVER strip backslashes)
    
    # Choice selection (for internal choice questions)
    selected_choice = Column(String(50), nullable=True)  # "main" or "alternative"
    
    # MCQ selection
    selected_option = Column(String(10), nullable=True)  # A, B, C, D for MCQs
    
    # Timestamps
    first_saved_at = Column(DateTime, default=datetime.utcnow)
    last_edited_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Lock mechanism
    is_locked = Column(Boolean, default=False)  # True when exam is submitted
    
    # Relationships
    exam = relationship("Exam", back_populates="answers")
    question = relationship("Question", back_populates="answer")
    uploaded_files = relationship("UploadedFile", back_populates="answer", cascade="all, delete-orphan")


class UploadedFile(Base):
    """Uploaded PDF answer sheets"""
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False)
    
    # File details
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Server storage path
    file_size = Column(Integer, nullable=False)  # Bytes
    
    # Upload metadata
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    answer = relationship("Answer", back_populates="uploaded_files")
