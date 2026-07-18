import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'

import { OTP_LENGTH, sanitizeOtp } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  /** Current OTP value (controlled). */
  value: string
  /** Called with the sanitized digits on every change. */
  onChange: (value: string) => void
  /** Called once the final digit is entered (auto-submit). */
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  /** Adds an error style + aria-invalid to the boxes. */
  invalid?: boolean
}

/**
 * 6-box OTP entry with auto-focus, paste support, backspace navigation, and
 * auto-submit once the final digit is entered. Replicates the behaviour of the
 * mobile app's `OtpInput`.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  invalid = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  const emit = (next: string): void => {
    onChange(next)
    if (next.length === OTP_LENGTH) {
      onComplete?.(next)
    }
  }

  const focusInput = (index: number): void => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index))
    inputsRef.current[clamped]?.focus()
    inputsRef.current[clamped]?.select()
  }

  const handleChange = (index: number, raw: string): void => {
    const char = sanitizeOtp(raw).slice(-1)
    if (!char) return

    const chars = value.split('')
    chars[index] = char
    const next = chars.join('').slice(0, OTP_LENGTH)
    emit(next)
    focusInput(index + 1)
  }

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = value.split('')
      if (chars[index]) {
        chars[index] = ''
        onChange(chars.join(''))
      } else if (index > 0) {
        chars[index - 1] = ''
        onChange(chars.join(''))
        focusInput(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusInput(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault()
    const pasted = sanitizeOtp(event.clipboardData.getData('text'))
    if (!pasted) return
    emit(pasted)
    focusInput(pasted.length)
  }

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-3"
      role="group"
      aria-label="One-time password"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-full min-w-0 rounded-xl border bg-white text-center text-xl font-semibold text-ink transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            invalid ? 'border-red-400 focus-visible:ring-red-400' : 'border-border',
            disabled && 'opacity-50',
          )}
        />
      ))}
    </div>
  )
}
