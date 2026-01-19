import { useState } from 'react'
import { useExamStore } from '../store/examStore'
import { examAPI } from '../services/api'

function SubmissionScreen() {
  const { currentExam, setScreen, setCurrentExam } = useExamStore()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file =>
      file.name.toLowerCase().endsWith('.pdf')
    )
    
    if (files.length !== e.target.files.length) {
      showStatus('Only PDF files are allowed', 'error')
    }
    
    setSelectedFiles(files)
  }

  const handleFinalUpload = async () => {
    if (selectedFiles.length === 0) {
      showStatus('Please select at least one PDF file', 'error')
      return
    }

    setUploading(true)
    showStatus('Uploading answer sheets...', 'info')

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData()
        formData.append('file', selectedFiles[i])
        formData.append('question_number', '0') // 0 indicates full answer sheet

        const response = await fetch(
          `/api/answer/final-upload/${currentExam.id}`,
          {
            method: 'POST',
            body: formData
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail)
        }
      }

      showStatus(`${selectedFiles.length} answer sheet(s) uploaded successfully!`, 'success')
      setSelectedFiles([])
      document.getElementById('finalPdfUpload').value = ''
    } catch (error) {
      showStatus('Error: ' + error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You cannot edit answers after submission.')) {
      return
    }

    try {
      await examAPI.submitExam(currentExam.id)
      // Update local exam status so evaluation logic knows it's submitted
      setCurrentExam({ ...currentExam, status: 'SUBMITTED' })
      setScreen('evaluation')
    } catch (error) {
      alert('Error submitting exam: ' + error.message)
    }
  }

  const showStatus = (text, type) => {
    setStatusMessage({ text, type })
    if (type !== 'info') {
      setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000)
    }
  }

  return (
    <div className="screen active" id="submission-screen">
      <div className="container">
        <h1>📤 Final Submission</h1>
        
        <div className="submission-info">
          <p>You have completed the exam. You can:</p>
          <ul>
            <li>Upload complete answer sheets (optional)</li>
            <li>Submit your exam for evaluation</li>
          </ul>
        </div>

        <div className="final-upload-section">
          <h2>Upload Complete Answer Sheets (Optional)</h2>
          <p className="help-text">
            Upload scanned PDFs of your complete handwritten answer sheets. You can upload multiple files.
          </p>

          <div className="upload-controls">
            <input
              type="file"
              id="finalPdfUpload"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleFinalUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? '⏳ Uploading...' : '📎 Upload Answer Sheets'}
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files ({selectedFiles.length}):</h4>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>
                    📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {statusMessage.text && (
            <div className={`status-message ${statusMessage.type}`} id="finalUploadStatus">
              {statusMessage.text}
            </div>
          )}
        </div>

        <div className="submit-section">
          <h2>Ready to Submit?</h2>
          <p>Once you submit, your answers will be evaluated by AI.</p>
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={handleSubmit}
            disabled={uploading}
          >
            ✅ Submit Exam for Evaluation
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubmissionScreen
