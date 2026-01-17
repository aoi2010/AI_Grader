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
    const difficultyLevel = document.getElementById('difficultyLevel').value;
    const syllabusFile = document.getElementById('syllabusUpload').files[0];
    
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
            chapter_focus: chapterFocus,
            difficulty_level: difficultyLevel
        };
        
        // Add custom duration if specified
        if (customDuration && parseInt(customDuration) > 0) {
            requestBody.custom_duration_minutes = parseInt(customDuration);
        }
        
        // Handle syllabus upload if provided
        if (syllabusFile) {
            const formData = new FormData();
            formData.append('syllabus', syllabusFile);
            
            try {
                showStatus('setupStatus', 'Uploading syllabus...', 'info');
                const uploadResponse = await fetch(`${API_BASE}/exam/upload-syllabus`, {
                    method: 'POST',
                    body: formData
                });
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    requestBody.syllabus_content = uploadResult.syllabus_content;
                }
            } catch (uploadError) {
                console.error('Syllabus upload failed:', uploadError);
            }
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
        
        // Reset visited questions for new exam
        visitedQuestions = new Set();
        
        // Fetch all questions for navigation
        await loadAllQuestions();
        
        // Load first question
        await loadQuestionByIndex(0);
        showScreen('exam-screen');
        startTimer();
        
        // Setup download question paper button (after screen is shown)
        setupDownloadPaperButton();
        
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

// Setup download question paper button
function setupDownloadPaperButton() {
    const downloadBtn = document.getElementById('downloadPaperBtn');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            downloadQuestionPaper();
        };
    }
}

// Function to download question paper (can be called from anywhere)
function downloadQuestionPaper() {
    const printWindow = window.open('', '', 'width=900,height=700');
    const examTitle = `${currentExam.board} - Class ${currentExam.class_num} - ${currentExam.subject}`;
    
    let questionsHTML = `<h1 style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px;">${examTitle}</h1>`;
    questionsHTML += `<div style="text-align: center; margin: 20px 0; font-size: 1.1rem;">`;
    questionsHTML += `<p><strong>Total Marks:</strong> ${currentExam.total_marks} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Duration:</strong> ${currentExam.duration_minutes} minutes</p>`;
    questionsHTML += `</div><hr style="border: none; border-top: 2px solid #000; margin: 20px 0;">`;
    
    // Add instructions
    questionsHTML += `<div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">`;
    questionsHTML += `<h3 style="margin-top: 0;">Instructions:</h3>`;
    questionsHTML += `<ul style="margin: 10px 0;">`;
    questionsHTML += `<li>Read all questions carefully before answering</li>`;
    questionsHTML += `<li>Answer questions in the provided answer sheet</li>`;
    questionsHTML += `<li>For questions with OR, answer only ONE option</li>`;
    questionsHTML += `<li>All questions are compulsory unless otherwise stated</li>`;
    questionsHTML += `</ul></div><hr style="margin: 20px 0;">`;
    
    allQuestions.forEach((q, idx) => {
        questionsHTML += `<div class="question" style="margin: 25px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid; background: white;">`;
        questionsHTML += `<p style="font-weight: bold; color: #2563eb; margin-bottom: 10px;">Q${q.sequence_number}. <span style="color: #64748b; font-size: 0.9em;">(Section ${q.section}) [${q.marks} marks]</span></p>`;
        
        // Render question text with Markdown support
        const questionMarkdown = marked.parse(q.question_text || '');
        questionsHTML += `<div class="question-text" style="line-height: 1.8; margin-left: 10px;">${questionMarkdown}</div>`;
        
        if (q.options && q.options.length > 0) {
            questionsHTML += '<div style="margin: 15px 0 15px 20px;">';
            q.options.forEach((opt, i) => {
                // Render option with Markdown support
                const optionMarkdown = marked.parse(opt || '');
                questionsHTML += `<div class="mcq-option" style="border: 1px solid #ccc; padding: 10px; margin: 8px 0; border-radius: 4px; background: #fafafa;">`;
                questionsHTML += `<strong>${String.fromCharCode(65 + i)})</strong> <span>${optionMarkdown}</span></div>`;
            });
            questionsHTML += '</div>';
        }
        
        if (q.has_internal_choice && q.alternative_question_text) {
            // Render alternative question with Markdown support
            const altMarkdown = marked.parse(q.alternative_question_text || '');
            questionsHTML += `<div class="or-question" style="border: 2px dashed #2563eb; padding: 15px; margin: 15px 0; background: #eff6ff; border-radius: 8px;">`;
            questionsHTML += `<p style="font-weight: bold; color: #2563eb; margin-bottom: 8px;">OR</p>`;
            questionsHTML += `<div style="line-height: 1.8;">${altMarkdown}</div>`;
            questionsHTML += `</div>`;
        }
        
        questionsHTML += '</div>';
        if (idx < allQuestions.length - 1) {
            questionsHTML += '<hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;">';
        }
    });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${examTitle} - Question Paper</title>
            <meta charset="UTF-8">
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
                h1 { color: #2563eb; font-size: 1.8rem; }
                h3 { color: #1e293b; }
                .question { page-break-inside: avoid; }
                .question-text p { margin: 10px 0; }
                .mcq-option p { display: inline; margin: 0; }
                .or-question p { margin: 8px 0; }
                code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
                pre { background: #f8fafc; padding: 15px; border-radius: 8px; overflow-x: auto; }
                @media print {
                    body { padding: 20px; }
                    .question { page-break-inside: avoid; }
                    h1 { page-break-after: avoid; }
                }
            </style>
        </head>
        <body>
            ${questionsHTML}
            <script>
                window.onload = function() {
                    if (window.MathJax) {
                        MathJax.typesetPromise().then(() => {
                            setTimeout(() => { window.print(); }, 500);
                        }).catch((err) => {
                            console.error('MathJax error:', err);
                            setTimeout(() => { window.print(); }, 1500);
                        });
                    } else {
                        setTimeout(() => { window.print(); }, 1500);
                    }
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
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
    
    // Mark current question as visited
    visitedQuestions.add(index);
    
    // Update the index BEFORE loading
    currentExam.current_question_index = index;
    
    // Clear previous answer display first
    clearAnswer();
    
    // Load the question
    await loadCurrentQuestion();
    
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
        const answeredIds = new Set(
            response
                .filter(a => {
                    const hasText = a.typed_answer && a.typed_answer.trim() !== '';
                    const hasMcq = a.selected_option && a.selected_option.trim() !== '';
                    const hasPdf = a.has_uploaded_files === true;
                    return hasText || hasMcq || hasPdf;
                })
                .map(a => a.question_id)
        );
        
        const currentIndex = currentExam.current_question_index;
        
        document.querySelectorAll('.question-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.index);
            const qId = parseInt(btn.dataset.questionId);
            
            // Remove all state classes first
            btn.classList.remove('current', 'answered', 'visited');
            
            // Add current class if this is the current question
            if (idx === currentIndex) {
                btn.classList.add('current');
            }
            // Add answered class if answered and saved
            else if (answeredIds.has(qId)) {
                btn.classList.add('answered');
            }
            // Add visited class if seen but not answered
            else if (visitedQuestions.has(idx)) {
                btn.classList.add('visited');
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
        
        // Display question first (creates MCQ options)
        displayQuestion(question);
        
        // Then load existing answer if any (after MCQ options are created)
        try {
            const answerResponse = await apiCall(`/answer/get/${currentExam.id}/${question.id}`);
            if (answerResponse && answerResponse !== null) {
                // Use longer delay to ensure DOM is ready
                setTimeout(() => {
                    loadAnswerData(answerResponse);
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching answer:', error);
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
    // Render question text as Markdown
    questionContent.innerHTML = marked.parse(question.question_text || '');
    renderMath('questionContent');
    
    // Handle MCQ options
    const mcqOptions = document.getElementById('mcqOptions');
    if (question.question_type === 'MCQ' && question.options_json) {
        mcqOptions.style.display = 'block';
        mcqOptions.innerHTML = '';
        
        for (const [key, value] of Object.entries(question.options_json)) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'mcq-option';
            
            // Render option text as Markdown
            const optionHTML = marked.parse(value || '');
            
            optionDiv.innerHTML = `
                <input type="radio" name="mcq" value="${key}" id="opt${key}">
                <label for="opt${key}"><strong>${key}.</strong> <span class="option-text">${optionHTML}</span></label>
            `;
            optionDiv.addEventListener('click', () => {
                document.getElementById(`opt${key}`).checked = true;
                document.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
            });
            mcqOptions.appendChild(optionDiv);
        }
        
        // Render LaTeX in all options
        renderMath('mcqOptions');
    } else {
        mcqOptions.style.display = 'none';
    }
    
    // Handle internal choice
    const internalChoice = document.getElementById('internalChoice');
    if (question.has_internal_choice && question.alternative_question_text) {
        internalChoice.style.display = 'block';
        
        // Render alternative question as Markdown
        const altQuestionHTML = marked.parse(question.alternative_question_text || '');
        
        internalChoice.innerHTML = `
            <label>
                <input type="radio" name="choice" value="main" checked>
                Answer the above question
            </label>
            <label>
                <input type="radio" name="choice" value="alternative">
                <span>OR answer:</span> <div class="alt-question-text">${altQuestionHTML}</div>
            </label>
        `;
        
        // Render LaTeX in alternative question
        renderMath('internalChoice');
    } else {
        internalChoice.style.display = 'none';
    }
    
    // Store current question ID
    document.getElementById('answerInput').dataset.questionId = question.id;
}

function loadAnswerData(answer) {
    // Load typed answer
    if (answer.typed_answer) {
        document.getElementById('answerInput').value = answer.typed_answer;
        updateAnswerPreview();
    }
    
    // Load MCQ selection
    if (answer.selected_option) {
        const radio = document.querySelector(`input[name="mcq"][value="${answer.selected_option}"]`);
        if (radio) {
            radio.checked = true;
            const optionDiv = radio.closest('.mcq-option');
            if (optionDiv) {
                document.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
            }
        }
    }
    
    // Load internal choice selection
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
            // Time's up - show submission screen for final uploads
            stopTimer();
            showScreen('submission-screen');
            showStatus('finalUploadStatus', 'Time is up. You can upload final PDFs and then submit.', 'info');
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
    
    if (!fileInput.files.length) {
        showStatus('finalUploadStatus', 'Please select at least one PDF file', 'error');
        return;
    }
    
    showStatus('finalUploadStatus', 'Uploading answer sheets...', 'info');
    
    try {
        // Upload all files as general answer sheet attachments
        for (let i = 0; i < fileInput.files.length; i++) {
            const formData = new FormData();
            formData.append('file', fileInput.files[i]);
            formData.append('question_number', '0'); // 0 indicates full answer sheet
            
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
        }
        
        showStatus('finalUploadStatus', `${fileInput.files.length} answer sheet(s) uploaded successfully!`, 'success');
        fileInput.value = '';
        
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

// Top submit button handler (go to submission screen for final uploads)
document.getElementById('submitExamTopBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to end the exam now? You can still upload final PDFs before submitting.')) {
        return;
    }
    
    stopTimer();
    showScreen('submission-screen');
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
    // Download as HTML file with Markdown rendered and MathJax support
    const reportHTML = document.getElementById('evaluationReport').innerHTML;
    const summaryHTML = document.getElementById('examSummary').innerHTML;
    
    // Create a complete HTML document with print-to-PDF support
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exam Evaluation Report - ${currentExam.subject} - ${currentExam.board} Class ${currentExam.class_num}</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 30px; line-height: 1.8; background: #fff; color: #1e293b; }
        h1 { color: #2563eb; font-size: 2.2rem; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; }
        h2 { color: #2563eb; font-size: 1.8rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h3 { color: #475569; font-size: 1.4rem; margin-top: 20px; margin-bottom: 10px; }
        .summary { background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 40px; border: 2px solid #e2e8f0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .summary-item { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .summary-item.highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .summary-item .label { font-size: 0.9rem; color: #64748b; margin-bottom: 5px; font-weight: 500; }
        .summary-item.highlight .label { color: rgba(255,255,255,0.9); }
        .summary-item .value { font-size: 1.6rem; font-weight: bold; color: #2563eb; }
        .summary-item.highlight .value { color: white; font-size: 2rem; }
        table { border-collapse: collapse; width: 100%; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #e2e8f0; padding: 14px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; color: #1e293b; }
        tr:nth-child(even) { background: #f8fafc; }
        ul, ol { margin: 15px 0; padding-left: 35px; }
        li { margin: 8px 0; }
        code { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9em; }
        pre { background: #f8fafc; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid #e2e8f0; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 5px solid #2563eb; padding-left: 20px; margin: 25px 0; color: #64748b; font-style: italic; background: #f8fafc; padding: 15px 20px; border-radius: 0 8px 8px 0; }
        strong { color: #1e293b; font-weight: 600; }
        em { color: #64748b; }
        hr { border: none; border-top: 2px solid #e2e8f0; margin: 30px 0; }
        .report { background: white; }
        @media print {
            body { margin: 0; padding: 20px; }
            h1 { page-break-before: avoid; }
            h2, h3 { page-break-after: avoid; }
            table, pre, blockquote { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>📊 Exam Evaluation Report</h1>
    <div class="summary">
        <h2>Exam Summary</h2>
        ${summaryHTML}
    </div>
    <div class="report">
        ${reportHTML}
    </div>
    <hr>
    <p style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-top: 40px;">
        Generated on ${new Date().toLocaleString()} | Board: ${currentExam.board} | Class: ${currentExam.class_num} | Subject: ${currentExam.subject}
    </p>
    <script>
        // Auto-trigger print dialog when opening in new window
        window.onload = function() {
            setTimeout(() => {
                // MathJax rendering complete, ready to print
                window.print();
            }, 1500);
        };
    </script>
</body>
</html>`;
    
    // Open in new window for print-to-PDF
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(fullHTML);
    printWindow.document.close();
});

// Download question paper from evaluation screen
document.getElementById('downloadPaperFromEvalBtn').addEventListener('click', () => {
    if (currentExam && allQuestions && allQuestions.length > 0) {
        downloadQuestionPaper();
    } else {
        alert('Question paper data not available');
    }
});

// ==================== Initialize ====================

// Initialize preview
updateAnswerPreview();
