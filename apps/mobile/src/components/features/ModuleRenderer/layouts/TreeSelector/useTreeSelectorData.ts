// Charge et persiste les entrées `tree_selections` d'un module.
// Toute écriture passe par `treeSelectionService` (qui enchaîne la sync outbox).

import { useState, useEffect, useCallback } from 'react'
import { getAllTreeSelections, type TreeSelection } from '../../../../../lib/database'
import { saveTreeSelection, deleteTreeSelection } from '@services/treeSelectionService'

export interface TreeSelectorData {
  entries: TreeSelection[]
  loading: boolean
  saving: boolean
  persist: (selection: Omit<TreeSelection, 'created_at'>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useTreeSelectorData(moduleId: string): TreeSelectorData {
  const [entries, setEntries] = useState<TreeSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    const data = await getAllTreeSelections(moduleId)
    setEntries(data)
    setLoading(false)
  }, [moduleId])

  useEffect(() => { reload().catch(() => setLoading(false)) }, [reload])

  const persist = useCallback(async (selection: Omit<TreeSelection, 'created_at'>) => {
    setSaving(true)
    try {
      await saveTreeSelection(selection)
      await reload()
    } finally {
      setSaving(false)
    }
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await deleteTreeSelection(id, moduleId)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [moduleId])

  return { entries, loading, saving, persist, remove }
}
