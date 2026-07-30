// Types du primitive générique `ui/TreeSelector`.
//
// Contrat 100 % présentationnel : tous les libellés sont reçus déjà traduits,
// les nœuds et entrées sont des view-models prêts à afficher, et les identités
// (ids de nœuds, codes de contexte) sont opaques — le primitive ne connaît ni
// service, ni persistance, ni clé i18n de domaine.

import type { ComponentProps } from 'react'
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export type McIcon = ComponentProps<typeof MaterialCommunityIcons>['name']

/**
 * Étapes internes du flux de sélection. Depuis K-6, les trois étapes facultatives
 * (intensité, contexte, note) sont fusionnées en une seule fiche scrollable : trois
 * écrans traversés en file indienne étaient le premier prédicteur d'abandon.
 */
export type TreeSelectorMode = 'history' | 'selection' | 'entry'

/** Nœud d'arbre prêt à afficher — `label` déjà résolu, `id` opaque. */
export interface TreeSelectorNode {
  id: string
  label: string
  /**
   * Ligne de définition affichée sous le titre, au niveau 1 (« menace,
   * incertitude »). Déjà traduite. Absente : la carte n'affiche que son titre.
   */
  definition?: string
  color?: string
  icon?: string
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
  intensityValues: number[]
  contextOptions: TreeSelectorContextOption[]
}

/** Libellés d'interface, déjà traduits par le parent. */
export interface TreeSelectorTexts {
  newBtn: string
  historyLabel: string
  emptyTitle: string
  emptyText: string
  /** Titre de la fiche unique (« Vous pouvez enregistrer, ou préciser. »). */
  entryTitle: string
  /** Titre de la fiche quand rien n'a été nommé (« On garde le moment, sans le nommer. »). */
  wordlessTitle: string
  /** Sous-titre correspondant : ne pas trouver le mot est une réponse valable. */
  wordlessHint: string
  intensityTitle: string
  /** Ancrages aux bornes de l'échelle : ils la bornent, ils ne qualifient pas la valeur. */
  intensityAnchorMin: string
  intensityAnchorMax: string
  contextTitle: string
  /** Chip d'ouverture du champ de contexte libre (« + Autre »). */
  contextOtherBtn: string
  contextOtherPlaceholder: string
  notesTitle: string
  notesPlaceholder: string
  continueBtn: string
  saveBtn: string
  validateHereBtn: string
  /**
   * Ligne secondaire du bouton « valider ici » : rappelle le niveau conservé
   * (« on garde « Peur » »). Reçoit le libellé du dernier nœud du chemin.
   */
  validateHereKeep: (label: string) => string
  /**
   * Sortie du niveau 1 pour qui n'arrive pas à nommer (« Je ne sais pas trop »).
   * Le bouton n'est rendu que si `onSkip` est fourni.
   */
  skipBtn: string
  /** Rappel sous le niveau 1 : s'arrêter à la racine est déjà une réponse. */
  stopHint: string
  cancel: string
  back: string
  delete: string
  /** Étiquette d'accessibilité de l'icône ⓘ de l'en-tête d'historique. */
  infoBtn: string
  /** Étiquette d'accessibilité du menu ⋯ d'une entrée. */
  entryMenuBtn: string
  /** Libellé de l'action de la ligne « Prochain rappel ». */
  editReminderBtn: string
  /** Titres d'étape de navigation indexés par niveau (1-based). */
  stepTitles: Record<number, string>
  /** Indices d'étape de navigation indexés par niveau (1-based). */
  stepHints: Record<number, string>
}

/**
 * Groupe d'entrées d'historique sous un en-tête (« AUJOURD'HUI », « HIER », une date).
 * Le regroupement est une **navigation**, pas une analyse : aucun total, aucune moyenne,
 * aucune comparaison d'un groupe à l'autre (MDR 2017/745).
 */
export interface TreeSelectorEntrySection {
  title: string
  entries: TreeSelectorEntry[]
}

/** Résultat d'une sélection validée — identités opaques, le parent persiste. */
export interface TreeSelectorSubmit {
  pathIds: string[]
  intensity: number | null
  context: string[]
  /** Contexte libre saisi via « + Autre » : vide si non renseigné. */
  contextOther: string
  notes: string
}
