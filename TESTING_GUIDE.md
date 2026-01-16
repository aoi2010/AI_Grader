# AI Grader - Testing & Validation Guide

## Pre-Launch Checklist

### ✅ Environment Setup
- [ ] Python 3.11+ installed
- [ ] Virtual environment created
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with valid Gemini API key
- [ ] Database initialized (auto-created on first run)
- [ ] Upload directory exists and is writable

### ✅ Backend Tests
- [ ] Server starts without errors
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] API documentation accessible: `http://localhost:8000/docs`
- [ ] Database tables created (check `ai_grader.db`)

### ✅ Frontend Tests
- [ ] Index page loads: `http://localhost:8000`
- [ ] MathJax loads (check browser console)
- [ ] No JavaScript errors in console
- [ ] All screens render correctly

---

## Feature Testing Checklist

### 1. Exam Creation

**Test Case 1.1: Valid Exam Creation**
- Board: CBSE
- Class: 10
- Subject: Mathematics
- Expected: Exam created successfully with 36 questions

**Test Case 1.2: Board Patterns**
- Test each board: CBSE, ICSE, WBBSE
- Test each class range: 6-8, 9-10, 11-12
- Expected: Correct pattern applied

**Test Case 1.3: Chapter Focus**
- Add chapter focus: "Quadratic Equations, Polynomials"
- Expected: Questions focused on specified chapters

**Test Case 1.4: Validation**
- Submit without email
- Submit invalid email
- Expected: Validation errors shown

**Test Case 1.5: Gemini Integration**
- Valid API key
- Expected: Questions generated in 30-60 seconds
- Invalid API key
- Expected: Clear error message

---

### 2. Sequential Answering

**Test Case 2.1: First Question Only**
- Start exam
- Try to access Question 2 directly via API
- Expected: 400 error, must answer Q1 first

**Test Case 2.2: Next Button Disabled**
- Load question without answering
- Expected: "Next Question" button disabled
- Save answer
- Expected: Button enabled

**Test Case 2.3: Save and Progress**
- Answer Q1
- Click "Next Question"
- Expected: Q2 loads
- Try to save answer for Q1 again
- Expected: 400 error, can only answer current question

**Test Case 2.4: Page Refresh**
- Answer Q1, Q2, Q3
- Refresh page
- Expected: Loads Q4 (current position maintained)

**Test Case 2.5: PDF as Answer**
- Upload PDF for Q1 (no typed answer)
- Click "Next Question"
- Expected: Allowed to proceed

---

### 3. LaTeX Rendering

**Test Case 3.1: Inline Math**
- Input: `The solution is $x = 5$`
- Expected: "5" rendered as math

**Test Case 3.2: Display Math**
- Input: `$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$`
- Expected: Integral rendered in display mode

**Test Case 3.3: Complex Expressions**
- Input: `$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$`
- Expected: Quadratic formula rendered correctly

**Test Case 3.4: Backslash Preservation**
- Save answer with LaTeX
- Reload question
- Expected: Backslashes intact, renders correctly

**Test Case 3.5: Live Preview**
- Type LaTeX in answer box
- Expected: Preview updates in real-time

---

### 4. Timer System

**Test Case 4.1: Timer Start**
- Start exam
- Expected: Timer shows full duration (e.g., 03:00:00)
- Countdown begins

**Test Case 4.2: Timer Persistence**
- Start exam, wait 2 minutes
- Refresh page
- Expected: Timer continues from correct time

**Test Case 4.3: Color Coding**
- Time > 10 min: Blue
- Time < 10 min: Orange (warning)
- Time < 5 min: Red (danger) with pulse

**Test Case 4.4: Auto-Submit**
- Set short duration (modify pattern or fast-forward time)
- Expected: Auto-submits when time reaches 0

**Test Case 4.5: Timer After Refresh**
- Start exam
- Close browser
- Reopen after 5 minutes
- Expected: Timer reflects actual elapsed time

---

### 5. PDF Upload

**Test Case 5.1: Valid Upload**
- Select PDF file (<10MB)
- Click "Upload PDF"
- Expected: Success message, file listed

**Test Case 5.2: File Type Validation**
- Try to upload .jpg or .docx
- Expected: Error "Only PDF files allowed"

**Test Case 5.3: File Size Validation**
- Upload PDF >10MB
- Expected: Error "File size exceeds maximum"

**Test Case 5.4: Multiple PDFs**
- Upload 3 PDFs for same question
- Expected: All 3 listed, all stored

**Test Case 5.5: PDF Persistence**
- Upload PDF for Q1
- Go to Q2, then back to Q1
- Expected: PDF still listed

**Test Case 5.6: Final Upload Phase**
- Complete all questions
- Submit exam
- Upload additional PDF for Q5
- Expected: Upload succeeds

---

### 6. MCQ Handling

**Test Case 6.1: Option Selection**
- Click option B
- Expected: B highlighted/selected

**Test Case 6.2: Change Selection**
- Select A, then select C
- Expected: Only C selected

**Test Case 6.3: Save MCQ Answer**
- Select option and save
- Expected: Answer saved, can proceed

**Test Case 6.4: Reload MCQ Answer**
- Save selected option B
- Refresh page
- Expected: B still selected

---

### 7. Internal Choice

**Test Case 7.1: Choice Display**
- Question with internal choice
- Expected: Both options shown with OR

**Test Case 7.2: Choice Selection**
- Select "alternative"
- Type answer
- Save
- Expected: Choice and answer saved

**Test Case 7.3: Choice Persistence**
- Save with alternative choice
- Reload
- Expected: Alternative radio button selected

---

### 8. Exam Submission

**Test Case 8.1: Complete Submission**
- Answer all questions
- Click final "Next" button
- Expected: Submission screen shown

**Test Case 8.2: Partial Submission**
- Answer only 10 of 36 questions
- Skip to submission via timeout
- Expected: Summary shows 10 answered, 26 unanswered

**Test Case 8.3: Answer Locking**
- Submit exam
- Try to save answer via API
- Expected: 400 error, answers locked

**Test Case 8.4: Multiple Submissions**
- Submit exam
- Try to submit again
- Expected: Error "Already submitted"

---

### 9. AI Evaluation

**Test Case 9.1: Evaluation Trigger**
- Submit exam
- Click "Submit for Evaluation"
- Expected: Loading screen, then results

**Test Case 9.2: Step-Wise Feedback (Math)**
- Answer with partial steps
- Expected: Evaluation mentions missing steps specifically

**Test Case 9.3: LaTeX in Evaluation**
- Use LaTeX in answers
- Expected: Evaluation references equations correctly

**Test Case 9.4: PDF References**
- Upload PDFs for answers
- Expected: Evaluation mentions "referenced in uploaded sheet"

**Test Case 9.5: MCQ Evaluation**
- Answer MCQs correctly and incorrectly
- Expected: Evaluation identifies correct/incorrect

**Test Case 9.6: Unanswered Questions**
- Leave questions unanswered
- Expected: Clearly marked as "NOT ATTEMPTED"

---

### 10. Report Generation

**Test Case 10.1: Summary Display**
- View exam summary
- Expected: Shows all statistics correctly

**Test Case 10.2: Section-Wise Analysis**
- Review evaluation report
- Expected: Organized by sections (A, B, C, D)

**Test Case 10.3: Download Report**
- Click "Download Full Report"
- Expected: Text file downloads with full content

**Test Case 10.4: Full Paper Access**
- Submit exam
- Access full paper endpoint
- Expected: All questions visible

---

## Performance Testing

### Load Test
- Create 10 exams simultaneously
- Expected: All succeed within reasonable time

### Concurrent Users
- 5 users taking exams concurrently
- Expected: No interference, state isolation

### Large Answers
- Type 2000+ word answer with extensive LaTeX
- Expected: Saves and renders without issues

### Multiple PDFs
- Upload 10 PDFs across different questions
- Expected: All stored and retrievable

---

## Security Testing

### Sequential Bypass Attempts
- Try to answer Q10 when on Q1 (via API)
- Expected: 400 error

### File Upload Attacks
- Try to upload .exe as .pdf (rename)
- Expected: Validation catches it

### Exam State Manipulation
- Try to change exam status via direct API call
- Expected: Validation prevents it

---

## Edge Cases

### Empty Answers
- Save answer with only whitespace
- Expected: Treated as empty, can't proceed

### Special Characters
- Use special characters in typed answer
- Expected: Stored and displayed correctly

### Very Long Questions
- Generate exam with 100+ questions (modify pattern)
- Expected: Handles gracefully

### Network Interruption
- Disconnect during answer save
- Reconnect and retry
- Expected: Handles gracefully

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)

Check:
- [ ] MathJax renders
- [ ] File upload works
- [ ] Timer functions
- [ ] All buttons work
- [ ] Responsive on mobile

---

## Database Validation

### Check Tables
```sql
SELECT * FROM users;
SELECT * FROM exams;
SELECT * FROM questions LIMIT 5;
SELECT * FROM answers;
SELECT * FROM uploaded_files;
```

### Verify Relationships
- Each question belongs to an exam
- Each answer links to valid question
- Each file links to valid answer

### Check Constraints
- No duplicate user emails
- Sequential question numbering
- Valid enum values

---

## API Testing (Postman/cURL)

### Create Exam
```bash
curl -X POST http://localhost:8000/api/exam/create \
  -H "Content-Type: application/json" \
  -d '{"user_name":"Test","user_email":"test@test.com","board":"CBSE","class_num":10,"subject":"Math"}'
```

### Save Answer
```bash
curl -X POST http://localhost:8000/api/answer/save \
  -H "Content-Type: application/json" \
  -d '{"exam_id":1,"question_id":1,"typed_answer":"Test answer"}'
```

### Get Current Question
```bash
curl http://localhost:8000/api/exam/1/current
```

---

## Common Issues & Fixes

**Issue:** MathJax not rendering
- **Fix:** Check console for CDN errors, wait for load

**Issue:** Timer not updating
- **Fix:** Check API connectivity, verify exam started

**Issue:** Can't proceed to next question
- **Fix:** Ensure answer saved or PDF uploaded

**Issue:** Gemini API timeout
- **Fix:** Check API key, retry, check quota

**Issue:** PDF upload fails
- **Fix:** Check file size, verify upload directory writable

---

## Production Readiness Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Error handling comprehensive
- [ ] Loading states for all async operations
- [ ] User feedback for all actions
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] API rate limiting implemented
- [ ] Logging configured
- [ ] Documentation complete

---

## Test Data

### Sample Student
- Name: Rajesh Kumar
- Email: rajesh.kumar@example.com
- Board: CBSE
- Class: 10
- Subject: Mathematics

### Sample LaTeX Answers
```
Question: Solve quadratic equation
Answer: Using formula: $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$
Given: $a=1, b=-5, c=6$
Therefore: $x = \frac{5 \pm \sqrt{25-24}}{2} = \frac{5 \pm 1}{2}$
Solutions: $x = 3$ or $x = 2$
```

---

**Testing Completed:** ☐

**Date:** _______________

**Tested By:** _______________

**Issues Found:** _______________

**All Critical Features Working:** ☐
