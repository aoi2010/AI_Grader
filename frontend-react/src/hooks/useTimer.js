import { useEffect } from 'react'
import { useExamStore } from '../store/examStore'
import { examAPI } from '../services/api'

export function useTimer() {
  const { currentExam, timerSeconds, setTimerSeconds, setScreen } = useExamStore()

  useEffect(() => {
    if (!currentExam || !timerSeconds) return

    const interval = setInterval(async () => {
      try {
        const response = await examAPI.getTimer(currentExam.id)
        
        if (response.auto_submit) {
          // Time's up - navigate to submission screen
          clearInterval(interval)
          setScreen('submission')
          return
        }
        
        setTimerSeconds(response.time_remaining_seconds)
      } catch (error) {
        console.error('Timer error:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentExam, timerSeconds, setTimerSeconds, setScreen])

  const getTimerClass = () => {
    if (!timerSeconds) return ''
    if (timerSeconds < 300) return 'danger'
    if (timerSeconds < 600) return 'warning'
    return ''
  }

  return { timerSeconds, getTimerClass }
}
