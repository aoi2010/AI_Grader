// AI Grader - Frontend Application
// API Base URL
const API_BASE = window.location.origin + '/api';

// Global state
let currentExam = null;
let timerInterval = null;

// ==================== Utility Functions ====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

function hideStatus(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(API_BASE + endpoint, options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
    }
    
    return await response.json();
}

// ==================== MathJax Rendering ====================

function renderMath(elementId) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        const element = document.getElementById(elementId);
        if (element) {
            window.MathJax.typesetPromise([element]).catch((err) => {
                console.error('MathJax rendering error:', err);
            });
        }
    }
}

// Live preview for answer input
function updateAnswerPreview() {
    const input = document.getElementById('answerInput').value;
    const preview = document.getElementById('answerPreview');
    
    if (input.trim() === '') {
        preview.innerHTML = '<em style="color: #94a3b8;">Your answer preview will appear here...</em>';
    } else {
        preview.textContent = input;
        renderMath('answerPreview');
    }
}

// ==================== Setup Screen ====================

document.getElementById('createExamBtn').addEventListener('click', async () => {
    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();
    const board = document.getElementById('board').value;
    const classNum = parseInt(document.getElementById('classNum').value);
    const subject = document.getElementById('subject').value.trim();
    const chapterFocus = document.getElementById('chapterFocus').value.trim() || null;
    const customDuration = document.getElementById('customDuration').value.trim();
    
    // Validation
    if (!userName || !userEmail || !board || !classNum || !subject) {
        showStatus('setupStatus', 'Please fill in all required fields', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
        showStatus('setupStatus', 'Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading
    const btn = document.getElementById('createExamBtn');
    btn.disabled = true;
    btn.textContent = 'Generating exam paper...';
    showStatus('setupStatus', 'Generating your exam paper using AI. This may take a moment...', 'info');
    
    try {
        const requestBody = {
            user_name: userName,
            user_email: userEmail,
            board,
            class_num: classNum,
            subject,
            chapter_focus: chapterFocus
        };
        
        // Add custom duration if specified
        if (customDuration && parseInt(customDuration) > 0) {
            requestBody.custom_duration_minutes = parseInt(customDuration);
        }
        
        const exam = await apiCall('/exam/create', 'POST', requestBody);
        
        currentExam = exam;
        
        // Show instructions screen
        displayExamInstructions(exam);
        showScreen('instructions-screen');
        
    } catch (error) {
        showStatus('setupStatus', 'Error: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Generate Exam Paper';
    }
});

function displayExamInstructions(exam) {
    const examInfo = document.getElementById('examInfo');
    examInfo.innerHTML = `
        <h3>Exam Details</h3>
        <p><strong>Board:</strong> ${exam.board}</p>
        <p><strong>Class:</strong> ${exam.class_num}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>Total Marks:</strong> ${exam.total_marks}</p>
        <p><strong>Duration:</strong> ${exam.duration_minutes} minutes</p>
        <p><strong>Total Questions:</strong> ${exam.total_questions}</p>
    `;
}

// ==================== Instructions Screen ====================

let allQuestions = []; // Store all questions for navigation

document.getElementById('startExamBtn').addEventListener('click', async () => {
    try {
        const response = await apiCall('/exam/start', 'POST', {
            exam_id: currentExam.id
        });
        
        // Fetch all questions for navigation
        await loadAllQuestions();
        
        // Load first question
        await loadQuestionByIndex(0);
        showScreen('exam-screen');
        startTimer();
        
    } catch (error) {
        alert('Error starting exam: ' + error.message);
    }
});

// Load all questions for navigation
async function loadAllQuestions() {
    try {
        const response = await apiCall(`/exam/${currentExam.id}/questions`);
        allQuestions = response;
        buildQuestionNavigator();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Build question navigator grid
function buildQuestionNavigator() {
    const container = document.getElementById('questionButtons');
    container.innerHTML = '';
    
    allQuestions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'question-btn';
        btn.textContent = index + 1;
        btn.dataset.index = index;
        btn.dataset.questionId = q.id;
        btn.onclick = () => loadQuestionByIndex(index);
        container.appendChild(btn);
    });
}

// Load question by index
async function loadQuestionByIndex(index) {
    if (index < 0 || index >= allQuestions.length) return;
    
    currentExam.current_question_index = index;
    await loadCurrentQuestion();
    
    // Update navigator buttons
    updateNavigatorButtons();
    
    // Update prev/next button states
    document.getElementById('prevQuestionBtn').disabled = (index === 0);
    document.getElementById('nextQuestionBtn').disabled = false;
    
    if (index === allQuestions.length - 1) {
        document.getElementById('nextQuestionBtn').textContent = 'Finish Exam';
    } else {
        document.getElementById('nextQuestionBtn').textContent = 'Next Question →';
    }
}

// Update navigator button states
async function updateNavigatorButtons() {
    try {
        // Fetch answered questions
        const response = await apiCall(`/exam/${currentExam.id}/answers`);
        const answeredIds = new Set(response.map(a => a.question_id));
        
        document.querySelectorAll('.question-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.index);
            const qId = parseInt(btn.dataset.questionId);
            
            btn.classList.remove('current', 'answered');
            
            if (idx === currentExam.current_question_index) {
                btn.classList.add('current');
            } else if (answeredIds.has(qId)) {
                btn.classList.add('answered');
            }
        });
    } catch (error) {
        console.error('Error updating navigator:', error);
    }
}

// Navigation button handlers
document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    loadQuestionByIndex(currentExam.current_question_index - 1);
});

document.getElementById('nextQuestionBtn').addEventListener('click', async () => {
    const nextIndex = currentExam.current_question_index + 1;
    
    if (nextIndex >= allQuestions.length) {
        // Show submission screen
        showScreen('submission-screen');
        stopTimer();
    } else {
        loadQuestionByIndex(nextIndex);
    }
});

// ==================== Exam Screen ====================

async function loadCurrentQuestion() {
    try {
        const index = currentExam.current_question_index;
        if (index >= allQuestions.length) {
            showScreen('submission-screen');
            stopTimer();
            return;
        }
        
        const question = allQuestions[index];
        
        // Update exam metadata
        document.getElementById('examTitle').textContent = 
            `${currentExam.board} - Class ${currentExam.class_num} - ${currentExam.subject}`;
        document.getElementById('questionProgress').textContent = 
            `Question ${index + 1} of ${allQuestions.length}`;
        
        // Display question
        displayQuestion(question);
        
        // Load existing answer if any
        try {
            const answerResponse = await apiCall(`/answer/get/${currentExam.id}/${question.id}`);
            if (answerResponse && answerResponse !== null) {
                loadAnswer(answerResponse);
            } else {
                clearAnswer();
            }
        } catch (error) {
            console.error('Error fetching answer:', error);
            clearAnswer();
        }
        
        // Update navigator
        updateNavigatorButtons();
        
    } catch (error) {
        console.error('Error loading question:', error);
        showStatus('answerStatus', 'Error loading question: ' + error.message, 'error');
    }
}

function displayQuestion(question) {
    document.getElementById('sectionLabel').textContent = `Section ${question.section} - Q${question.sequence_number}`;
    document.getElementById('marksLabel').textContent = `${question.marks} marks`;
    
    const questionContent = document.getElementById('questionContent');
    questionContent.textContent = question.question_text;
    renderMath('questionContent');
    
    // Handle MCQ options
    const mcqOptions = document.getElementById('mcqOptions');
    if (question.question_type === 'MCQ' && question.options_json) {
        mcqOptions.style.display = 'block';
        mcqOptions.innerHTML = '';
        
        for (const [key, value] of Object.entries(question.options_json)) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'mcq-option';
            optionDiv.innerHTML = `
                <input type="radio" name="mcq" value="${key}" id="opt${key}">
                <label for="opt${key}"><strong>${key}.</strong> ${value}</label>
            `;
            optionDiv.addEventListener('click', () => {
                document.getElementById(`opt${key}`).checked = true;
                document.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
            });
            mcqOptions.appendChild(optionDiv);
        }
    } else {
        mcqOptions.style.display = 'none';
    }
    
    // Handle internal choice
    const internalChoice = document.getElementById('internalChoice');
    if (question.has_internal_choice && question.alternative_question_text) {
        internalChoice.style.display = 'block';
        internalChoice.innerHTML = `
            <label>
                <input type="radio" name="choice" value="main" checked>
                Answer the above question
            </label>
            <label>
                <input type="radio" name="choice" value="alternative">
                OR answer: ${question.alternative_question_text}
            </label>
        `;
    } else {
        internalChoice.style.display = 'none';
    }
    
    // Store current question ID
    document.getElementById('answerInput').dataset.questionId = question.id;
}

function loadAnswer(answer) {
    if (answer.typed_answer) {
        document.getElementById('answerInput').value = answer.typed_answer;
        updateAnswerPreview();
    }
    
    if (answer.selected_option) {
        const radio = document.querySelector(`input[value="${answer.selected_option}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.mcq-option').classList.add('selected');
        }
    }
    
    if (answer.selected_choice) {
        const choiceRadio = document.querySelector(`input[name="choice"][value="${answer.selected_choice}"]`);
        if (choiceRadio) choiceRadio.checked = true;
    }
    
    // Load uploaded files
    if (answer.has_uploaded_files) {
        loadUploadedFiles(answer.id);
    }
}

function clearAnswer() {
    document.getElementById('answerInput').value = '';
    updateAnswerPreview();
    document.querySelectorAll('input[name="mcq"]').forEach(r => r.checked = false);
    document.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('uploadedFiles').innerHTML = '';
}

async function loadUploadedFiles(answerId) {
    try {
        const response = await apiCall(`/answer/${answerId}/files`);
        const filesContainer = document.getElementById('uploadedFiles');
        filesContainer.innerHTML = '';
        
        response.files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'uploaded-file-item';
            fileDiv.innerHTML = `
                <div class="file-info">
                    <div class="file-name">📄 ${file.filename}</div>
                    <div class="file-size">${(file.file_size / 1024).toFixed(2)} KB</div>
                </div>
            `;
            filesContainer.appendChild(fileDiv);
        });
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Answer input with live preview
document.getElementById('answerInput').addEventListener('input', updateAnswerPreview);

// Save answer
document.getElementById('saveAnswerBtn').addEventListener('click', async () => {
    const questionId = parseInt(document.getElementById('answerInput').dataset.questionId);
    const typedAnswer = document.getElementById('answerInput').value.trim() || null;
    
    const selectedMcq = document.querySelector('input[name="mcq"]:checked');
    const selectedOption = selectedMcq ? selectedMcq.value : null;
    
    const selectedChoice = document.querySelector('input[name="choice"]:checked');
    const choice = selectedChoice ? selectedChoice.value : null;
    
    // Validation: at least one answer method required
    if (!typedAnswer && !selectedOption) {
        showStatus('answerStatus', 'Please provide an answer (typed or MCQ selection)', 'error');
        return;
    }
    
    try {
        await apiCall('/answer/save', 'POST', {
            exam_id: currentExam.id,
            question_id: questionId,
            typed_answer: typedAnswer,
            selected_option: selectedOption,
            selected_choice: choice
        });
        
        showStatus('answerStatus', 'Answer saved successfully!', 'success');
        
        // Update navigator to show this question as answered
        updateNavigatorButtons();
        
    } catch (error) {
        showStatus('answerStatus', 'Error: ' + error.message, 'error');
    }
});

// Upload PDF
document.getElementById('uploadPdfBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('pdfUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('answerStatus', 'Please select a PDF file', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showStatus('answerStatus', 'Only PDF files are allowed', 'error');
        return;
    }
    
    const questionId = parseInt(document.getElementById('answerInput').dataset.questionId);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(
            `${API_BASE}/answer/upload-pdf/${currentExam.id}/${questionId}`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail);
        }
        
        showStatus('answerStatus', 'PDF uploaded successfully!', 'success');
        document.getElementById('nextQuestionBtn').disabled = false;
        
        // Reload question to show uploaded files
        await loadCurrentQuestion();
        
        // Clear file input
        fileInput.value = '';
        
    } catch (error) {
        showStatus('answerStatus', 'Error: ' + error.message, 'error');
    }
});

// Next question
document.getElementById('nextQuestionBtn').addEventListener('click', async () => {
    hideStatus('answerStatus');
    
    try {
        await apiCall(`/exam/${currentExam.id}/next`, 'POST');
        await loadCurrentQuestion();
        
    } catch (error) {
        showStatus('answerStatus', 'Error: ' + error.message, 'error');
    }
});

// ==================== Timer ====================

function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(async () => {
        await updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

async function updateTimerDisplay() {
    try {
        const response = await apiCall(`/exam/${currentExam.id}/timer`);
        
        if (response.auto_submit) {
            // Time's up - auto submit
            stopTimer();
            await submitExam();
            return;
        }
        
        const seconds = response.time_remaining_seconds;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer');
        timerElement.textContent = display;
        
        // Color coding
        timerElement.classList.remove('warning', 'danger');
        if (seconds < 300) { // Less than 5 minutes
            timerElement.classList.add('danger');
        } else if (seconds < 600) { // Less than 10 minutes
            timerElement.classList.add('warning');
        }
        
    } catch (error) {
        console.error('Timer error:', error);
    }
}

// ==================== Submission Screen ====================

document.getElementById('finalUploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('finalPdfUpload');
    const questionNumber = parseInt(document.getElementById('finalQuestionNumber').value);
    
    if (!fileInput.files[0]) {
        showStatus('finalUploadStatus', 'Please select a PDF file', 'error');
        return;
    }
    
    if (!questionNumber) {
        showStatus('finalUploadStatus', 'Please enter question number', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('question_number', questionNumber);
    
    try {
        const response = await fetch(
            `${API_BASE}/answer/final-upload/${currentExam.id}`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail);
        }
        
        showStatus('finalUploadStatus', 'PDF uploaded successfully!', 'success');
        fileInput.value = '';
        document.getElementById('finalQuestionNumber').value = '';
        
    } catch (error) {
        showStatus('finalUploadStatus', 'Error: ' + error.message, 'error');
    }
});

document.getElementById('submitExamBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to submit? You cannot edit answers after submission.')) {
        return;
    }
    
    await submitExam();
});

async function submitExam() {
    try {
        await apiCall(`/exam/${currentExam.id}/submit`, 'POST');
        
        // Show evaluation screen
        showScreen('evaluation-screen');
        
        // Start evaluation
        await evaluateExam();
        
    } catch (error) {
        alert('Error submitting exam: ' + error.message);
    }
}

// ==================== Evaluation ====================

async function evaluateExam() {
    try {
        const evaluation = await apiCall('/evaluation/evaluate', 'POST', {
            exam_id: currentExam.id
        });
        
        const summary = await apiCall(`/evaluation/${currentExam.id}/summary`);
        
        // Display summary
        displayExamSummary(summary);
        
        // Display evaluation report as Markdown
        const reportElement = document.getElementById('evaluationReport');
        reportElement.innerHTML = marked.parse(evaluation.evaluation_report);
        
        // Render any LaTeX in the evaluation report
        renderMath('evaluationReport');
        
        // Show results
        document.querySelector('.evaluation-progress').style.display = 'none';
        document.getElementById('evaluationResult').style.display = 'block';
        
    } catch (error) {
        document.querySelector('.evaluation-progress').innerHTML = 
            `<p style="color: var(--danger-color);">Error during evaluation: ${error.message}</p>`;
    }
}

function displayExamSummary(summary) {
    const summaryDiv = document.getElementById('examSummary');
    
    let marksInfo = '';
    if (summary.marks_achieved !== null && summary.marks_achieved !== undefined) {
        marksInfo = `
            <div class="summary-item highlight">
                <div class="label">Marks Achieved</div>
                <div class="value">${summary.marks_achieved}/${summary.total_marks} (${summary.percentage}%)</div>
            </div>
        `;
    }
    
    summaryDiv.innerHTML = `
        <div class="summary-grid">
            ${marksInfo}
            <div class="summary-item">
                <div class="label">Total Questions</div>
                <div class="value">${summary.total_questions}</div>
            </div>
            <div class="summary-item">
                <div class="label">Answered</div>
                <div class="value">${summary.answered_questions}</div>
            </div>
            <div class="summary-item">
                <div class="label">Unanswered</div>
                <div class="value">${summary.unanswered_questions}</div>
            </div>
            <div class="summary-item">
                <div class="label">Time Taken</div>
                <div class="value">${summary.time_taken_minutes || 'N/A'} min</div>
            </div>
            <div class="summary-item">
                <div class="label">PDFs Uploaded</div>
                <div class="value">${summary.total_uploaded_pdfs}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Marks</div>
                <div class="value">${summary.total_marks}</div>
            </div>
        </div>
    `;
}

document.getElementById('downloadReportBtn').addEventListener('click', () => {
    // Download as HTML file with Markdown rendered
    const reportHTML = document.getElementById('evaluationReport').innerHTML;
    const summary = document.getElementById('examSummary').textContent;
    
    // Create a complete HTML document
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exam Evaluation Report - ${currentExam.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #2563eb; }
        .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        ul, ol { margin: 10px 0; padding-left: 30px; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre { background: #f8fafc; padding: 15px; border-radius: 8px; overflow-x: auto; }
        blockquote { border-left: 4px solid #2563eb; padding-left: 20px; margin: 20px 0; color: #64748b; }
    </style>
</head>
<body>
    <h1>Exam Evaluation Report</h1>
    <div class="summary">
        <h2>Exam Summary</h2>
        <pre>${summary}</pre>
    </div>
    <div class="report">
        ${reportHTML}
    </div>
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_report_${currentExam.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
});

// ==================== Initialize ====================

// Initialize preview
updateAnswerPreview();
