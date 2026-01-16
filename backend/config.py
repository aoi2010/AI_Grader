"""
Configuration management for AI Grader
Handles environment variables and board-specific patterns
"""
import os
from typing import Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./ai_grader.db"
    
    # Google Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf"}
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Board-specific exam patterns
BOARD_PATTERNS: Dict[str, Dict[str, Any]] = {
    "CBSE": {
        "class_6_to_8": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 20, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 6, "marks_each": 2},
                "C": {"type": "Short Answer", "questions": 6, "marks_each": 3},
                "D": {"type": "Long Answer", "questions": 4, "marks_each": 5},
            },
            "internal_choice": {"sections": ["D"], "questions_with_choice": 2}
        },
        "class_9_to_10": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 20, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 6, "marks_each": 2},
                "C": {"type": "Short Answer", "questions": 8, "marks_each": 3},
                "D": {"type": "Long Answer", "questions": 4, "marks_each": 5},
            },
            "internal_choice": {"sections": ["C", "D"], "questions_with_choice": 4}
        },
        "class_11_to_12": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 16, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 6, "marks_each": 2},
                "C": {"type": "Long Answer I", "questions": 6, "marks_each": 3},
                "D": {"type": "Long Answer II", "questions": 4, "marks_each": 5},
                "E": {"type": "Case Study", "questions": 3, "marks_each": 4},
            },
            "internal_choice": {"sections": ["B", "C", "D"], "questions_with_choice": 6}
        }
    },
    "ICSE": {
        "class_6_to_8": {
            "duration_minutes": 120,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 15, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 10, "marks_each": 2},
                "C": {"type": "Long Answer", "questions": 5, "marks_each": 5},
            },
            "internal_choice": {"sections": ["C"], "questions_with_choice": 2}
        },
        "class_9_to_10": {
            "duration_minutes": 150,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 15, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 12, "marks_each": 2},
                "C": {"type": "Long Answer", "questions": 6, "marks_each": 5},
            },
            "internal_choice": {"sections": ["B", "C"], "questions_with_choice": 4}
        },
        "class_11_to_12": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 20, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 10, "marks_each": 2},
                "C": {"type": "Long Answer", "questions": 6, "marks_each": 5},
            },
            "internal_choice": {"sections": ["B", "C"], "questions_with_choice": 5}
        }
    },
    "WBBSE": {
        "class_6_to_8": {
            "duration_minutes": 150,
            "total_marks": 90,
            "sections": {
                "A": {"type": "MCQ", "questions": 15, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 12, "marks_each": 2},
                "C": {"type": "Descriptive", "questions": 6, "marks_each": 5},
            },
            "internal_choice": {"sections": ["C"], "questions_with_choice": 2}
        },
        "class_9_to_10": {
            "duration_minutes": 180,
            "total_marks": 90,
            "sections": {
                "A": {"type": "MCQ", "questions": 15, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 15, "marks_each": 2},
                "C": {"type": "Long Answer", "questions": 6, "marks_each": 5},
            },
            "internal_choice": {"sections": ["B", "C"], "questions_with_choice": 5}
        },
        "class_11_to_12": {
            "duration_minutes": 180,
            "total_marks": 80,
            "sections": {
                "A": {"type": "MCQ", "questions": 20, "marks_each": 1},
                "B": {"type": "Short Answer", "questions": 10, "marks_each": 2},
                "C": {"type": "Long Answer", "questions": 6, "marks_each": 5},
            },
            "internal_choice": {"sections": ["B", "C"], "questions_with_choice": 4}
        }
    }
}

def get_board_pattern(board: str, class_num: int) -> Dict[str, Any]:
    """Get the appropriate exam pattern for a board and class"""
    if board not in BOARD_PATTERNS:
        raise ValueError(f"Unsupported board: {board}")
    
    if 6 <= class_num <= 8:
        return BOARD_PATTERNS[board]["class_6_to_8"]
    elif 9 <= class_num <= 10:
        return BOARD_PATTERNS[board]["class_9_to_10"]
    elif 11 <= class_num <= 12:
        return BOARD_PATTERNS[board]["class_11_to_12"]
    else:
        raise ValueError(f"Unsupported class: {class_num}")
