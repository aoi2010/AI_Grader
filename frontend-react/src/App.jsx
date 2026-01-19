import { useState } from 'react'
import { useExamStore } from './store/examStore'
import SetupScreen from './screens/SetupScreen'
import ExamReadyScreen from './screens/ExamReadyScreen'
import ExamScreen from './screens/ExamScreen'
import SubmissionScreen from './screens/SubmissionScreen'
import EvaluationScreen from './screens/EvaluationScreen'

function App() {
  const { currentScreen } = useExamStore()

  return (
    <div className="app">
      {currentScreen === 'setup' && <SetupScreen />}
      {currentScreen === 'ready' && <ExamReadyScreen />}
      {currentScreen === 'exam' && <ExamScreen />}
      {currentScreen === 'submission' && <SubmissionScreen />}
      {currentScreen === 'evaluation' && <EvaluationScreen />}
    </div>
  )
}

export default App
