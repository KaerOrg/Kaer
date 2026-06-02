// Catalogue fixe des effets indésirables (miroir de apps/mobile/src/lib/sideEffectsCatalog.ts).
// Côté web : pas d'icône (pastilles de couleur). Les libellés viennent de l'i18n.

export interface SideEffectCatalogItem {
  key: string
  color: string
  /** suffixe i18n : modules.medication_side_effects.<labelKey> */
  labelKey: string
}

export const SIDE_EFFECT_CATALOG: readonly SideEffectCatalogItem[] = [
  { key: 'sedation',      color: '#8B5CF6', labelKey: 'dim_sedation' },
  { key: 'sleep',         color: '#0EA5E9', labelKey: 'dim_sleep' },
  { key: 'akathisia',     color: '#F59E0B', labelKey: 'dim_akathisia' },
  { key: 'tremors',       color: '#EF4444', labelKey: 'dim_tremors' },
  { key: 'dry_mouth',     color: '#06B6D4', labelKey: 'dim_dry_mouth' },
  { key: 'nausea',        color: '#10B981', labelKey: 'dim_nausea' },
  { key: 'constipation',  color: '#A16207', labelKey: 'dim_constipation' },
  { key: 'weight',        color: '#EC4899', labelKey: 'dim_weight' },
  { key: 'appetite_loss', color: '#14B8A6', labelKey: 'dim_appetite_loss' },
  { key: 'dizziness',     color: '#6366F1', labelKey: 'dim_dizziness' },
  { key: 'headache',      color: '#F97316', labelKey: 'dim_headache' },
  { key: 'sexual',        color: '#A855F7', labelKey: 'dim_sexual' },
]

export const CUSTOM_EFFECT_PALETTE = [
  '#F43F5E', '#22C55E', '#3B82F6', '#EAB308', '#D946EF', '#0D9488', '#FB7185', '#7C3AED',
]

export interface TrackedEffect {
  key: string
  custom?: boolean
  label?: string
  color?: string
}

export function isCustomKey(key: string): boolean {
  return key.startsWith('c_')
}

export function makeCustomKey(): string {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
