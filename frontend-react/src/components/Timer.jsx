import { useTimer } from '../hooks/useTimer'
import { formatTime } from '../utils/formatTime'

function Timer() {
  const { timerSeconds, getTimerClass } = useTimer()

  if (!timerSeconds) return null

  return (
    <div className={`timer ${getTimerClass()}`}>
      ⏱️ {formatTime(timerSeconds)}
    </div>
  )
}

export default Timer
