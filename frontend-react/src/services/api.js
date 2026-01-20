import axios from 'axios'

const API_BASE = window.location.origin + '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Exam endpoints
export const examAPI = {
  create: async (data) => {
    const response = await api.post('/exam/create', data)
    return response.data
  },
  
  uploadSyllabus: async (file) => {
    const formData = new FormData()
    formData.append('syllabus', file)
    const response = await api.post('/exam/upload-syllabus', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  start: async (examId) => {
    const response = await api.post('/exam/start', { exam_id: examId })
    return response.data
  },
  
  submitExam: async (examId) => {
    const response = await api.post(`/exam/${examId}/submit`)
    return response.data
  },
  
  getQuestions: async (examId) => {
    const response = await api.get(`/exam/${examId}/questions`)
    return response.data
  },
  
  getCurrentQuestion: async (examId) => {
    const response = await api.get(`/exam/${examId}/current-question`)
    return response.data
  },
  
  getTimer: async (examId) => {
    const response = await api.get(`/exam/${examId}/timer`)
    return response.data
  }
}

// Answer endpoints
export const answerAPI = {
  saveAnswer: async (data) => {
    const response = await api.post('/answer/save', data)
    return response.data
  },
  
  getAnswer: async (examId, questionId) => {
    const response = await api.get(`/answer/get/${examId}/${questionId}`)
    return response.data
  },
  
  getAnswers: async (examId) => {
    const response = await api.get(`/exam/${examId}/answers`)
    return response.data
  },
  
  uploadPdf: async (examId, questionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`/answer/upload-pdf/${examId}/${questionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  finalUpload: async (examId, file, questionNumber = 0) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('question_number', questionNumber)
    
    const response = await api.post(`/answer/final-upload/${examId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  getUploadedFiles: async (answerId) => {
    const response = await api.get(`/answer/${answerId}/files`)
    return response.data
  }
}

// Evaluation endpoints
export const evaluationAPI = {
  evaluate: async (examId) => {
    const response = await api.post('/evaluation/evaluate', { exam_id: examId })
    return response.data
  },
  getReport: async (examId) => {
    const response = await api.get(`/evaluation/${examId}/report`)
    return response.data
  },
  
  getSummary: async (examId) => {
    const response = await api.get(`/evaluation/${examId}/summary`)
    return response.data
  }
}

// AI info endpoints
export const aiAPI = {
  getInfo: async () => {
    const response = await api.get('/ai/info')
    return response.data
  }
}

export default api
