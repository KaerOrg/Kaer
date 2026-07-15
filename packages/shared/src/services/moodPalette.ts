// ─── Palette du module « Thermomètre de l'humeur » (mood_tracker) ────────────
//
// Source de vérité UNIQUE de la palette de dimensions, partagée web ≡ mobile
// (parité imposée par l'épique #162 : le web #164 réutilise cette même table).
//
// Conformité MDR 2017/745 : la couleur n'encode QUE l'identité de la dimension
// (une teinte par symptôme) et, dans le ruban/heatmap, la MAGNITUDE (opacité
// proportionnelle à la valeur brute). Jamais de rouge/vert « ça va / ça ne va
// pas », aucun seuil, aucune zone de gravité clinique.
//
// Trois nuances par dimension :
//   - fill : pastel — barres d'empreinte et remplissage des curseurs de saisie
//   - ink  : soutenue — texte de valeur et thumb du curseur (lisibilité)
//   - mid  : mi-teinte — trait des courbes de tendance et cellules du ruban

export type MoodDimensionKey = 'mood' | 'energy' | 'anxiety' | 'pleasure' | 'sleep' | 'food'

export interface MoodDimensionColorSet {
  /** Pastel — barres d'empreinte, remplissage des curseurs. */
  readonly fill: string
  /** Teinte soutenue — texte de valeur, thumb du curseur. */
  readonly ink: string
  /** Mi-teinte — courbes de tendance, cellules du ruban. */
  readonly mid: string
}

export const MOOD_DIMENSION_KEYS: readonly MoodDimensionKey[] = [
  'mood', 'energy', 'anxiety', 'pleasure', 'sleep', 'food',
]

export const MOOD_DIMENSION_COLORS: Readonly<Record<MoodDimensionKey, MoodDimensionColorSet>> = {
  mood:     { fill: '#C4B8ED', ink: '#7C6DB6', mid: '#9C89D6' },
  energy:   { fill: '#F0CE96', ink: '#B5842F', mid: '#E3B45E' },
  anxiety:  { fill: '#EDB1B1', ink: '#B66B6B', mid: '#DE8E8E' },
  pleasure: { fill: '#A7D4BC', ink: '#4F9478', mid: '#6FBF9A' },
  sleep:    { fill: '#ABCEEB', ink: '#517FA6', mid: '#77AEDB' },
  food:     { fill: '#99D1C8', ink: '#48958B', mid: '#63BBAE' },
}

/**
 * Accent du module (CTA, onglet actif, liseré) : teal foncé dérivé du `primary`
 * `#6dbfc3`, assez soutenu pour un texte blanc lisible. Remplace l'ancien orange
 * vif `#F97316` retiré de tous les aplats (critère d'acceptation #161).
 */
export const MOOD_ACCENT = '#4FA5A9'

/**
 * Saisonnalité (dimension Humeur) : superposition pluri-annuelle. Année en cours
 * marquée, années comparées plus claires — hiérarchie visuelle, pas sémantique.
 */
export const SEASONALITY_CURRENT_COLOR = '#7E68C4'
export const SEASONALITY_PAST_COLOR = '#B3A6E0'

// Ruban / heatmap : opacité d'une cellule = base + (valeur / yMax) × span.
// La cellule la plus faible reste visible (base 0.38), la plus forte est pleine.
const RIBBON_OPACITY_BASE = 0.38
const RIBBON_OPACITY_SPAN = 0.62

/**
 * Opacité d'une cellule de ruban pour une valeur brute donnée (magnitude seule).
 * Retourne `null` quand la valeur est absente (jour non renseigné → cellule vide
 * à contour clair, jamais une valeur inventée — MDR).
 *
 * @param value valeur brute de la dimension (ex. 1..10), ou null/undefined si non saisie
 * @param yMax  borne haute de l'échelle (10 pour mood_tracker)
 */
export function ribbonCellOpacity(value: number | null | undefined, yMax: number): number | null {
  if (value == null || !Number.isFinite(value) || yMax <= 0) return null
  const clamped = Math.max(0, Math.min(value, yMax))
  return RIBBON_OPACITY_BASE + (clamped / yMax) * RIBBON_OPACITY_SPAN
}
