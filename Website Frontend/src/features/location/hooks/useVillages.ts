import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/lib/api-error'

import { fetchVillages } from '../location.service'
import { locationStrings } from '../location.strings'
import type { LocationVillage } from '../location.types'

type State = {
  data: LocationVillage[]
  loading: boolean
  error: string | null
}

export type UseVillagesReturn = State & { refresh: () => Promise<void> }

/**
 * Loads villages for a taluka. Pass null/undefined while no taluka is
 * selected — the hook stays idle and returns an empty list.
 */
export function useVillages(
  talukaCode: number | null | undefined,
): UseVillagesReturn {
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  })

  const refresh = useCallback(async (): Promise<void> => {
    if (talukaCode == null) {
      setState({ data: [], loading: false, error: null })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchVillages(talukaCode)
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: getErrorMessage(err, locationStrings.villagesError),
      })
    }
  }, [talukaCode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
