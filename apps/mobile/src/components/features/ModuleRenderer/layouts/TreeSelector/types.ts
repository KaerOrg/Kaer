// Types internes du layout métier `tree_selector`.
// `RawTreeNode` conserve la clé i18n (`text_code`) et l'identité de chaque nœud,
// nécessaires à la persistance — le primitive `ui/TreeSelector`, lui, ne manipule
// que des libellés déjà traduits.

import type { McIcon } from '@ui/TreeSelector'

export interface RawTreeNode {
  id: string
  text_code: string | null
  color?: string
  icon?: string
  emoji?: string
  children: RawTreeNode[]
}

/** Option de contexte brute issue de la config — libellé non encore résolu. */
export interface RawContextOption {
  code: string
  icon: McIcon
}

/** Config du module parsée depuis `module_content_fields` (sans traduction). */
export interface ParsedTreeConfig {
  /** Props du field `tree_selector_config` — pour résoudre les libellés côté layout. */
  props: Record<string, string>
  rawNodes: RawTreeNode[]
  /** Index id → nœud brut, pour reconstruire un chemin à la persistance. */
  nodeMap: Map<string, RawTreeNode>
  enableIntensity: boolean
  enableNotes: boolean
  enableContext: boolean
  enableEarlyValidate: boolean
  intensityMin: number
  intensityMax: number
  midIntensity: number
  intensityValues: number[]
  rawContextOptions: RawContextOption[]
}
