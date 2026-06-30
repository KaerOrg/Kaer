// Types du primitive générique `ui/TreeSelector`.
//
// Contrat 100 % présentationnel : tous les libellés sont reçus déjà traduits,
// les nœuds et entrées sont des view-models prêts à afficher, et les identités
// (ids de nœuds, codes de contexte) sont opaques — le primitive ne connaît ni
// service, ni persistance, ni clé i18n de domaine.

import type { ComponentProps } from 'react'
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export type McIcon = ComponentProps<typeof MaterialCommunityIcons>['name']

/** Étapes internes du flux de sélection. */
export type TreeSelectorMode = 'history' | 'selection' | 'intensity' | 'context' | 'notes'

/** Nœud d'arbre prêt à afficher — `label` déjà résolu, `id` opaque. */
export interface TreeSelectorNode {
  id: string
  label: string
  color?: string
  icon?: string
  emoji?: string
  children: TreeSelectorNode[]
}

/** Option de contexte (chip) — `code` renvoyé tel quel au parent à la sélection. */
export interface TreeSelectorContextOption {
  code: string
  label: string
  icon: McIcon
}

/** Entrée d'historique prête à afficher (view-model résolu par le parent). */
export interface TreeSelectorEntry {
  id: string
  accentColor: string
  icon: McIcon
  emoji?: string
  primaryLabel: string
  secondaryLabel: string
  /** Ex. « 6/10 » — déjà formaté, ou null si pas d'intensité. */
  intensityLabel: string | null
  contextLabels: string[]
  notes: string | null
  dateLabel: string
}

/** Drapeaux et plages pilotant les étapes optionnelles du flux. */
export interface TreeSelectorConfig {
  enableIntensity: boolean
  enableNotes: boolean
  enableContext: boolean
  /** Autorise la validation à n'importe quel niveau (profondeur libre). */
  enableEarlyValidate: boolean
  intensityMax: number
  intensityValues: number[]
  /** Valeur d'intensité par défaut (centre de la plage). */
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
  delete: string
  /** Titres d'étape de navigation indexés par niveau (1-based). */
  stepTitles: Record<number, string>
  /** Indices d'étape de navigation indexés par niveau (1-based). */
  stepHints: Record<number, string>
}

/** Résultat d'une sélection validée — identités opaques, le parent persiste. */
export interface TreeSelectorSubmit {
  pathIds: string[]
  intensity: number | null
  context: string[]
  notes: string
}
