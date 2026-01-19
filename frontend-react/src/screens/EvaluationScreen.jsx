import { useState, useEffect } from 'react'
import { useExamStore } from '../store/examStore'
import { evaluationAPI } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useMathJax } from '../hooks/useMathJax'

function EvaluationScreen() {
  const { currentExam, allQuestions } = useExamStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [summary, setSummary] = useState(null)

  useMathJax([evaluation])

  useEffect(() => {
    evaluateExam()
  }, [])

  const evaluateExam = async () => {
    try {
      setLoading(true)
      setError(null)

      // Always fetch summary first to know current status
      const initialSummary = await evaluationAPI.getSummary(currentExam.id)
      setSummary(initialSummary)

      // If already evaluated, fetch stored report and exit
      if (initialSummary.status === 'EVALUATED') {
        const report = await evaluationAPI.getReport(currentExam.id)
        setEvaluation(report)
        setLoading(false)
        return
      }

      // If not submitted yet, block evaluation
      if (initialSummary.status !== 'SUBMITTED') {
        setError('Exam is not submitted yet. Please submit before evaluation.')
        setLoading(false)
        return
      }

      // Otherwise perform evaluation
      const evalResult = await evaluationAPI.evaluate(currentExam.id)
      // Refresh summary after evaluation to include marks/status
      const finalSummary = await evaluationAPI.getSummary(currentExam.id)
      setEvaluation(evalResult)
      setSummary(finalSummary)
      setLoading(false)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError('Error during evaluation: ' + (detail || err.message))
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const reportHTML = document.getElementById('evaluationReport').innerHTML
    const summaryHTML = document.getElementById('examSummary').innerHTML
    
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
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1500);
        };
    </script>
</body>
</html>`
    
    const printWindow = window.open('', '', 'width=900,height=700')
    printWindow.document.write(fullHTML)
    printWindow.document.close()
  }

  const downloadQuestionPaper = () => {
    const printWindow = window.open('', '', 'width=900,height=700')
    const examTitle = `${currentExam.board} - Class ${currentExam.class_num} - ${currentExam.subject}`
    
    let questionsHTML = `<h1 style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px;">${examTitle}</h1>`
    questionsHTML += `<div style="text-align: center; margin: 20px 0; font-size: 1.1rem;">`
    questionsHTML += `<p><strong>Total Marks:</strong> ${currentExam.total_marks} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Duration:</strong> ${currentExam.duration_minutes} minutes</p>`
    questionsHTML += `</div><hr style="border: none; border-top: 2px solid #000; margin: 20px 0;">`
    
    allQuestions.forEach((q, idx) => {
      questionsHTML += `<div class="question" style="margin: 25px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">`
      questionsHTML += `<p style="font-weight: bold; color: #2563eb;">Q${q.sequence_number}. (Section ${q.section}) [${q.marks} marks]</p>`
      questionsHTML += `<div>${q.question_text}</div>`
      
      if (q.has_internal_choice && q.alternative_question_text) {
        questionsHTML += `<div style="border: 2px dashed #2563eb; padding: 15px; margin: 15px 0; background: #eff6ff;">`
        questionsHTML += `<p style="font-weight: bold; color: #2563eb;">OR</p>`
        questionsHTML += `<div>${q.alternative_question_text}</div></div>`
      }
      
      questionsHTML += '</div>'
    })
    
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${examTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 30px; }
        .question { page-break-inside: avoid; }
    </style>
</head>
<body>${questionsHTML}</body>
</html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  if (loading) {
    return (
      <div className="screen active" id="evaluation-screen">
        <div className="container">
          <h1>🎯 Evaluating Your Exam</h1>
          <div className="evaluation-progress">
            <div className="spinner"></div>
            <p>AI is evaluating your answers...</p>
            <p>This may take a moment. Please wait.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen active" id="evaluation-screen">
        <div className="container">
          <h1>❌ Evaluation Error</h1>
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active" id="evaluation-screen">
      <div className="container">
        <h1>🎉 Evaluation Complete</h1>
        
        <div className="exam-summary" id="examSummary">
          <div className="summary-grid">
            {summary?.marks_achieved !== null && summary?.marks_achieved !== undefined && (
              <div className="summary-item highlight">
                <div className="label">Marks Achieved</div>
                <div className="value">{summary.marks_achieved}/{summary.total_marks} ({summary.percentage}%)</div>
              </div>
            )}
            <div className="summary-item">
              <div className="label">Total Questions</div>
              <div className="value">{summary?.total_questions || 0}</div>
            </div>
            <div className="summary-item">
              <div className="label">Answered</div>
              <div className="value">{summary?.answered_questions || 0}</div>
            </div>
            <div className="summary-item">
              <div className="label">Unanswered</div>
              <div className="value">{summary?.unanswered_questions || 0}</div>
            </div>
            <div className="summary-item">
              <div className="label">Time Taken</div>
              <div className="value">{summary?.time_taken_minutes || 'N/A'} min</div>
            </div>
            <div className="summary-item">
              <div className="label">PDFs Uploaded</div>
              <div className="value">{summary?.total_uploaded_pdfs || 0}</div>
            </div>
          </div>
        </div>

        <div className="evaluation-report-section">
          <h2>Detailed Evaluation Report</h2>
          <div className="evaluation-report" id="evaluationReport">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {evaluation?.evaluation_report || ''}
            </ReactMarkdown>
          </div>
        </div>

        <div className="download-buttons">
          <button
            type="button"
            className="btn-primary"
            onClick={downloadReport}
          >
            📥 Download Evaluation Report
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadQuestionPaper}
          >
            📄 Download Question Paper
          </button>
        </div>
      </div>
    </div>
  )
}

export default EvaluationScreen
