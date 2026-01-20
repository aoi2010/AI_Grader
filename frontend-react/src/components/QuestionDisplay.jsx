import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useMathJax } from '../hooks/useMathJax'
import 'katex/dist/katex.min.css'

function normalizeLatex(text) {
  if (!text) return ''
  // Undo JSON escape side-effects that can corrupt LaTeX commands (e.g. \frac -> formfeed + 'rac')
  return text
    .replace(/\u000c/g, '\\f')
    .replace(/\u0009/g, '\\t')
    .replace(/\u0008/g, '\\b')
    .replace(/\u000d/g, '\\r')
}

function QuestionDisplay({
  question,
  sequenceNumber,
  selectedMcq,
  onMcqChange,
  selectedChoice,
  onChoiceChange
}) {
  useMathJax([question])

  if (!question) return null

  return (
    <div className="question-display">
      <div className="question-header">
        <div className="section-label">
          Section {question.section} - Q{sequenceNumber}
        </div>
        <div className="marks-label">
          {question.marks} marks
        </div>
      </div>

      <div className="question-content">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        >
          {normalizeLatex(question.question_text)}
        </ReactMarkdown>
      </div>

      {/* MCQ Options */}
      {question.question_type === 'MCQ' && question.options_json && (
        <div className="mcq-options" id="mcqOptions">
          {Object.entries(question.options_json).map(([key, value]) => (
            <div key={key} className="mcq-option" data-option={key}>
              <input
                type="radio"
                name="mcq"
                value={key}
                id={`opt${key}`}
                checked={selectedMcq === key}
                onChange={onMcqChange}
              />
              <label htmlFor={`opt${key}`}>
                <strong>{key}.</strong>{' '}
                <span className="option-text">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                  >
                    {normalizeLatex(value)}
                  </ReactMarkdown>
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Internal Choice (OR Question) */}
      {question.has_internal_choice && question.alternative_question_text && (
        <div className="internal-choice">
          <label>
            <input
              type="radio"
              name="choice"
              value="main"
              checked={selectedChoice === 'main'}
              onChange={onChoiceChange}
            />
            Answer the above question
          </label>
          <label>
            <input
              type="radio"
              name="choice"
              value="alternative"
              checked={selectedChoice === 'alternative'}
              onChange={onChoiceChange}
            />
            <span>OR answer:</span>
            <div className="alt-question-text">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
              >
                {normalizeLatex(question.alternative_question_text)}
              </ReactMarkdown>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}

export default QuestionDisplay
