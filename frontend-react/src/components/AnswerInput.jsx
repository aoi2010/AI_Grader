import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useMathJax } from '../hooks/useMathJax'

function AnswerInput({ answer, onAnswerChange }) {
  const [typedAnswer, setTypedAnswer] = useState('')
  
  useMathJax([typedAnswer])

  useEffect(() => {
    if (answer?.typed_answer) {
      setTypedAnswer(answer.typed_answer)
    } else {
      setTypedAnswer('')
    }
  }, [answer])

  const handleChange = (e) => {
    const value = e.target.value
    setTypedAnswer(value)
    onAnswerChange({ typed_answer: value })
  }

  return (
    <div className="answer-section">
      <label htmlFor="answerInput">Your Answer:</label>
      <textarea
        id="answerInput"
        placeholder="Type your answer here... (You can use LaTeX: $x^2 + y^2 = z^2$)"
        value={typedAnswer}
        onChange={handleChange}
        rows="6"
      />
      
      <div className="answer-preview">
        <strong>Preview:</strong>
        <div id="answerPreview" className="preview-content">
          {typedAnswer.trim() === '' ? (
            <em style={{ color: '#94a3b8' }}>Your answer preview will appear here...</em>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
            >
              {typedAnswer}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnswerInput
