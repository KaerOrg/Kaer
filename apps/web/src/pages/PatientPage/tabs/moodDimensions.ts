// ─── Dimensions du mood_tracker côté web praticien ───────────────────────────
//
// Le service (`MoodPoint`) et l'i18n praticien indexent les 6 dimensions par clé
// FR (`humeur`, `energie`…) ; la palette partagée web ≡ mobile (`@kaer/shared`
// moodPalette) les indexe par clé EN (`mood`, `energy`…). Ce module fait le pont :
// une seule source ordonnée qui porte les deux clés, les couleurs partagées et la
// clé i18n existante. Parité stricte avec l'app patient (#161).
//
// MDR 2017/745 : la couleur n'encode que l'identité de la dimension.

import { MOOD_ACCENT, MOOD_DIMENSION_COLORS, type MoodDimensionColorSet, type MoodDimensionKey } from '@kaer/shared'
import type { MoodMarkerType } from '@services/engagementService'

export type MoodFrKey = 'humeur' | 'energie' | 'anxiete' | 'plaisir' | 'sommeil' | 'alimentation'

export interface MoodWebDimension {
  /** Clé FR portée par `MoodPoint` (engagementService) et l'i18n praticien. */
  readonly frKey: MoodFrKey
  /** Clé EN de la palette partagée. */
  readonly enKey: MoodDimensionKey
  /** Nuances fill/ink/mid partagées avec le mobile. */
  readonly colors: MoodDimensionColorSet
  /** Clé i18n existante du libellé (`evolution.mood_<frKey>`). */
  readonly labelKey: string
}

export const MOOD_WEB_DIMENSIONS: readonly MoodWebDimension[] = [
  { frKey: 'humeur',       enKey: 'mood',     colors: MOOD_DIMENSION_COLORS.mood,     labelKey: 'evolution.mood_humeur' },
  { frKey: 'energie',      enKey: 'energy',   colors: MOOD_DIMENSION_COLORS.energy,   labelKey: 'evolution.mood_energie' },
  { frKey: 'anxiete',      enKey: 'anxiety',  colors: MOOD_DIMENSION_COLORS.anxiety,  labelKey: 'evolution.mood_anxiete' },
  { frKey: 'plaisir',      enKey: 'pleasure', colors: MOOD_DIMENSION_COLORS.pleasure, labelKey: 'evolution.mood_plaisir' },
  { frKey: 'sommeil',      enKey: 'sleep',    colors: MOOD_DIMENSION_COLORS.sleep,    labelKey: 'evolution.mood_sommeil' },
  { frKey: 'alimentation', enKey: 'food',     colors: MOOD_DIMENSION_COLORS.food,     labelKey: 'evolution.mood_alimentation' },
]

// Couleur d'identité d'un type de repère (parité mobile lib/markerTheme). Encode
// le TYPE, jamais une gravité clinique (MDR). Clé i18n : evolution.marker_type_<type>.
export const MOOD_MARKER_COLORS: Record<MoodMarkerType, string> = {
  treatment: MOOD_ACCENT,
  life_event: '#9C89D6',
  other: '#94A3B8',
}

export const MOOD_MARKER_TYPES: readonly MoodMarkerType[] = ['treatment', 'life_event', 'other']
