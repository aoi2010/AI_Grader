"""
Google Gemini Integration Service
Handles question paper generation and AI-based evaluation
"""
from google import genai
from typing import Dict, Any, List, Optional
import json
import time
import logging

from backend.config import settings, get_board_pattern

# Configure logging
logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini service with API key"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        # Updated fallback models based on ListModels API (Jan 2026)
        # Priority: Gemini 3.x > Gemini 2.5.x > Gemini 2.0.x > Gemma 3.x
        self.fallback_models = [
            # Tier 1: Gemini 3.x (latest generation)
            "gemini-3-flash-preview",
            "gemini-3-pro-preview",
            
            # Tier 2: Gemini 2.5.x (stable, high quality)
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.5-flash-lite",
            
            # Tier 3: Gemini 2.0.x (reliable fallback)
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash-lite",
            
            # Tier 4: Latest aliases (auto-update)
            "gemini-flash-latest",
            "gemini-pro-latest",
            
            # Tier 5: Gemma 3.x (lightweight fallback)
            "gemma-3-27b-it",
            "gemma-3-12b-it",
            "gemma-3-4b-it",
            "gemma-3-1b-it"
        ]
        self._available_models_cache: Optional[List[str]] = None
    
    def generate_question_paper(
        self,
        board: str,
        class_num: int,
        subject: str,
        chapter_focus: str = None,
        difficulty_level: str = "medium",
        syllabus_content: str = None
    ) -> Dict[str, Any]:
        """
        Generate a complete question paper using Gemini
        
        Args:
            board: Education board (CBSE/ICSE/WBBSE)
            class_num: Class number (6-12)
            subject: Subject name
            chapter_focus: Optional chapter-wise focus
            difficulty_level: easy, medium, hard, extreme, ultra_extreme
            syllabus_content: Extracted syllabus text from uploaded PDF
        
        Returns:
            Dictionary with question paper structure and metadata
        """
        pattern = get_board_pattern(board, class_num)
        
        prompt = self._create_question_generation_prompt(
            board=board,
            class_num=class_num,
            subject=subject,
            pattern=pattern,
            chapter_focus=chapter_focus,
            difficulty_level=difficulty_level,
            syllabus_content=syllabus_content
        )
        
        response = self._generate_with_fallback(prompt)
        
        # Parse the response and structure it
        return self._parse_question_paper_response(response.text, pattern)
    
    def _create_question_generation_prompt(
        self,
        board: str,
        class_num: int,
        subject: str,
        pattern: Dict[str, Any],
        chapter_focus: str = None,
        difficulty_level: str = "medium",
        syllabus_content: str = None
    ) -> str:
        """Create the prompt for question paper generation"""
        
        sections_description = "\n".join([
            f"  - Section {section}: {details['questions']} questions × {details['marks_each']} marks each ({details['type']})"
            for section, details in pattern['sections'].items()
        ])
        
        internal_choice_info = ""
        if pattern.get('internal_choice'):
            ic = pattern['internal_choice']
            internal_choice_info = f"\n- Internal Choice: {ic['questions_with_choice']} questions in sections {', '.join(ic['sections'])}"
        
        chapter_instruction = ""
        if chapter_focus:
            chapter_instruction = f"\n- Focus on these chapters/topics: {chapter_focus}"
        
        # Difficulty level descriptions
        difficulty_descriptions = {
            "easy": "EASY - Basic questions for beginners. Focus on fundamental concepts, direct application questions, and straightforward problems.",
            "medium": "MEDIUM - Standard board exam level. Balanced mix of basic and moderate difficulty questions as typically seen in regular board exams.",
            "hard": "HARD - Challenging questions for advanced students. Include complex multi-step problems, application-based questions, and HOTS (Higher Order Thinking Skills).",
            "extreme": "EXTREME - Competition level difficulty. Include questions similar to JEE Mains, NEET, and state-level competitive exams.",
            "ultra_extreme": "ULTRA EXTREME - Olympiad/JEE Advanced level. Include highly challenging questions requiring deep conceptual understanding, creative problem-solving, and advanced mathematical/scientific reasoning."
        }
        
        difficulty_instruction = f"\n- DIFFICULTY LEVEL: {difficulty_descriptions.get(difficulty_level, difficulty_descriptions['medium'])}"
        
        syllabus_instruction = ""
        if syllabus_content:
            syllabus_instruction = f"""\n\n**SYLLABUS REFERENCE (USE ONLY YEARLY/ANNUAL/FINAL EXAM CONTENT):**
The following is the student's syllabus. Generate questions ONLY from the YEARLY/ANNUAL/FINAL examination syllabus sections.
If other exams (like mid-term, unit tests) are referenced in the yearly syllabus, you may include those topics too.
---
{syllabus_content[:3000]}  
---
"""
        
        prompt = f"""You are an expert Indian education board examiner for {board}.

Generate a COMPLETE question paper for:
- Board: {board}
- Class: {class_num}
- Subject: {subject}
- Total Marks: {pattern['total_marks']}
- Duration: {pattern['duration_minutes']} minutes{chapter_instruction}{difficulty_instruction}{syllabus_instruction}

STRICT REQUIREMENTS:
1. Follow the EXACT {board} Class {class_num} pattern:
{sections_description}{internal_choice_info}

2. **MCQ RULE (MANDATORY):** ALL Multiple Choice Questions (MCQs) MUST be exactly 1 mark each. Never create MCQs with more than 1 mark.

3. For Mathematics and Science subjects:
   - Use proper LaTeX notation for all mathematical expressions
   - Use standard LaTeX commands: \\frac{{}}{{}}, \\sqrt{{}}, ^{{}}, _{{}}, \\int, \\sum, \\lim, etc.
   - Enclose inline math in $ and display math in $$
   - Example: "Solve $\\frac{{x^2 + 3x}}{{x - 1}} = 0$"

4. Question types:
   - MCQ: Provide 4 options (A, B, C, D) with clear marking of correct answer. **ALWAYS 1 MARK ONLY**
   - Short Answer: Clear, focused questions requiring step-wise solutions
   - Long Answer: Complex problems requiring detailed methodology
   - Case Study (if applicable): Real-world scenarios with sub-questions

5. Internal Choice:
   - Clearly mark questions with "OR" alternative
   - Both alternatives must be of equal difficulty and marks

6. Marks distribution must be EXACT per pattern

7. Use proper board-specific terminology and style

8. **DIFFICULTY CALIBRATION:** Strictly follow the specified difficulty level.

OUTPUT FORMAT (STRICT JSON):
{{
  "duration_minutes": {pattern['duration_minutes']},
  "total_marks": {pattern['total_marks']},
  "instructions": ["Instruction 1", "Instruction 2", ...],
  "sections": [
    {{
      "section": "A",
      "title": "Section A Title",
      "questions": [
        {{
          "question_number": 1,
          "question_text": "Question with LaTeX if needed: $x^2$",
          "question_type": "MCQ",
          "marks": 1,
          "has_internal_choice": false,
          "alternative_question_text": null,
          "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
          "correct_answer": "B"
        }}
      ]
    }}
  ]
}}

Generate the complete paper now. Output ONLY valid JSON, no additional text."""
        
        return prompt
    
    def _parse_question_paper_response(
        self,
        response_text: str,
        pattern: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse Gemini's response into structured format"""
        try:
            # Extract JSON from response (Gemini might wrap it in markdown)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            # First attempt: parse as-is
            try:
                paper_data = json.loads(response_text)
            except json.JSONDecodeError:
                import re

                # Try to isolate JSON if extra text exists
                start = response_text.find("{")
                end = response_text.rfind("}")
                if start != -1 and end != -1 and end > start:
                    response_text = response_text[start:end + 1]

                # Normalize smart quotes
                response_text = response_text.replace("“", '"').replace("”", '"')
                response_text = response_text.replace("‘", "'").replace("’", "'")

                # Remove trailing commas before } or ]
                response_text = re.sub(r",\s*([}\]])", r"\1", response_text)

                # Escape invalid backslash sequences (e.g., \1, \sqrt)
                # Valid JSON escapes: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
                response_text = re.sub(r"\\(?![\\/\"bfnrtu])", r"\\\\", response_text)

                try:
                    paper_data = json.loads(response_text)
                except json.JSONDecodeError:
                    try:
                        from json_repair import repair_json

                        repaired = repair_json(response_text)
                        paper_data = json.loads(repaired)
                    except Exception as repair_error:
                        raise repair_error

            # Validate structure
            if "sections" not in paper_data or "duration_minutes" not in paper_data:
                raise ValueError("Invalid paper structure from Gemini")

            # Enforce board pattern totals (e.g., CBSE must be 80)
            paper_data["total_marks"] = pattern["total_marks"]
            paper_data["duration_minutes"] = pattern["duration_minutes"]

            return paper_data
        
        except Exception as e:
            # Fallback: Return error structure
            raise ValueError(f"Failed to parse Gemini response: {str(e)}\n\nResponse: {response_text}")
    
    def evaluate_exam(
        self,
        board: str,
        class_num: int,
        subject: str,
        student_info: Dict[str, str],
        questions_with_answers: List[Dict[str, Any]],
        paper_json: Dict[str, Any],
        pdf_attachments: List[Dict[str, Any]] | None = None
    ) -> str:
        """
        Evaluate student's exam using Gemini as an examiner
        
        Args:
            board: Education board
            class_num: Class number
            subject: Subject name
            student_info: Student details (name, email)
            questions_with_answers: List of questions with student answers
            paper_json: Original question paper JSON
        
        Returns:
            Detailed evaluation report as formatted Markdown text
        """
        prompt = self._create_evaluation_prompt(
            board=board,
            class_num=class_num,
            subject=subject,
            student_info=student_info,
            questions_with_answers=questions_with_answers,
            paper_json=paper_json
        )
        
        contents = [prompt]
        if pdf_attachments:
            contents.extend(self._build_pdf_parts(pdf_attachments))

        response = self._generate_with_fallback(contents)
        return response.text
    
    def _create_evaluation_prompt(
        self,
        board: str,
        class_num: int,
        subject: str,
        student_info: Dict[str, str],
        questions_with_answers: List[Dict[str, Any]],
        paper_json: Dict[str, Any]
    ) -> str:
        """Create the prompt for exam evaluation"""
        
        # Format questions and answers
        qa_formatted = []
        for item in questions_with_answers:
            q = item['question']
            a = item['answer']
            
            answer_text = "**NOT ATTEMPTED**"
            if a:
                if a.get('typed_answer'):
                    answer_text = f"**Typed Answer:**\n{a['typed_answer']}"
                elif a.get('selected_option'):
                    answer_text = f"**Selected Option:** {a['selected_option']}"
                else:
                    answer_text = "**NO TYPED ANSWER**"
                
                if a.get('uploaded_files_count', 0) > 0:
                    filenames = ", ".join([f["filename"] for f in a.get("uploaded_files", [])])
                    answer_text += (
                        f"\n\n**[{a['uploaded_files_count']} PDF answer sheet(s) uploaded for this question]**"
                        + (f"\n**Files:** {filenames}" if filenames else "")
                    )
            
            # Build question text with OR option if present
            question_display = q['question_text']
            if q.get('has_internal_choice') and q.get('alternative_question_text'):
                question_display += f"\n\n**OR (Alternative Option):**\n{q['alternative_question_text']}"
                question_display += "\n\n**NOTE: Student must answer ONLY ONE of the above options (main OR alternative)**"
            
            qa_text = f"""
Question {q['sequence_number']} (Section {q['section']}) - {q['marks']} marks
Type: {q['question_type']}
{question_display}

{answer_text}
---"""
            qa_formatted.append(qa_text)
        
        qa_section = "\n".join(qa_formatted)
        
        prompt = f"""You are a highly experienced examiner for the {board} board, evaluating a Class {class_num} {subject} examination.

STUDENT INFORMATION:
- Name: {student_info.get('name', 'Unknown')}
- Email: {student_info.get('email', 'Unknown')}

CRITICAL EXAMINER RULES:
1. **STEP-WISE EVALUATION** (especially for Mathematics):
   - Evaluate the METHOD and APPROACH, not just the final answer
   - Award partial marks for correct methodology even if final answer is wrong
   - Do NOT hallucinate or assume missing steps
   - If a step is missing, explicitly state "Step X is missing"

2. **MARKS CALCULATION**:
   - Evaluate each answer and assign marks based on correctness
   - Provide TOTAL MARKS at the end in format: "Total Marks Achieved: X/{paper_json.get('total_marks', 'N/A')}"
   - Show section-wise marks breakdown
   - Award partial marks generously for correct methodology

3. **LaTeX HANDLING**:
   - Treat ALL LaTeX expressions as intentional
   - Do NOT reformat, simplify, or reinterpret equations
   - Recognize common LaTeX: \\frac{{}}{{}}, \\sqrt{{}}, ^{{}}, _{{}}, \\int, \\sum, etc.

4. **PDF ANSWER SHEETS (CRITICAL)**:
   - PDF files contain handwritten/scanned answers and are attached to this evaluation request
   - ALWAYS examine the PDF attachments first for each question
   - If a question shows "PDF answer sheet(s) uploaded", the answer is IN THE PDF
   - Evaluate based on what you see in the PDF images/scans
   - PDFs may contain answers for multiple questions - check page numbers and question numbers
   - If both typed and PDF answers exist, evaluate both and use the best one
   - DO NOT say "cannot access PDF" - the PDFs ARE attached to this prompt

5. **INTERNAL CHOICE / OR QUESTIONS (CRITICAL)**:
   - Questions marked with "OR (Alternative Option)" have TWO different options
   - Student is REQUIRED to answer ONLY ONE option (main question OR alternative)
   - **WHEN EVALUATING OR QUESTIONS:**
     a) First, identify which option the student answered by examining the PDF
     b) Look for clear indicators:
        - Question number written (e.g., "Q5(a)" vs "Q5(b)")
        - "OR" written or circled in the answer sheet
        - The option that has a complete, detailed answer
        - If student wrote "Attempting alternative" or similar note
     c) Once identified, evaluate ONLY that option for marks
     d) If student attempted BOTH options (which is wrong):
        - Mention this is incorrect in feedback
        - Evaluate the better/more complete attempt
        - Do NOT add marks from both attempts
     e) If completely unclear which was attempted:
        - Evaluate the option with most complete work
        - Mention in feedback: "Unable to clearly identify OR choice - evaluated most complete attempt"
   - **PDF CONTEXT**: When answers are in PDF, carefully examine the answer sheet structure
   - The PDF may show question numbers, OR markings, or which sub-part was attempted
   - Do NOT penalize if choice indicator is missing - just evaluate the answered option

6. **NO HALLUCINATION**:
   - Only evaluate what is provided in typed answers OR PDF attachments
   - Do NOT invent missing content or steps
   - Be honest about incomplete answers
   - If PDF is mentioned but answer unclear, state "PDF appears blank/unclear for this question"

6. **FEEDBACK STYLE**:
   - Formal, academic, board examination tone
   - Indian educational standards
   - Use Markdown formatting (headers, bold, lists, tables)
   - Constructive and specific
   - Address the student by name when providing feedback

7. **OUTPUT FORMAT (MARKDOWN)**:
   - Use # for main headers, ## for sections, ### for subsections
   - Use **bold** for emphasis
   - Use bullet points and numbered lists
   - Create a marks table at the end
   - Format: "Total Marks Achieved: X/{paper_json.get('total_marks', 'N/A')}"

---

EXAM DETAILS:
- Board: {board}
- Class: {class_num}
- Subject: {subject}
- Total Marks: {paper_json.get('total_marks', 'N/A')}
- Duration: {paper_json.get('duration_minutes', 'N/A')} minutes

---

QUESTIONS AND STUDENT ANSWERS:

{qa_section}

---

Provide a comprehensive evaluation report in Markdown format following the rules above. Include:
1. Student greeting with name
2. Section-wise evaluation with marks
3. Detailed feedback for each section
4. Overall strengths and weaknesses
5. **MUST END WITH: "Total Marks Achieved: X/{paper_json.get('total_marks', 'N/A')}"**
6. Percentage and grade recommendation"""
        
        return prompt

    def _build_pdf_parts(self, pdf_attachments: List[Dict[str, Any]]) -> List[Any]:
        """Build Gemini content parts for PDF attachments."""
        parts: List[Any] = []
        if not pdf_attachments:
            return parts

        # Add a mapping header
        parts.append("PDF attachments (use these to evaluate handwritten answers):")

        try:
            from google.genai import types  # type: ignore
        except Exception:
            types = None

        for item in pdf_attachments:
            q_num = item.get("question_number")
            filename = item.get("filename")
            file_path = item.get("file_path")
            if not file_path:
                continue

            parts.append(f"Question {q_num} PDF: {filename}")

            try:
                uploaded = self.client.files.upload(file=file_path)
                if types and hasattr(types, "Part"):
                    parts.append(types.Part.from_uri(uploaded.uri, mime_type=uploaded.mime_type))
                else:
                    parts.append(uploaded)
            except Exception:
                # Fallback: attach raw bytes if supported
                try:
                    with open(file_path, "rb") as f:
                        data = f.read()
                    if types and hasattr(types, "Part"):
                        parts.append(types.Part.from_bytes(data=data, mime_type="application/pdf"))
                except Exception:
                    # If attachment fails, continue without stopping evaluation
                    continue

        return parts

    def _generate_with_fallback(self, contents: Any) -> Any:
        """Generate content with fallback models on quota errors."""
        tried: List[str] = []
        models = self._resolve_model_candidates()
        
        logger.info(f"Starting generation with {len(models)} available models")

        last_error: Optional[Exception] = None
        for idx, model in enumerate(models):
            try:
                logger.info(f"🤖 Attempting model: {model} (attempt {idx + 1}/{len(models)})")
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents
                )
                logger.info(f"✅ SUCCESS: {model} generated response successfully")
                return response
            except Exception as e:
                last_error = e
                tried.append(model)
                message = str(e)
                error_type = "UNKNOWN"
                
                if "RESOURCE_EXHAUSTED" in message or "429" in message:
                    error_type = "QUOTA_EXHAUSTED"
                    logger.warning(f"⚠️  {model} failed: {error_type} - Retrying with next model...")
                    # brief backoff and retry next model
                    time.sleep(0.5 * (idx + 1))
                    continue
                if "NOT_FOUND" in message or "404" in message:
                    error_type = "MODEL_NOT_FOUND"
                    logger.warning(f"⚠️  {model} failed: {error_type} - Refreshing model list...")
                    # Refresh available models and retry with updated list
                    self._available_models_cache = None
                    models = self._resolve_model_candidates()
                    continue
                
                logger.error(f"❌ {model} failed: {message[:100]}")
                # non-quota errors should surface immediately
                raise

        logger.error(f"❌ All models exhausted. Tried: {', '.join(tried)}")
        raise ValueError(f"All Gemini models exhausted. Tried: {', '.join(tried)}. Last error: {last_error}")

    def _resolve_model_candidates(self) -> List[str]:
        """Resolve a list of available models that support generateContent."""
        if self._available_models_cache is None:
            try:
                logger.info("🔍 Discovering available models from API...")
                models = []
                for m in self.client.models.list():
                    name = getattr(m, "name", None)
                    supported = getattr(m, "supported_generation_methods", None)
                    if not name:
                        continue
                    if supported and "generateContent" not in supported:
                        continue
                    # Exclude non-text models (tts/embedding/robotics)
                    lowered = name.lower()
                    if "tts" in lowered or "embedding" in lowered or "robotics" in lowered:
                        continue
                    models.append(name)
                if models:
                    self._available_models_cache = models
                    logger.info(f"✅ Discovered {len(models)} generation-capable models")
                else:
                    self._available_models_cache = []
                    logger.warning("⚠️  No models discovered, using fallback list")
            except Exception as e:
                logger.error(f"❌ Model discovery failed: {str(e)}")
                self._available_models_cache = []

        # Prefer configured model if available, otherwise fall back
        candidates: List[str] = []
        if self._available_models_cache:
            if self.model_name in self._available_models_cache:
                candidates.append(self.model_name)
            # If configured model isn't available, try exact fallback names or prefix match
            for m in self.fallback_models:
                if m in self._available_models_cache and m not in candidates:
                    candidates.append(m)
            # Add any remaining available models as last resort
            for m in self._available_models_cache:
                if m not in candidates:
                    candidates.append(m)
        else:
            # If discovery failed, use configured model + static fallbacks
            candidates = [self.model_name] + [m for m in self.fallback_models if m != self.model_name]

        return candidates


# Singleton instance
gemini_service = GeminiService()
