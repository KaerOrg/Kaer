// Types du primitive générique `ui/TreeSelector` (web).
//
// Aperçu praticien INTERACTIF en lecture seule, miroir du flux patient mobile.
// 100 % présentationnel : piloté par props (arbre + config + libellés résolus) et
// callbacks. Identités (ids de nœuds, codes de contexte) opaques. Aucun service,
// aucune persistance, aucune clé i18n de domaine.

export type TreeSelectorMode = 'history' | 'selection' | 'intensity' | 'context' | 'notes'

/** Nœud d'arbre prêt à afficher — `label` déjà résolu, `id` opaque. */
export interface TreeSelectorNode {
  id: string
  label: string
  color?: string
  emoji?: string
  children: TreeSelectorNode[]
}

/** Option de contexte (chip) — `code` renvoyé tel quel à la sélection. */
export interface TreeSelectorContextOption {
  code: string
  label: string
}

/** Drapeaux et plages pilotant les étapes optionnelles du flux. */
export interface TreeSelectorConfig {
  enableIntensity: boolean
  enableNotes: boolean
  enableContext: boolean
  enableEarlyValidate: boolean
  intensityMax: number
  intensityValues: number[]
  midIntensity: number
  contextOptions: TreeSelectorContextOption[]
}

/** Libellés d'interface, déjà traduits par le parent. */
export interface TreeSelectorTexts {
  newBtn: string
  intro: string
  historyLabel: string
  emptyTitle: string
  emptyText: string
  intensityTitle: string
  intensityHint: string
  contextTitle: string
  contextHint: string
  notesTitle: string
  notesHint: string
  notesPlaceholder: string
  continueBtn: string
  saveBtn: string
  validateHereBtn: string
  cancel: string
  back: string
  /** Titres d'étape de navigation indexés par niveau (1-based). */
  stepTitles: Record<number, string>
  /** Indices d'étape de navigation indexés par niveau (1-based). */
  stepHints: Record<number, string>
}

/** Résultat d'une sélection validée — identités opaques (le parent décide). */
export interface TreeSelectorSubmit {
  pathIds: string[]
  intensity: number | null
  context: string[]
  notes: string
}
