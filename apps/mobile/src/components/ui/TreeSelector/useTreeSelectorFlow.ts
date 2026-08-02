// Machine d'état du flux de sélection — purement UI (aucune persistance).
//
// Gère le mode courant, le chemin de navigation et les valeurs en cours de
// saisie (intensité, contexte, note). À la validation finale, délègue au parent
// via `onSubmit` puis se réinitialise.
//
// Depuis K-6, les trois étapes facultatives sont fusionnées en une seule fiche
// (`mode === 'entry'`) : trois écrans traversés en file indienne étaient le premier
// prédicteur d'abandon, et la note libre, le champ le plus riche cliniquement,
// se retrouvait enterrée derrière deux écrans.
//
// L'intensité démarre à `null` : le champ est facultatif, donc **aucune valeur par
// défaut, aucune présélection**. Une valeur pré-cochée serait une réponse que le
// patient n'a pas donnée.

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  TreeSelectorConfig, TreeSelectorEditRequest, TreeSelectorMode, TreeSelectorNode,
  TreeSelectorSubmit,
} from './types'

export interface TreeSelectorFlow {
  mode: TreeSelectorMode
  path: TreeSelectorNode[]
  /**
   * Nœud déplié au niveau courant (ses feuilles sont affichées en chips dans sa
   * carte, au lieu d'ouvrir un écran de plus). `null` : aucune carte dépliée.
   */
  expanded: TreeSelectorNode | null
  intensity: number | null
  context: string[]
  contextOther: string
  /** Le champ de contexte libre est-il ouvert ? (chip « + Autre » tapée) */
  contextOtherOpen: boolean
  notes: string
  setIntensity: (v: number | null) => void
  setContextOther: (v: string) => void
  /** Ouvre le champ libre, ou le referme en effaçant sa saisie. */
  toggleContextOther: () => void
  setNotes: (v: string) => void
  toggleContext: (code: string) => void
  handleStartNew: () => void
  /**
   * Sortie sans rien nommer : ouvre la fiche avec un chemin vide. L'entrée produite
   * est légitime, pas dégradée : décrire une situation est précisément ce que sait
   * faire le patient qui ne trouve pas le mot (K-7).
   */
  handleSkip: () => void
  handleSelectNode: (node: TreeSelectorNode) => void
  handleSelectLeaf: (leaf: TreeSelectorNode) => void
  handleToggleExpand: (node: TreeSelectorNode) => void
  handleContinue: () => void
  handleValidateHere: () => void
  handleBack: () => void
  handleCancel: () => void
  handleSaveFinal: () => void
}

export function useTreeSelectorFlow(
  config: TreeSelectorConfig,
  onSubmit: (result: TreeSelectorSubmit) => Promise<void>,
  editRequest?: TreeSelectorEditRequest | null,
): TreeSelectorFlow {
  const { enableIntensity, enableNotes, enableContext } = config
  // Aucune étape facultative activée : la sélection suffit, on enregistre direct.
  const hasEntrySheet = enableIntensity || enableNotes || enableContext

  const [mode, setMode] = useState<TreeSelectorMode>('history')
  const [path, setPath] = useState<TreeSelectorNode[]>([])
  const [expanded, setExpanded] = useState<TreeSelectorNode | null>(null)
  const [intensity, setIntensity] = useState<number | null>(null)
  const [context, setContext] = useState<string[]>([])
  const [contextOther, setContextOther] = useState('')
  const [contextOtherOpen, setContextOtherOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [wordless, setWordless] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetDraft = useCallback(() => {
    setPath([])
    setExpanded(null)
    setIntensity(null)
    setContext([])
    setContextOther('')
    setContextOtherOpen(false)
    setNotes('')
    setWordless(false)
    setEditingId(null)
  }, [])

  // Demande de modification : on rouvre le flux pré-rempli à la première étape. Le
  // `token` sert de déclencheur (rouvrir deux fois la même entrée doit relancer).
  const lastToken = useRef<number | null>(null)
  useEffect(() => {
    if (!editRequest || editRequest.token === lastToken.current) return
    lastToken.current = editRequest.token
    setEditingId(editRequest.id)
    // On repart de l'ÉTAPE 1, chemin vide : c'est ce qui permet de corriger l'émotion
    // elle-même, et de nommer enfin une entrée « sans mot ». Les champs facultatifs,
    // eux, sont rechargés : on ne fait pas ressaisir ce qui n'a pas changé.
    setPath([])
    setExpanded(null)
    setIntensity(editRequest.intensity)
    setContext(editRequest.context)
    setContextOther(editRequest.contextOther)
    setContextOtherOpen(editRequest.contextOther.length > 0)
    setNotes(editRequest.notes)
    setWordless(editRequest.wasWordless)
    setMode('selection')
  }, [editRequest])

  const toggleContextOther = useCallback(() => {
    setContextOtherOpen(prev => {
      if (prev) setContextOther('')
      return !prev
    })
  }, [])

  const submit = useCallback(async (
    finalPath: TreeSelectorNode[],
    finalIntensity: number | null,
    finalContext: string[],
    finalContextOther: string,
    finalNotes: string,
    wordless = false,
  ) => {
    // Un chemin vide n'est valide QUE par la sortie « je ne sais pas trop » : ailleurs,
    // c'est un état incohérent qu'on refuse de persister.
    if (finalPath.length === 0 && !wordless) return
    await onSubmit({
      editingId,
      pathIds: finalPath.map(n => n.id),
      intensity: finalIntensity,
      context: finalContext,
      contextOther: finalContextOther,
      notes: finalNotes,
    })
    resetDraft()
    setMode('history')
  }, [onSubmit, resetDraft, editingId])

  // Après une sélection validée : la fiche unique, ou l'enregistrement direct.
  const proceedFrom = useCallback((finalPath: TreeSelectorNode[]) => {
    setPath(finalPath)
    if (hasEntrySheet) { setMode('entry'); return }
    void submit(finalPath, null, [], '', '')
  }, [hasEntrySheet, submit])

  const handleStartNew = useCallback(() => {
    resetDraft()
    setMode('selection')
  }, [resetDraft])

  const handleSkip = useCallback(() => {
    setWordless(true)
    setExpanded(null)
    setPath([])
    // La fiche est le seul contenu restant : sans elle, il n'y aurait rien à saisir.
    if (hasEntrySheet) { setMode('entry'); return }
    void submit([], null, [], '', '', true)
  }, [hasEntrySheet, submit])

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
   * Sélection d'une feuille depuis une carte dépliée. Le nœud déplié n'est PAS dans
   * `path` (il n'a pas été « traversé ») : il faut l'insérer, sinon le chemin
   * persisté saute un niveau et l'entrée perd sa nuance.
   */
  const handleSelectLeaf = useCallback((leaf: TreeSelectorNode) => {
    proceedFrom(expanded ? [...path, expanded, leaf] : [...path, leaf])
  }, [expanded, path, proceedFrom])

  /**
   * Carte porteuse de feuilles : elle se déplie sur place pour montrer ses mots en
   * chips, au lieu d'ouvrir un écran de plus. Re-taper la referme.
   */
  const handleToggleExpand = useCallback((node: TreeSelectorNode) => {
    setExpanded(prev => (prev?.id === node.id ? null : node))
  }, [])

  /** Valide la carte dépliée sans descendre jusqu'au mot. */
  const handleContinue = useCallback(() => {
    if (!expanded) return
    proceedFrom([...path, expanded])
  }, [expanded, path, proceedFrom])

  const handleValidateHere = useCallback(() => {
    proceedFrom(path)
  }, [path, proceedFrom])

  const handleBack = useCallback(() => {
    if (mode === 'entry') { setMode('selection'); return }
    if (expanded) { setExpanded(null); return }
    if (path.length > 0) { setPath(prev => prev.slice(0, -1)); return }
    setMode('history')
  }, [mode, path, expanded])

  const handleCancel = useCallback(() => {
    resetDraft()
    setMode('history')
  }, [resetDraft])

  const handleSaveFinal = useCallback(() => {
    void submit(
      path,
      enableIntensity ? intensity : null,
      context,
      enableContext ? contextOther.trim() : '',
      enableNotes ? notes : '',
      wordless,
    )
  }, [submit, path, enableIntensity, intensity, context, enableContext, contextOther, enableNotes, notes, wordless])

  const toggleContext = useCallback((code: string) => {
    setContext(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }, [])

  return {
    mode, path, expanded, intensity, context, contextOther, contextOtherOpen, notes,
    setIntensity, setContextOther, toggleContextOther, setNotes, toggleContext,
    handleStartNew, handleSkip, handleSelectNode, handleSelectLeaf, handleToggleExpand, handleContinue,
    handleValidateHere, handleBack, handleCancel, handleSaveFinal,
  }
}
