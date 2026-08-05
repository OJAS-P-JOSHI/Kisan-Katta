import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import { getMyApplication, startApplication } from '@/api/application.api'
import { getErrorMessage } from '@/lib/api-error'
import type { ApplicationDTO } from '@/types/application.types'

type DraftState = {
  application: ApplicationDTO | null
  loading: boolean
  error: string | null
}

const isNotFound = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404

const isConflict = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 409

export type UseApplicationDraftOptions = {
  /**
   * When false, skip GET/POST (e.g. Admin/Team staff must not call applicant APIs).
   * Defaults to true.
   */
  enabled?: boolean
}

/**
 * Implements the Phase 4B entry flow:
 * GET /application/me → if 404, POST /application/start → open the draft.
 */
export function useApplicationDraft(options: UseApplicationDraftOptions = {}) {
  const enabled = options.enabled !== false
  const [state, setState] = useState<DraftState>({
    application: null,
    loading: enabled,
    error: null,
  })

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      if (!enabled) {
        setState({ application: null, loading: false, error: null })
        return
      }

      const active = () => !signal?.cancelled
      try {
        const application = await getMyApplication()
        if (active()) setState({ application, loading: false, error: null })
      } catch (error) {
        if (isNotFound(error)) {
          try {
            const created = await startApplication()
            if (active())
              setState({ application: created, loading: false, error: null })
          } catch (startError) {
            // A 409 means an application already exists (e.g. a concurrent
            // start, or React StrictMode's double-invoke) — just load it.
            if (isConflict(startError)) {
              try {
                const existing = await getMyApplication()
                if (active())
                  setState({
                    application: existing,
                    loading: false,
                    error: null,
                  })
              } catch (reloadError) {
                if (active())
                  setState({
                    application: null,
                    loading: false,
                    error: getErrorMessage(
                      reloadError,
                      'Unable to load your application.',
                    ),
                  })
              }
              return
            }
            if (active())
              setState({
                application: null,
                loading: false,
                error: getErrorMessage(
                  startError,
                  'Unable to start your application.',
                ),
              })
          }
          return
        }
        if (active())
          setState({
            application: null,
            loading: false,
            error: getErrorMessage(error, 'Unable to load your application.'),
          })
      }
    },
    [enabled],
  )

  useEffect(() => {
    const signal = { cancelled: false }
    void load(signal)
    return () => {
      signal.cancelled = true
    }
  }, [load])

  /** Merge a fresh application snapshot (after auto-save / upload). */
  const setApplication = useCallback((application: ApplicationDTO) => {
    setState((prev) => ({ ...prev, application }))
  }, [])

  return { ...state, setApplication }
}
