import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/lib/api-error'

import { fetchDistricts } from '../location.service'
import { locationStrings } from '../location.strings'
import type { LocationDistrict } from '../location.types'

type State = {
  data: LocationDistrict[]
  loading: boolean
  error: string | null
}

export type UseDistrictsReturn = State & { refresh: () => Promise<void> }

/** Loads and caches the full Maharashtra district list from Location Master. */
export function useDistricts(): UseDistrictsReturn {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  })

  const refresh = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, loading: s.data.length === 0, error: null }))
    try {
      const data = await fetchDistricts()
      setState({ data, loading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: getErrorMessage(err, locationStrings.districtsError),
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
