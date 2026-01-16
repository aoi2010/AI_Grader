# AI Grader - API Documentation

Base URL: `http://localhost:8000/api`

## Table of Contents
- [Exam Endpoints](#exam-endpoints)
- [Answer Endpoints](#answer-endpoints)
- [Evaluation Endpoints](#evaluation-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## Exam Endpoints

### Create Exam
Generate a new exam with AI-generated questions.

**Endpoint:** `POST /exam/create`

**Request Body:**
```json
{
  "user_name": "Student Name",
  "user_email": "student@example.com",
  "board": "CBSE",
  "class_num": 10,
  "subject": "Mathematics",
  "chapter_focus": "Quadratic Equations, Polynomials" // Optional
}
```

**Response:**
```json
{
  "id": 1,
  "board": "CBSE",
  "class_num": 10,
  "subject": "Mathematics",
  "chapter_focus": "Quadratic Equations, Polynomials",
  "duration_minutes": 180,
  "total_marks": 80,
  "status": "CREATED",
  "started_at": null,
  "current_question_index": 0,
  "total_questions": 36
}
```

---

### Start Exam
Begin an exam session and start the timer.

**Endpoint:** `POST /exam/start`

**Request Body:**
```json
{
  "exam_id": 1
}
```

**Response:** Returns `CurrentQuestionResponse` with first question.

---

### Get Current Question
Retrieve the current question based on sequential state.

**Endpoint:** `GET /exam/{exam_id}/current`

**Response:**
```json
{
  "exam": {
    "id": 1,
    "board": "CBSE",
    "class_num": 10,
    "subject": "Mathematics",
    "duration_minutes": 180,
    "total_marks": 80,
    "status": "IN_PROGRESS",
    "started_at": "2026-01-16T10:00:00",
    "current_question_index": 0,
    "total_questions": 36
  },
  "question": {
    "id": 1,
    "section": "A",
    "sequence_number": 1,
    "question_text": "Solve: $x^2 - 5x + 6 = 0$",
    "question_type": "MCQ",
    "marks": 1,
    "has_internal_choice": false,
    "alternative_question_text": null,
    "options_json": {
      "A": "$x = 2, 3$",
      "B": "$x = -2, -3$",
      "C": "$x = 1, 6$",
      "D": "$x = -1, -6$"
    }
  },
  "answer": null,
  "can_proceed": false,
  "is_last_question": false
}
```

---

### Next Question
Move to the next question (requires current question to be answered).

**Endpoint:** `POST /exam/{exam_id}/next`

**Response:** Returns `CurrentQuestionResponse` with next question.

**Validation:**
- Current question MUST have an answer (typed OR PDF uploaded)
- Returns 400 error if validation fails

---

### Submit Exam
Submit the exam for evaluation.

**Endpoint:** `POST /exam/{exam_id}/submit`

**Response:**
```json
{
  "message": "Exam submitted successfully",
  "exam_id": 1
}
```

---

### Get Timer State
Retrieve current timer state (for persistence across refreshes).

**Endpoint:** `GET /exam/{exam_id}/timer`

**Response:**
```json
{
  "time_remaining_seconds": 10500,
  "exam_started": true,
  "auto_submit": false
}
```

---

### Update Timer
Update timer state (for frontend persistence).

**Endpoint:** `POST /exam/{exam_id}/update-timer?time_remaining={seconds}`

---

## Answer Endpoints

### Save Answer
Save or update an answer for the current question.

**Endpoint:** `POST /answer/save`

**Request Body:**
```json
{
  "exam_id": 1,
  "question_id": 5,
  "typed_answer": "Given: $x^2 - 5x + 6 = 0$\n\nUsing quadratic formula:\n$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$",
  "selected_choice": "main", // "main" or "alternative" for internal choice
  "selected_option": "A" // For MCQs
}
```

**Response:**
```json
{
  "id": 1,
  "question_id": 5,
  "typed_answer": "Given: $x^2 - 5x + 6 = 0$...",
  "selected_choice": "main",
  "selected_option": null,
  "first_saved_at": "2026-01-16T10:05:00",
  "last_edited_at": "2026-01-16T10:05:00",
  "has_uploaded_files": false
}
```

**Important:**
- LaTeX backslashes are preserved exactly as typed
- Can only save answer for current question (sequential validation)
- Returns 400 if trying to answer out-of-sequence

---

### Upload PDF
Upload a PDF answer sheet for a specific question.

**Endpoint:** `POST /answer/upload-pdf/{exam_id}/{question_id}`

**Request:** `multipart/form-data`
- Field: `file` (PDF file)

**Response:**
```json
{
  "id": 1,
  "filename": "answer_sheet.pdf",
  "file_size": 524288,
  "uploaded_at": "2026-01-16T10:10:00"
}
```

**Validation:**
- Only PDF files accepted
- Maximum size: 10MB (configurable)
- Multiple PDFs allowed per question

---

### Get Uploaded Files
Retrieve all uploaded files for an answer.

**Endpoint:** `GET /answer/{answer_id}/files`

**Response:**
```json
{
  "files": [
    {
      "id": 1,
      "filename": "answer_sheet.pdf",
      "file_size": 524288,
      "uploaded_at": "2026-01-16T10:10:00"
    }
  ],
  "count": 1
}
```

---

### Final PDF Upload
Upload PDF after exam submission (during final upload phase).

**Endpoint:** `POST /answer/final-upload/{exam_id}`

**Request:** `multipart/form-data`
- Field: `file` (PDF file)
- Field: `question_number` (integer)

---

## Evaluation Endpoints

### Evaluate Exam
Trigger AI evaluation of a submitted exam.

**Endpoint:** `POST /evaluation/evaluate`

**Request Body:**
```json
{
  "exam_id": 1
}
```

**Response:**
```json
{
  "exam_id": 1,
  "evaluation_report": "SECTION-WISE ANALYSIS\n\nSection A - Multiple Choice Questions:\n...",
  "evaluated_at": "2026-01-16T13:00:00"
}
```

**Requirements:**
- Exam must be in SUBMITTED status
- Evaluation can take 30-60 seconds depending on answer length

---

### Get Evaluation Report
Retrieve existing evaluation report.

**Endpoint:** `GET /evaluation/{exam_id}/report`

**Response:** Same as evaluate endpoint

---

### Get Exam Summary
Get statistical summary of exam performance.

**Endpoint:** `GET /evaluation/{exam_id}/summary`

**Response:**
```json
{
  "exam_id": 1,
  "board": "CBSE",
  "class": 10,
  "subject": "Mathematics",
  "status": "EVALUATED",
  "total_questions": 36,
  "answered_questions": 34,
  "unanswered_questions": 2,
  "total_uploaded_pdfs": 5,
  "total_marks": 80,
  "duration_minutes": 180,
  "time_taken_minutes": 165,
  "started_at": "2026-01-16T10:00:00",
  "submitted_at": "2026-01-16T12:45:00",
  "evaluated_at": "2026-01-16T13:00:00"
}
```

---

### Get Full Question Paper
Retrieve complete question paper (after submission).

**Endpoint:** `GET /evaluation/{exam_id}/full-paper`

**Response:**
```json
{
  "exam_info": {
    "board": "CBSE",
    "class": 10,
    "subject": "Mathematics",
    "total_marks": 80,
    "duration_minutes": 180
  },
  "instructions": [
    "All questions are compulsory.",
    "Section A contains 20 MCQs of 1 mark each.",
    "..."
  ],
  "questions": [
    {
      "sequence_number": 1,
      "section": "A",
      "question_text": "Solve: $x^2 - 5x + 6 = 0$",
      "question_type": "MCQ",
      "marks": 1,
      "has_internal_choice": false,
      "alternative_question_text": null,
      "options": {...}
    }
  ]
}
```

---

## Data Models

### BoardEnum
```
CBSE
ICSE
WBBSE
```

### ExamStatus
```
CREATED      - Exam generated, not started
IN_PROGRESS  - Exam in progress
SUBMITTED    - Exam submitted, awaiting evaluation
EVALUATED    - Evaluation complete
```

### QuestionType
```
MCQ              - Multiple Choice Question
SHORT_ANSWER     - Short Answer
LONG_ANSWER      - Long Answer
CASE_STUDY       - Case Study
NUMERICAL        - Numerical Problem
```

---

## Error Handling

### Standard Error Response
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

**200 OK** - Request successful

**400 Bad Request** - Validation error
- Invalid input data
- Sequential answering violation
- Exam state violation

**404 Not Found** - Resource doesn't exist
- Exam not found
- Question not found
- Answer not found

**500 Internal Server Error** - Server error
- Gemini API error
- Database error
- File system error

---

## Sequential Answering Validation

The system enforces strict sequential answering:

1. **Current Question Index:** Tracked in `exam.current_question_index`

2. **Save Answer:** Can only save for current question
   - Validates `question_id` matches current question
   - Returns 400 if out of sequence

3. **Next Question:** Requires current question answered
   - Checks for typed answer OR uploaded PDF
   - Returns 400 if current question not answered

4. **State Persistence:** Survives page refresh
   - Current index stored in database
   - Timer state persisted
   - Answers auto-saved

---

## LaTeX Handling

**Storage:**
- Answers stored with raw LaTeX (backslashes preserved)
- NEVER stripped or modified

**Transmission:**
- JSON strings automatically escape backslashes
- Frontend receives: `"\\frac{x}{y}"`
- Displays correctly when rendered

**Evaluation:**
- Gemini receives raw LaTeX
- Instructed to respect all LaTeX notation
- No reformatting or simplification

---

## Rate Limits

**Gemini API:**
- Question generation: ~30-60 seconds
- Evaluation: ~30-60 seconds
- Consider implementing request queuing for high traffic

**File Upload:**
- Max size: 10MB per file
- No limit on number of files per question
- Total storage limited by disk space

---

## Best Practices

1. **Frontend Integration:**
   - Poll timer endpoint every second
   - Auto-save answers periodically
   - Handle network errors gracefully

2. **Error Handling:**
   - Show user-friendly error messages
   - Log errors for debugging
   - Retry failed API calls

3. **Performance:**
   - Cache question data
   - Minimize API calls
   - Use pagination for large datasets

4. **Security:**
   - Validate all inputs
   - Sanitize file uploads
   - Implement rate limiting in production

---

## Testing Examples

### cURL Examples

**Create Exam:**
```bash
curl -X POST http://localhost:8000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Test Student",
    "user_email": "test@example.com",
    "board": "CBSE",
    "class_num": 10,
    "subject": "Mathematics"
  }'
```

**Save Answer:**
```bash
curl -X POST http://localhost:8000/api/answer/save \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": 1,
    "question_id": 1,
    "typed_answer": "The answer is $x = 5$",
    "selected_option": "A"
  }'
```

**Upload PDF:**
```bash
curl -X POST http://localhost:8000/api/answer/upload-pdf/1/1 \
  -F "file=@answer.pdf"
```

---

For more information, see [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md).
