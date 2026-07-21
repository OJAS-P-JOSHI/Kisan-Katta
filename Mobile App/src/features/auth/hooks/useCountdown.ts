import { useEffect, useRef, useState } from 'react';

/** Ticks a seconds counter down to 0. Used to gate the "Resend OTP" action. */
export function useCountdown(initialSeconds: number): { seconds: number; restart: () => void } {
  const [seconds, setSeconds] = useState(initialSeconds);
  const initialRef = useRef(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const restart = (): void => setSeconds(initialRef.current);

  return { seconds, restart };
}
