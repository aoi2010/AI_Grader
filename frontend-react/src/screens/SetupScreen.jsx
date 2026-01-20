import { useEffect, useState } from 'react'
import { examAPI, aiAPI } from '../services/api'
import { useExamStore } from '../store/examStore'

function SetupScreen() {
  const { setCurrentExam, setScreen } = useExamStore()
  
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    board: 'CBSE',
    classNum: 10,
    subject: '',
    chapterFocus: '',
    customDuration: '',
    difficultyLevel: 'medium',
    syllabusFile: null
  })
  
  const [status, setStatus] = useState({ message: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [aiInfo, setAiInfo] = useState(null)

  useEffect(() => {
    aiAPI
      .getInfo()
      .then(setAiInfo)
      .catch(() => {
        /* ignore */
      })
  }, [])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.userName || !formData.userEmail || !formData.subject) {
      setStatus({ message: 'Please fill in all required fields', type: 'error' })
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.userEmail)) {
      setStatus({ message: 'Please enter a valid email address', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ message: 'Creating your exam...', type: 'info' })

    try {
      // Fetch AI info early (configured model), do not block creation
      aiAPI
        .getInfo()
        .then(setAiInfo)
        .catch(() => {
          /* ignore */
        })

      const data = {
        user_name: formData.userName,
        user_email: formData.userEmail,
        board: formData.board,
        class_num: parseInt(formData.classNum),
        subject: formData.subject,
        chapter_focus: formData.chapterFocus || null,
        difficulty_level: formData.difficultyLevel
      }

      if (formData.customDuration) {
        data.custom_duration_minutes = parseInt(formData.customDuration)
      }

      // Handle syllabus upload if present
      if (formData.syllabusFile) {
        setStatus({ message: 'Uploading syllabus...', type: 'info' })
        const syllabusResult = await examAPI.uploadSyllabus(formData.syllabusFile)
        data.syllabus_content = syllabusResult.syllabus_content
      }

      setStatus({ message: 'Generating exam with AI...', type: 'info' })
      const exam = await examAPI.create(data)
      setCurrentExam(exam)

      // Refresh AI info after creation to show last-used model/key
      aiAPI
        .getInfo()
        .then(setAiInfo)
        .catch(() => {
          /* ignore */
        })

      setStatus({ message: 'Exam created successfully!', type: 'success' })
      setTimeout(() => setScreen('ready'), 1000)
      
    } catch (error) {
      setStatus({ message: 'Error: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="header">
          <h1>🎓 AI Grader</h1>
          <p>Indian Board Exam System - CBSE / ICSE / WBBSE</p>
        </div>

        {aiInfo && (
          <div style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '12px 14px',
            borderRadius: '10px',
            margin: '12px 0 18px',
            fontSize: '0.95rem'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <strong style={{ color: '#93c5fd' }}>AI</strong>
              <span>Configured: <strong>{aiInfo.configured_model}</strong></span>
              <span style={{ opacity: 0.7 }}>|</span>
              <span>Last used: <strong>{aiInfo.last_model_used || '—'}</strong></span>
              <span style={{ opacity: 0.7 }}>|</span>
              <span>API key: <strong>{aiInfo.last_api_key_index || '—'}</strong> / {aiInfo.api_keys_configured}</span>
            </div>
          </div>
        )}

        <div className="setup-form">
          <h2>Create Your Exam</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userName">Your Name *</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="userEmail">Email *</label>
              <input
                type="email"
                id="userEmail"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="board">Board *</label>
                <select
                  id="board"
                  name="board"
                  value={formData.board}
                  onChange={handleChange}
                  required
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="WBBSE">WBBSE</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="classNum">Class *</label>
                <select
                  id="classNum"
                  name="classNum"
                  value={formData.classNum}
                  onChange={handleChange}
                  required
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g., Mathematics, Physics, Chemistry"
              />
            </div>

            <div className="form-group">
              <label htmlFor="chapterFocus">Chapter Focus (Optional)</label>
              <textarea
                id="chapterFocus"
                name="chapterFocus"
                value={formData.chapterFocus}
                onChange={handleChange}
                rows="3"
                placeholder="e.g., Algebra, Trigonometry, Calculus"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="difficultyLevel">Difficulty Level</label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
              >
                <option value="easy">Easy - Basic concepts</option>
                <option value="medium">Medium - Standard practice</option>
                <option value="board">Board Level - Actual exam standard (Recommended)</option>
                <option value="hard">Hard - Competitive prep</option>
                <option value="extreme">Extreme - Olympiad level</option>
                <option value="ultra_extreme">Ultra Extreme - Research level</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customDuration">Custom Duration (minutes, optional)</label>
              <input
                type="number"
                id="customDuration"
                name="customDuration"
                value={formData.customDuration}
                onChange={handleChange}
                min="30"
                max="240"
                placeholder="Leave empty for board default"
              />
            </div>

            <div className="form-group">
              <label htmlFor="syllabusUpload">Upload Syllabus PDF (Optional)</label>
              <input
                type="file"
                id="syllabusUpload"
                name="syllabusFile"
                onChange={handleChange}
                accept=".pdf"
              />
              <small>Upload syllabus to generate more focused questions</small>
            </div>

            {status.message && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SetupScreen
