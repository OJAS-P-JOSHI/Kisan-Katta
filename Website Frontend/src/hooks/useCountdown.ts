import { useEffect, useRef, useState } from 'react'

/**
 * Simple 1s countdown, replicated from the mobile app
 * (`Frontend/src/features/auth/hooks/useCountdown.ts`). Used for the OTP
 * resend cooldown.
 */
export function useCountdown(initialSeconds: number): {
  seconds: number
  restart: () => void
} {
  const [seconds, setSeconds] = useState(initialSeconds)
  const initialRef = useRef(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [seconds])

  const restart = (): void => setSeconds(initialRef.current)

  return { seconds, restart }
}
