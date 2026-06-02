import type { ComponentProps } from 'react'
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

// Catalogue fixe des effets indésirables suivis (clé = subscale_key dans scale_entries).
// Ordre = sort_order du seed. Couleurs/icônes décoratives (aucun jugement clinique — MDR).
export interface SideEffectCatalogItem {
  key: string
  color: string
  /** clé i18n du libellé long : modules.medication_side_effects.dim_<key> */
  dimLabelKey: string
  /** clé i18n du libellé court (chips) : modules.medication_side_effects.chip_<key> */
  chipLabelKey: string
  icon: IconName
}

export const SIDE_EFFECT_CATALOG: readonly SideEffectCatalogItem[] = [
  { key: 'sedation',      color: '#8B5CF6', dimLabelKey: 'dim_sedation',      chipLabelKey: 'chip_sedation',      icon: 'power-sleep' },
  { key: 'sleep',         color: '#0EA5E9', dimLabelKey: 'dim_sleep',         chipLabelKey: 'chip_sleep',         icon: 'sleep-off' },
  { key: 'akathisia',     color: '#F59E0B', dimLabelKey: 'dim_akathisia',     chipLabelKey: 'chip_akathisia',     icon: 'run-fast' },
  { key: 'tremors',       color: '#EF4444', dimLabelKey: 'dim_tremors',       chipLabelKey: 'chip_tremors',       icon: 'vibrate' },
  { key: 'dry_mouth',     color: '#06B6D4', dimLabelKey: 'dim_dry_mouth',     chipLabelKey: 'chip_dry_mouth',     icon: 'water-off' },
  { key: 'nausea',        color: '#10B981', dimLabelKey: 'dim_nausea',        chipLabelKey: 'chip_nausea',        icon: 'stomach' },
  { key: 'constipation',  color: '#A16207', dimLabelKey: 'dim_constipation',  chipLabelKey: 'chip_constipation',  icon: 'toilet' },
  { key: 'weight',        color: '#EC4899', dimLabelKey: 'dim_weight',        chipLabelKey: 'chip_weight',        icon: 'scale-bathroom' },
  { key: 'appetite_loss', color: '#14B8A6', dimLabelKey: 'dim_appetite_loss', chipLabelKey: 'chip_appetite_loss', icon: 'food-off' },
  { key: 'dizziness',     color: '#6366F1', dimLabelKey: 'dim_dizziness',     chipLabelKey: 'chip_dizziness',     icon: 'rotate-3d-variant' },
  { key: 'headache',      color: '#F97316', dimLabelKey: 'dim_headache',      chipLabelKey: 'chip_headache',      icon: 'head-flash' },
  { key: 'sexual',        color: '#A855F7', dimLabelKey: 'dim_sexual',        chipLabelKey: 'chip_sexual',        icon: 'gender-male-female' },
]

export const SIDE_EFFECT_CATALOG_BY_KEY: Record<string, SideEffectCatalogItem> =
  Object.fromEntries(SIDE_EFFECT_CATALOG.map(e => [e.key, e]))

// Palette pour les effets personnalisés (cyclée à la création).
export const CUSTOM_EFFECT_PALETTE = [
  '#F43F5E', '#22C55E', '#3B82F6', '#EAB308', '#D946EF', '#0D9488', '#FB7185', '#7C3AED',
]

// Un effet suivi par un patient : soit issu du catalogue (key seule), soit personnalisé.
export interface TrackedEffect {
  key: string
  custom?: boolean
  label?: string   // effets personnalisés uniquement (texte libre)
  color?: string   // effets personnalisés uniquement
}

export function isCustomKey(key: string): boolean {
  return key.startsWith('c_')
}

export function makeCustomKey(): string {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
