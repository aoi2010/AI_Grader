"""
Google Gemini Integration Service
Handles question paper generation and AI-based evaluation
"""
from google import genai
from typing import Dict, Any, List
import json

from backend.config import settings, get_board_pattern


class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini service with API key"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
    
    def generate_question_paper(
        self,
        board: str,
        class_num: int,
        subject: str,
        chapter_focus: str = None
    ) -> Dict[str, Any]:
        """
        Generate a complete question paper using Gemini
        
        Args:
            board: Education board (CBSE/ICSE/WBBSE)
            class_num: Class number (6-12)
            subject: Subject name
            chapter_focus: Optional chapter-wise focus
        
        Returns:
            Dictionary with question paper structure and metadata
        """
        pattern = get_board_pattern(board, class_num)
        
        prompt = self._create_question_generation_prompt(
            board=board,
            class_num=class_num,
            subject=subject,
            pattern=pattern,
            chapter_focus=chapter_focus
        )
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )
        
        # Parse the response and structure it
        return self._parse_question_paper_response(response.text, pattern)
    
    def _create_question_generation_prompt(
        self,
        board: str,
        class_num: int,
        subject: str,
        pattern: Dict[str, Any],
        chapter_focus: str = None
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
        
        prompt = f"""You are an expert Indian education board examiner for {board}.

Generate a COMPLETE question paper for:
- Board: {board}
- Class: {class_num}
- Subject: {subject}
- Total Marks: {pattern['total_marks']}
- Duration: {pattern['duration_minutes']} minutes{chapter_instruction}

STRICT REQUIREMENTS:
1. Follow the EXACT {board} Class {class_num} pattern:
{sections_description}{internal_choice_info}

2. For Mathematics and Science subjects:
   - Use proper LaTeX notation for all mathematical expressions
   - Use standard LaTeX commands: \\frac{{}}{{}}, \\sqrt{{}}, ^{{}}, _{{}}, \\int, \\sum, \\lim, etc.
   - Enclose inline math in $ and display math in $$
   - Example: "Solve $\\frac{{x^2 + 3x}}{{x - 1}} = 0$"

3. Question types:
   - MCQ: Provide 4 options (A, B, C, D) with clear marking of correct answer
   - Short Answer: Clear, focused questions requiring step-wise solutions
   - Long Answer: Complex problems requiring detailed methodology
   - Case Study (if applicable): Real-world scenarios with sub-questions

4. Internal Choice:
   - Clearly mark questions with "OR" alternative
   - Both alternatives must be of equal difficulty and marks

5. Marks distribution must be EXACT per pattern

6. Use proper board-specific terminology and style

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
            
            # Fix backslash issues for JSON parsing
            # Gemini may use \1, \sqrt, \frac etc which are not valid JSON escape sequences
            # We need to escape all backslashes properly for JSON
            import re
            
            # Simply double all backslashes to make them JSON-safe
            # This converts \1 -> \\1, \sqrt -> \\sqrt, etc.
            response_text = response_text.replace('\\', '\\\\')
            
            paper_data = json.loads(response_text)
            
            # Validate structure
            if "sections" not in paper_data or "duration_minutes" not in paper_data:
                raise ValueError("Invalid paper structure from Gemini")
            
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
        paper_json: Dict[str, Any]
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
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )
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
                    answer_text += f"\n\n**[{a['uploaded_files_count']} PDF answer sheet(s) uploaded for this question]**"
            
            qa_text = f"""
Question {q['sequence_number']} (Section {q['section']}) - {q['marks']} marks
Type: {q['question_type']}
{q['question_text']}

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

4. **PDF ANSWER SHEETS**:
   - If PDFs are uploaded, acknowledge that detailed work may exist there
   - Do NOT penalize for brevity in typed answers if PDF is uploaded
   - Mention: "Detailed working referenced in uploaded answer sheet"

5. **NO HALLUCINATION**:
   - Only evaluate what is provided
   - Do NOT invent missing content or steps
   - Be honest about incomplete answers

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


# Singleton instance
gemini_service = GeminiService()
