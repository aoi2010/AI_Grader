import { create } from 'zustand'

export const useExamStore = create((set, get) => ({
  // Screen management
  currentScreen: 'setup',
  setScreen: (screen) => set({ currentScreen: screen }),

  // Exam data
  currentExam: null,
  allQuestions: [],
  visitedQuestions: new Set(),
  answeredQuestions: new Set(),
  uploadedQuestions: new Set(),
  
  setCurrentExam: (exam) => set({ currentExam: exam }),
  setAllQuestions: (questions) => set({ allQuestions: questions }),
  addVisitedQuestion: (index) => set((state) => ({
    visitedQuestions: new Set([...state.visitedQuestions, index])
  })),
  addAnsweredQuestion: (index) => set((state) => ({
    answeredQuestions: new Set([...state.answeredQuestions, index])
  })),
  addUploadedQuestion: (index) => set((state) => ({
    uploadedQuestions: new Set([...state.uploadedQuestions, index])
  })),
  clearVisitedQuestions: () => set({ visitedQuestions: new Set() }),
  clearAnsweredQuestions: () => set({ answeredQuestions: new Set() }),
  clearUploadedQuestions: () => set({ uploadedQuestions: new Set() }),

  // Timer
  timerInterval: null,
  timerSeconds: 0,
  
  setTimerInterval: (interval) => set({ timerInterval: interval }),
  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),
  
  startTimer: () => {
    const interval = setInterval(async () => {
      // Update timer logic will be in a separate hook
    }, 1000)
    set({ timerInterval: interval })
  },
  
  stopTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) {
      clearInterval(timerInterval)
      set({ timerInterval: null })
    }
  },

  // Question navigation
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  // Reset store
  resetStore: () => set({
    currentScreen: 'setup',
    currentExam: null,
    allQuestions: [],
    visitedQuestions: new Set(),
    answeredQuestions: new Set(),
    uploadedQuestions: new Set(),
    timerInterval: null,
    timerSeconds: 0,
    currentQuestionIndex: 0
  })
}))

