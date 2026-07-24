import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from './useSession'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity
const WARNING_WINDOW_MS = 60 * 1000 // warn for the last 60s before logging out
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const

/**
 * Auto-signs the user out after IDLE_TIMEOUT_MS of no mouse/keyboard/scroll
 * activity — the OIDC session otherwise never expires on its own
 * (automaticSilentRenew keeps refreshing tokens indefinitely as long as the
 * tab is open). Shows a countdown warning for the last minute; any activity
 * during the warning (including clicking "Stay signed in") resets the timer.
 */
export function useIdleLogout() {
  const { logout } = useSession()
  const lastActivityRef = useRef(Date.now())
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now()
    setSecondsLeft(null)
  }, [])

  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now()
    }
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }

    const interval = setInterval(() => {
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityRef.current)
      if (remaining <= 0) {
        logout()
      } else if (remaining <= WARNING_WINDOW_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000))
      } else {
        setSecondsLeft(null)
      }
    }, 1000)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
      clearInterval(interval)
    }
  }, [logout])

  return { warning: secondsLeft !== null, secondsLeft: secondsLeft ?? 0, stayActive }
}
