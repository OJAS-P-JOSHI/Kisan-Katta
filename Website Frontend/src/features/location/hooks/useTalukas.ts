import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/lib/api-error'

import { fetchTalukas } from '../location.service'
import { locationStrings } from '../location.strings'
import type { LocationTaluka } from '../location.types'

type State = {
  data: LocationTaluka[]
  loading: boolean
  error: string | null
}

export type UseTalukasReturn = State & { refresh: () => Promise<void> }

/**
 * Loads talukas for a district. Pass null/undefined while no district is
 * selected — the hook stays idle and returns an empty list.
 */
export function useTalukas(
  districtCode: number | null | undefined,
): UseTalukasReturn {
  const [state, setState] = useState<State>({
    data: [],
    loading: false,
    error: null,
  })

  const refresh = useCallback(async (): Promise<void> => {
    if (districtCode == null) {
      setState({ data: [], loading: false, error: null })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchTalukas(districtCode)
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: getErrorMessage(err, locationStrings.talukasError),
      })
    }
  }, [districtCode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
