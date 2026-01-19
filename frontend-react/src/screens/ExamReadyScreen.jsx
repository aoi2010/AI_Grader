import { useExamStore } from '../store/examStore'
import { examAPI } from '../services/api'

function ExamReadyScreen() {
  const {
    currentExam,
    setScreen,
    setAllQuestions,
    clearVisitedQuestions,
    clearAnsweredQuestions,
    clearUploadedQuestions,
    setTimerSeconds
  } = useExamStore()

  const startExam = async () => {
    try {
      // Attempt to enter fullscreen for proctoring
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
        } catch (err) {
          console.warn('Fullscreen request was blocked:', err)
        }
      }

      await examAPI.start(currentExam.id)
      clearVisitedQuestions()
      clearAnsweredQuestions()
      clearUploadedQuestions()
      
      // Initialize timer
      const timerState = await examAPI.getTimer(currentExam.id)
      if (timerState?.time_remaining_seconds) {
        setTimerSeconds(timerState.time_remaining_seconds)
      } else if (currentExam?.duration_minutes) {
        setTimerSeconds(currentExam.duration_minutes * 60)
      }
      
      const questions = await examAPI.getQuestions(currentExam.id)
      setAllQuestions(questions)
      
      setScreen('exam')
    } catch (error) {
      alert('Error starting exam: ' + error.message)
    }
  }

  if (!currentExam) return null

  return (
    <div className="screen active">
      <div className="container">
        <div className="header">
          <h1>Exam Ready!</h1>
        </div>

        <div className="exam-info">
          <h2>{currentExam.subject} - {currentExam.board} Class {currentExam.class_num}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Total Marks:</span>
              <span className="value">{currentExam.total_marks}</span>
            </div>
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{currentExam.duration_minutes} minutes</span>
            </div>
            <div className="info-item">
              <span className="label">Total Questions:</span>
              <span className="value">{currentExam.total_questions}</span>
            </div>
          </div>
        </div>

        <div className="instructions-box">
          <h3>Important Instructions:</h3>
          <ul>
            <li>You can navigate to <strong>any question</strong> at any time</li>
            <li>Answer questions in any order you prefer</li>
            <li>You can type your answer or upload a PDF</li>
            <li>For mathematical expressions, use LaTeX notation (e.g., $\frac{'{'}x{'}'}{'{'}y{'}'}$, $x^2$)</li>
            <li>A live preview will show your formatted answer</li>
            <li>Timer will start when you begin the exam</li>
            <li>Your progress is saved automatically</li>
            <li>Once submitted, you cannot edit answers</li>
          </ul>
        </div>

        <button onClick={startExam} className="btn btn-primary">
          Start Exam
        </button>
      </div>
    </div>
  )
}

export default ExamReadyScreen
