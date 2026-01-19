import { useExamStore } from '../store/examStore'

function QuestionNavigator({ onQuestionSelect }) {
  const { allQuestions, currentQuestionIndex, visitedQuestions, answeredQuestions, uploadedQuestions } = useExamStore()

  const getButtonClass = (index) => {
    const classes = ['question-btn']
    
    if (index === currentQuestionIndex) {
      classes.push('current')
    } else if (uploadedQuestions.has(index)) {
      classes.push('uploaded')
    } else if (answeredQuestions.has(index)) {
      classes.push('answered')
    } else if (visitedQuestions.has(index)) {
      classes.push('visited')
    }
    
    return classes.join(' ')
  }

  return (
    <div className="question-navigator">
      <h3>Questions</h3>
      <div className="question-buttons">
        {allQuestions.map((question, index) => (
          <button
            key={question.id}
            className={getButtonClass(index)}
            onClick={() => onQuestionSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="navigator-legend">
        <div className="legend-item">
          <span className="legend-color current"></span>
          <span>Current</span>
        </div>
        <div className="legend-item">
          <span className="legend-color uploaded"></span>
          <span>Uploaded</span>
        </div>
        <div className="legend-item">
          <span className="legend-color answered"></span>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-color visited"></span>
          <span>Visited</span>
        </div>
      </div>
    </div>
  )
}

export default QuestionNavigator
