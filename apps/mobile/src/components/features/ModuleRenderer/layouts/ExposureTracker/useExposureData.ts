import { useCallback, useEffect, useState } from 'react'
import {
  getAllFearEntries, getAllFearSituations,
  type FearEntry, type FearSituation,
} from '../../../../../lib/database'

export interface ExposureData {
  loading: boolean
  situations: FearSituation[]
  entries: FearEntry[]
  reload: () => Promise<void>
}

/**
 * Chargement des données du parcours d'exposition (marches + séances).
 * Source unique = tables SQLite `fear_situations` / `fear_entries`.
 */
export function useExposureData(): ExposureData {
  const [loading, setLoading] = useState(true)
  const [situations, setSituations] = useState<FearSituation[]>([])
  const [entries, setEntries] = useState<FearEntry[]>([])

  const reload = useCallback(async () => {
    const [s, e] = await Promise.all([getAllFearSituations(), getAllFearEntries()])
    setSituations(s)
    setEntries(e)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload().catch(() => setLoading(false))
  }, [reload])

  return { loading, situations, entries, reload }
}
