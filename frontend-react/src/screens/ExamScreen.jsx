import { useState, useEffect, useCallback, useRef } from 'react'
import { useExamStore } from '../store/examStore'
import { examAPI, answerAPI } from '../services/api'
import QuestionDisplay from '../components/QuestionDisplay'
import QuestionNavigator from '../components/QuestionNavigator'
import AnswerInput from '../components/AnswerInput'
import PDFUpload from '../components/PDFUpload'
import Timer from '../components/Timer'

function ExamScreen() {
  const {
    currentExam,
    allQuestions,
    currentQuestionIndex,
    visitedQuestions,
    setCurrentQuestionIndex,
    addVisitedQuestion,
    addAnsweredQuestion,
    addUploadedQuestion,
    setScreen,
    stopTimer,
    setCurrentExam
  } = useExamStore()

  const [currentAnswer, setCurrentAnswer] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })
  const [selectedMcq, setSelectedMcq] = useState('')
  const [selectedChoice, setSelectedChoice] = useState('main')
  const [violations, setViolations] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement)
  const [needsFullscreen, setNeedsFullscreen] = useState(false)
  const [lastViolation, setLastViolation] = useState('')
  const proctoringPauseUntilRef = useRef(0)

  const pauseProctoring = useCallback((ms = 15000) => {
    proctoringPauseUntilRef.current = Date.now() + ms
  }, [])

  const currentQuestion = allQuestions[currentQuestionIndex]

  const requestFullscreen = useCallback(async () => {
    const el = document.documentElement
    if (document.fullscreenElement) {
      setIsFullscreen(true)
      return
    }

    if (!el?.requestFullscreen) {
      alert('Fullscreen is not supported in this browser. Please press F11 manually.')
      return
    }

    try {
      await el.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
      alert('Browser blocked fullscreen. Please allow it or press F11 to continue.')
    }
  }, [])

  async function recordViolation(reason) {
    if (Date.now() < proctoringPauseUntilRef.current) {
      return
    }
    const next = [...violations, { reason, at: new Date().toISOString() }].slice(-5)
    setViolations(next)
    setLastViolation(reason)

    if (next.length >= 4) {
      try {
        await examAPI.submitExam(currentExam.id)
        setCurrentExam({ ...currentExam, status: 'SUBMITTED' })
        stopTimer()
        setScreen('evaluation')
        return
      } catch (err) {
        console.error('Auto submit failed:', err)
        setLastViolation(`Auto submit failed: ${err?.response?.data?.detail || err.message}`)
      }
    }

    setNeedsFullscreen(true)
  }

  const handleForceFullscreen = async () => {
    await requestFullscreen()
    if (!document.fullscreenElement) {
      alert('Browser blocked fullscreen. Please allow it or press F11 to continue.')
      return
    }
    setIsFullscreen(true)
    setNeedsFullscreen(false)
  }

  const handleSubmitAfterViolation = () => {
    stopTimer()
    setScreen('submission')
  }

  // Load answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      // Reset selections before loading to avoid carry-over
      setSelectedMcq('')
      setSelectedChoice('main')
      loadAnswer()
      addVisitedQuestion(currentQuestionIndex)
    }
  }, [currentQuestionIndex, currentQuestion])

  // Anti-cheat listeners
  useEffect(() => {
    const handleVisibility = () => {
      if (Date.now() < proctoringPauseUntilRef.current) return
      if (document.visibilityState === 'hidden') {
        recordViolation('Tab switch detected')
      }
    }

    const handleBlur = () => {
      if (Date.now() < proctoringPauseUntilRef.current) return
      recordViolation('Window blur detected')
    }

    const handleFullscreen = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      if (Date.now() < proctoringPauseUntilRef.current) return
      if (!fs) recordViolation('Exited fullscreen')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreen)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreen)
    }
  }, [recordViolation])

  // Block right-click context menu
  useEffect(() => {
    const blockContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockContextMenu)
    return () => document.removeEventListener('contextmenu', blockContextMenu)
  }, [])

  const loadAnswer = async () => {
    try {
      const answer = await answerAPI.getAnswer(currentExam.id, currentQuestion.id)
      setCurrentAnswer(answer)
      
      // Set MCQ selection
      if (answer?.selected_option) {
        setSelectedMcq(answer.selected_option)
        // Check the radio button
        setTimeout(() => {
          const radio = document.querySelector(`input[name="mcq"][value="${answer.selected_option}"]`)
          if (radio) {
            radio.checked = true
            radio.closest('.mcq-option')?.classList.add('selected')
          }
        }, 50)
      } else {
        setSelectedMcq('')
      }

      // Set choice selection
      if (answer?.selected_choice) {
        setSelectedChoice(answer.selected_choice)
        setTimeout(() => {
          const choiceRadio = document.querySelector(`input[name="choice"][value="${answer.selected_choice}"]`)
          if (choiceRadio) choiceRadio.checked = true
        }, 50)
      } else {
        setSelectedChoice('main')
      }

      // Load uploaded files
      if (answer?.has_uploaded_files) {
        loadUploadedFiles(answer.id)
        addUploadedQuestion(currentQuestionIndex)
        addAnsweredQuestion(currentQuestionIndex)
      } else {
        setUploadedFiles([])
      }

      // Mark answered if any response exists
      const hasTyped = !!(answer?.typed_answer && answer.typed_answer.trim())
      const hasMcq = !!answer?.selected_option
      if (hasTyped || hasMcq) {
        addAnsweredQuestion(currentQuestionIndex)
      }
    } catch (error) {
      console.error('Error loading answer:', error)
      setCurrentAnswer(null)
      setSelectedMcq('')
      setSelectedChoice('main')
      setUploadedFiles([])
    }
  }

  const loadUploadedFiles = async (answerId) => {
    try {
      const response = await answerAPI.getUploadedFiles(answerId)
      setUploadedFiles(response.files || [])
    } catch (error) {
      console.error('Error loading files:', error)
      setUploadedFiles([])
    }
  }

  const handleAnswerChange = (answerData) => {
    setCurrentAnswer(prev => ({ ...prev, ...answerData }))
  }

  const handleMcqChange = (e) => {
    const value = e.target.value
    setSelectedMcq(value)
    setCurrentAnswer(prev => ({ ...prev, selected_option: value }))
    addAnsweredQuestion(currentQuestionIndex)
  }

  const handleChoiceChange = (e) => {
    const value = e.target.value
    setSelectedChoice(value)
    setCurrentAnswer(prev => ({ ...prev, selected_choice: value }))
  }

  const handleSaveAnswer = async () => {
    const typedAnswer = currentAnswer?.typed_answer?.trim() || null

    // Validation
    if (!typedAnswer && !selectedMcq) {
      showStatus('Please provide an answer (typed or MCQ selection)', 'error')
      return
    }

    try {
      await answerAPI.saveAnswer({
        exam_id: currentExam.id,
        question_id: currentQuestion.id,
        typed_answer: typedAnswer,
        selected_option: selectedMcq || null,
        selected_choice: selectedChoice
      })

      showStatus('Answer saved successfully!', 'success')
      addAnsweredQuestion(currentQuestionIndex)
    } catch (error) {
      showStatus('Error: ' + error.message, 'error')
    }
  }

  const handlePdfUpload = async (file) => {
    try {
      await answerAPI.uploadPdf(currentExam.id, currentQuestion.id, file)
      
      showStatus('PDF uploaded successfully!', 'success')
      addUploadedQuestion(currentQuestionIndex)
      addAnsweredQuestion(currentQuestionIndex)
      
      // Reload answer to show uploaded files
      await loadAnswer()
    } catch (error) {
      showStatus('Error: ' + error.message, 'error')
    }
  }

  const handleQuestionSelect = (index) => {
    setCurrentQuestionIndex(index)
    clearStatus()
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      clearStatus()
    }
  }

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1
    
    if (nextIndex >= allQuestions.length) {
      // Show submission screen
      stopTimer()
      setScreen('submission')
    } else {
      setCurrentQuestionIndex(nextIndex)
      clearStatus()
    }
  }

  const handleSubmitTop = () => {
    if (confirm('Are you sure you want to end the exam now? You can still upload final PDFs before submitting.')) {
      stopTimer()
      setScreen('submission')
    }
  }

  const downloadQuestionPaper = () => {
    // Opening a print window can trigger blur/visibility events; pause proctoring briefly.
    pauseProctoring(20000)
    const printWindow = window.open('', '', 'width=900,height=700')
    if (!printWindow) return

    // Auto-resume proctoring as soon as the print window closes.
    const resumeCheck = window.setInterval(() => {
      try {
        if (printWindow.closed) {
          proctoringPauseUntilRef.current = 0
          window.clearInterval(resumeCheck)
        }
      } catch {
        // ignore
      }
    }, 500)
    const examTitle = `${currentExam.board} - Class ${currentExam.class_num} - ${currentExam.subject}`
    
    let questionsHTML = `<h1 style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px;">${examTitle}</h1>`
    questionsHTML += `<div style="text-align: center; margin: 20px 0; font-size: 1.1rem;">`
    questionsHTML += `<p><strong>Total Marks:</strong> ${currentExam.total_marks} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Duration:</strong> ${currentExam.duration_minutes} minutes</p>`
    questionsHTML += `</div><hr style="border: none; border-top: 2px solid #000; margin: 20px 0;">`
    
    questionsHTML += `<div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">`
    questionsHTML += `<h3 style="margin-top: 0;">Instructions:</h3>`
    questionsHTML += `<ul style="margin: 10px 0;">`
    questionsHTML += `<li>Read all questions carefully before answering</li>`
    questionsHTML += `<li>Answer questions in the provided answer sheet</li>`
    questionsHTML += `<li>For questions with OR, answer only ONE option</li>`
    questionsHTML += `<li>All questions are compulsory unless otherwise stated</li>`
    questionsHTML += `</ul></div><hr style="margin: 20px 0;">`
    
    allQuestions.forEach((q, idx) => {
      questionsHTML += `<div class="question" style="margin: 25px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid; background: white;">`
      questionsHTML += `<p style="font-weight: bold; color: #2563eb; margin-bottom: 10px;">Q${q.sequence_number}. <span style="color: #64748b; font-size: 0.9em;">(Section ${q.section}) [${q.marks} marks]</span></p>`
      questionsHTML += `<div class="question-text" style="line-height: 1.8; margin-left: 10px;">${q.question_text}</div>`
      
      if (q.options && q.options.length > 0) {
        questionsHTML += '<div style="margin: 15px 0 15px 20px;">'
        q.options.forEach((opt, i) => {
          questionsHTML += `<div class="mcq-option" style="border: 1px solid #ccc; padding: 10px; margin: 8px 0; border-radius: 4px; background: #fafafa;">`
          questionsHTML += `<strong>${String.fromCharCode(65 + i)})</strong> <span>${opt}</span></div>`
        })
        questionsHTML += '</div>'
      }
      
      if (q.has_internal_choice && q.alternative_question_text) {
        questionsHTML += `<div class="or-question" style="border: 2px dashed #2563eb; padding: 15px; margin: 15px 0; background: #eff6ff; border-radius: 8px;">`
        questionsHTML += `<p style="font-weight: bold; color: #2563eb; margin-bottom: 8px;">OR</p>`
        questionsHTML += `<div style="line-height: 1.8;">${q.alternative_question_text}</div>`
        questionsHTML += `</div>`
      }
      
      questionsHTML += '</div>'
      if (idx < allQuestions.length - 1) {
        questionsHTML += '<hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;">'
      }
    })
    
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${examTitle} - Question Paper</title>
    <meta charset="UTF-8">
    <script>
      window.MathJax = {
      loader: { load: ['[tex]/noerrors', '[tex]/noundefined'] },
      tex: {
        packages: { '[+]': ['noerrors', 'noundefined'] },
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
      };
    </script>
    <script id="MathJax-script" defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
        h1 { color: #2563eb; font-size: 1.8rem; }
        .question { page-break-inside: avoid; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    ${questionsHTML}
    <script>
        window.onload = function() {
            if (window.MathJax) {
                MathJax.typesetPromise().then(() => {
                    setTimeout(() => { window.print(); }, 500);
                }).catch(() => setTimeout(() => { window.print(); }, 1500));
            } else {
                setTimeout(() => { window.print(); }, 1500);
            }
        };
    </script>
</body>
</html>`)
    printWindow.document.close()
  }

  const showStatus = (text, type) => {
    setStatusMessage({ text, type })
    setTimeout(() => clearStatus(), 5000)
  }

  const clearStatus = () => {
    setStatusMessage({ text: '', type: '' })
  }

  if (!currentQuestion) {
    return <div className="screen active"><div className="container">Loading...</div></div>
  }

  return (
    <div className="screen active" id="exam-screen">
      <div className="exam-header">
        <div className="exam-title" id="examTitle">
          {currentExam.board} - Class {currentExam.class_num} - {currentExam.subject}
        </div>
        <Timer />
        <div className="exam-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadQuestionPaper}
          >
            📥 Download Question Paper
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleSubmitTop}
          >
            Submit Exam
          </button>
        </div>
      </div>

      <div className="exam-content">
        {needsFullscreen && (
          <div className="fullscreen-blocker">
            <div className="fullscreen-modal">
              <h3>Get back to fullscreen</h3>
              <p>{lastViolation || 'Fullscreen was exited or blocked.'}</p>
              <p>Violations so far: {violations.length}</p>
              <p style={{ color: '#ef4444', marginBottom: '12px' }}>Click below to re-enter fullscreen or submit now.</p>
              <div className="fullscreen-actions">
                <button type="button" className="btn-primary" onClick={handleForceFullscreen}>
                  Re-enter Fullscreen
                </button>
                <button type="button" className="btn-danger" onClick={handleSubmitAfterViolation}>
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="main-content">
          <div className="question-progress" id="questionProgress">
            Question {currentQuestionIndex + 1} of {allQuestions.length}
          </div>

          <div className="proctor-bar">
            <div className="proctor-status">
              <span className={isFullscreen ? 'ok-dot' : 'warn-dot'}></span>
              {isFullscreen ? 'Fullscreen enforced' : 'Fullscreen off - click to re-enter'}
            </div>
            <div className="proctor-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={requestFullscreen}>
                🔒 Re-enter Fullscreen
              </button>
              <div className="proctor-violations">
                Violations: <span className="violation-badge">{violations.length}</span>
              </div>
            </div>
          </div>

          <QuestionDisplay 
            question={currentQuestion}
            sequenceNumber={currentQuestion.sequence_number}
            selectedMcq={selectedMcq}
            onMcqChange={handleMcqChange}
            selectedChoice={selectedChoice}
            onChoiceChange={handleChoiceChange}
          />

          <AnswerInput
            answer={currentAnswer}
            onAnswerChange={handleAnswerChange}
          />

          <div className="answer-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveAnswer}
            >
              💾 Save Answer
            </button>
          </div>

          {statusMessage.text && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          <PDFUpload
            onUpload={handlePdfUpload}
            uploadedFiles={uploadedFiles}
          />

          <div className="navigation-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
            >
              {currentQuestionIndex === allQuestions.length - 1 ? 'Finish Exam' : 'Next Question →'}
            </button>
          </div>
        </div>

        <QuestionNavigator onQuestionSelect={handleQuestionSelect} />
      </div>
    </div>
  )
}

export default ExamScreen
