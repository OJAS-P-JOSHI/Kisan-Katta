import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { updateApplication } from '@/api/application.api'
import {
  buildUpdatePayload,
  type ApplicationFormValues,
} from '@/lib/application-validation'
import type { ApplicationDTO } from '@/types/application.types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEBOUNCE_MS = 900

/**
 * Debounced auto-save. Watches the form, and on each (settled) change PUTs only
 * the fields that are valid and non-empty, so partial input never triggers a
 * 400. A monotonically increasing request id ensures that a slower, older
 * request can never overwrite the result of a newer one (no stale data), and
 * the status can never get stuck on "saving".
 */
export function useAutoSave(
  form: UseFormReturn<ApplicationFormValues>,
  onSaved: (application: ApplicationDTO) => void,
  /** When false, pauses auto-save (e.g. after submit → PAYMENT_PENDING). */
  enabled = true,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const lastPayloadRef = useRef<string>('')
  const timerRef = useRef<number | undefined>(undefined)
  const requestIdRef = useRef(0)
  const onSavedRef = useRef(onSaved)
  const enabledRef = useRef(enabled)
  onSavedRef.current = onSaved
  enabledRef.current = enabled

  // Seed the baseline so already-persisted values aren't re-sent on first edit.
  useEffect(() => {
    lastPayloadRef.current = JSON.stringify(buildUpdatePayload(form.getValues()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = useCallback(async (): Promise<void> => {
    if (!enabledRef.current) return

    const payload = buildUpdatePayload(form.getValues())
    if (Object.keys(payload).length === 0) return

    const serialized = JSON.stringify(payload)
    if (serialized === lastPayloadRef.current) {
      // Nothing new to persist — settle any lingering "saving" state.
      setStatus((s) => (s === 'saving' ? 'saved' : s))
      return
    }

    const requestId = ++requestIdRef.current
    setStatus('saving')
    try {
      const updated = await updateApplication(payload)
      // Ignore stale responses: a newer save has superseded this one.
      if (requestId !== requestIdRef.current) return
      lastPayloadRef.current = serialized
      setStatus('saved')
      onSavedRef.current(updated)
    } catch {
      if (requestId !== requestIdRef.current) return
      setStatus('error')
    }
  }, [form])

  useEffect(() => {
    if (!enabled) {
      window.clearTimeout(timerRef.current)
      return
    }
    const subscription = form.watch(() => {
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        void run()
      }, DEBOUNCE_MS)
    })
    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timerRef.current)
    }
  }, [enabled, form, run])

  /** Flush any pending debounce and persist immediately (used before Next/Submit). */
  const saveNow = useCallback(async (): Promise<void> => {
    if (!enabledRef.current) return
    window.clearTimeout(timerRef.current)
    await run()
  }, [run])

  return { status, saveNow }
}
