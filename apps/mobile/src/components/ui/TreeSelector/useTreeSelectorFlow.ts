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
  /**
   * Nœud déplié au niveau courant (ses feuilles sont affichées en chips dans sa
   * carte, au lieu d'ouvrir un écran de plus). `null` : aucune carte dépliée.
   */
  expanded: TreeSelectorNode | null
  intensity: number
  context: string[]
  notes: string
  setIntensity: (v: number) => void
  setNotes: (v: string) => void
  toggleContext: (code: string) => void
  handleStartNew: () => void
  handleSelectNode: (node: TreeSelectorNode) => void
  handleSelectLeaf: (leaf: TreeSelectorNode) => void
  handleToggleExpand: (node: TreeSelectorNode) => void
  handleContinue: () => void
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
  const [expanded, setExpanded] = useState<TreeSelectorNode | null>(null)
  const [intensity, setIntensity] = useState<number>(midIntensity)
  const [context, setContext] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const resetDraft = useCallback(() => {
    setPath([])
    setExpanded(null)
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
      setExpanded(null)
      return
    }
    // Feuille : on enchaîne directement. C'est ce qui tient la promesse d'une
    // saisie en trois taps (famille, nuance sans mots, enregistrer).
    proceedFrom(newPath)
  }, [path, proceedFrom])

  /**
   * Carte porteuse de feuilles : elle se déplie sur place pour montrer ses mots en
   * chips, au lieu d'ouvrir un écran de plus. Re-taper la referme.
   */
  const handleToggleExpand = useCallback((node: TreeSelectorNode) => {
    setExpanded(prev => (prev?.id === node.id ? null : node))
  }, [])

  /**
   * Sélection d'une feuille depuis une carte dépliée. Le nœud déplié n'est PAS dans
   * `path` (il n'a pas été « traversé ») : il faut l'insérer, sinon le chemin
   * persisté saute un niveau et l'entrée perd sa nuance.
   */
  const handleSelectLeaf = useCallback((leaf: TreeSelectorNode) => {
    proceedFrom(expanded ? [...path, expanded, leaf] : [...path, leaf])
  }, [expanded, path, proceedFrom])

  /** Valide la carte dépliée sans descendre jusqu'au mot. */
  const handleContinue = useCallback(() => {
    if (!expanded) return
    proceedFrom([...path, expanded])
  }, [expanded, path, proceedFrom])

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
    if (expanded) { setExpanded(null); return }
    if (path.length > 0) { setPath(prev => prev.slice(0, -1)); return }
    setMode('history')
  }, [mode, path, expanded, enableContext, enableIntensity])

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
    mode, path, expanded, intensity, context, notes,
    setIntensity, setNotes, toggleContext,
    handleStartNew, handleSelectNode, handleSelectLeaf, handleToggleExpand, handleContinue,
    handleValidateHere, handleBack,
    handleCancel, handleConfirmIntensity, handleConfirmContext, handleSaveFinal,
  }
}
