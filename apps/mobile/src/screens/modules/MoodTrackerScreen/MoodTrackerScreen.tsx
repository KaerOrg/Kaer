import { MOOD_ACCENT, MOOD_DIMENSION_COLORS, MOOD_DIMENSION_KEYS } from '@kaer/shared'
import { DimensionTrackerView, type DimensionTrackerConfig } from '../../../components/features/DimensionTrackerView'

// Thermomètre de l'humeur — coquille du tracker générique multi-dimensions
// (cf. DimensionTrackerView). 6 dimensions 1–10 avec repère « Normal » central
// (géré dans la saisie via mid_hint_code). Palette et accent teal partagés
// web ≡ mobile (packages/shared moodPalette) — refonte épique #162.
const fromPalette = <T,>(pick: (k: keyof typeof MOOD_DIMENSION_COLORS) => T): Record<string, T> =>
  Object.fromEntries(MOOD_DIMENSION_KEYS.map(k => [k, pick(k)]))

const MOOD_CONFIG: DimensionTrackerConfig = {
  scaleId: 'mood_tracker',
  moduleColor: MOOD_ACCENT,
  yMax: 10,
  ranges: ['7J', '1M', '3M', '1A'],
  dimensionKeys: MOOD_DIMENSION_KEYS,
  // Courbes, ruban et chips : mi-teinte. Empreinte et curseurs : fill pastel.
  dimensionColors: fromPalette(k => MOOD_DIMENSION_COLORS[k].mid),
  dimensionFills: fromPalette(k => MOOD_DIMENSION_COLORS[k].fill),
  emptyIcon: 'emoticon-outline',
  tabs: ['entry', 'tracking'],
  historyCardKind: 'fingerprint',
  showSeasonality: true,
}

export default function MoodTrackerScreen() {
  return <DimensionTrackerView config={MOOD_CONFIG} />
}
