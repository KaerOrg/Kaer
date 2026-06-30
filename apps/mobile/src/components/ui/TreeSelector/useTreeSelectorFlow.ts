// Machine d'état du flux de sélection — purement UI (aucune persistance).
//
// Gère le mode courant, le chemin de navigation et les valeurs en cours de
// saisie (intensité, contexte, notes). À la validation finale, délègue au parent
// via `onSubmit` puis se réinitialise. Les étapes optionnelles (intensité,
// contexte, notes) sont enchaînées selon les drapeaux de `config`.

import { useState, useCallback } from 'react'
import type {
  TreeSelectorConfig, TreeSelectorMode, TreeSelectorNode, TreeSelectorSubmit,
} from './types'

export interface TreeSelectorFlow {
  mode: TreeSelectorMode
  path: TreeSelectorNode[]
  intensity: number
  context: string[]
  notes: string
  setIntensity: (v: number) => void
  setNotes: (v: string) => void
  toggleContext: (code: string) => void
  handleStartNew: () => void
  handleSelectNode: (node: TreeSelectorNode) => void
  handleValidateHere: () => void
  handleBack: () => void
  handleCancel: () => void
  handleConfirmIntensity: () => void
  handleConfirmContext: () => void
  handleSaveFinal: () => void
}

export function useTreeSelectorFlow(
  config: TreeSelectorConfig,
  onSubmit: (result: TreeSelectorSubmit) => Promise<void>,
): TreeSelectorFlow {
  const { enableIntensity, enableNotes, enableContext, midIntensity } = config

  const [mode, setMode] = useState<TreeSelectorMode>('history')
  const [path, setPath] = useState<TreeSelectorNode[]>([])
  const [intensity, setIntensity] = useState<number>(midIntensity)
  const [context, setContext] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const resetDraft = useCallback(() => {
    setPath([])
    setIntensity(midIntensity)
    setContext([])
    setNotes('')
  }, [midIntensity])

  const submit = useCallback(async (
    finalPath: TreeSelectorNode[],
    finalIntensity: number | null,
    finalContext: string[],
    finalNotes: string,
  ) => {
    if (finalPath.length === 0) return
    await onSubmit({
      pathIds: finalPath.map(n => n.id),
      intensity: finalIntensity,
      context: finalContext,
      notes: finalNotes,
    })
    resetDraft()
    setMode('history')
  }, [onSubmit, resetDraft])

  // Enchaînement des étapes optionnelles après une sélection validée.
  const proceedFrom = useCallback((finalPath: TreeSelectorNode[]) => {
    setPath(finalPath)
    if (enableIntensity) { setMode('intensity'); return }
    if (enableContext) { setMode('context'); return }
    if (enableNotes) { setMode('notes'); return }
    void submit(finalPath, null, [], '')
  }, [enableIntensity, enableContext, enableNotes, submit])

  const handleStartNew = useCallback(() => {
    resetDraft()
    setMode('selection')
  }, [resetDraft])

  const handleSelectNode = useCallback((node: TreeSelectorNode) => {
    const newPath = [...path, node]
    if (node.children.length > 0) {
      setPath(newPath)
      return
    }
    proceedFrom(newPath)
  }, [path, proceedFrom])

  const handleValidateHere = useCallback(() => {
    proceedFrom(path)
  }, [path, proceedFrom])

  const handleBack = useCallback(() => {
    if (mode === 'notes') {
      if (enableContext) { setMode('context'); return }
      if (enableIntensity) { setMode('intensity'); return }
      setMode('selection'); return
    }
    if (mode === 'context') {
      if (enableIntensity) { setMode('intensity'); return }
      setMode('selection'); return
    }
    if (mode === 'intensity') { setMode('selection'); return }
    if (path.length > 0) { setPath(prev => prev.slice(0, -1)); return }
    setMode('history')
  }, [mode, path, enableContext, enableIntensity])

  const handleCancel = useCallback(() => {
    resetDraft()
    setMode('history')
  }, [resetDraft])

  const handleConfirmIntensity = useCallback(() => {
    if (enableContext) { setMode('context'); return }
    if (enableNotes) { setMode('notes'); return }
    void submit(path, intensity, context, '')
  }, [enableContext, enableNotes, submit, path, intensity, context])

  const handleConfirmContext = useCallback(() => {
    if (enableNotes) { setMode('notes'); return }
    void submit(path, enableIntensity ? intensity : null, context, '')
  }, [enableNotes, submit, path, enableIntensity, intensity, context])

  const handleSaveFinal = useCallback(() => {
    void submit(path, enableIntensity ? intensity : null, context, notes)
  }, [submit, path, enableIntensity, intensity, context, notes])

  const toggleContext = useCallback((code: string) => {
    setContext(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }, [])

  return {
    mode, path, intensity, context, notes,
    setIntensity, setNotes, toggleContext,
    handleStartNew, handleSelectNode, handleValidateHere, handleBack,
    handleCancel, handleConfirmIntensity, handleConfirmContext, handleSaveFinal,
  }
}
