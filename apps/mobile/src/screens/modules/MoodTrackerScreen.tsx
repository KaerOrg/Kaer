import { DimensionTrackerView, type DimensionTrackerConfig } from '../../components/features/DimensionTrackerView'

// Thermomètre de l'humeur — coquille du tracker générique multi-dimensions
// (cf. DimensionTrackerView). 6 dimensions 1–10 avec repère « Normal » central
// (géré dans la saisie via mid_hint_code). Accent orange mood.
const MOOD_CONFIG: DimensionTrackerConfig = {
  scaleId: 'mood_tracker',
  moduleColor: '#F97316',
  yMax: 10,
  ranges: ['7J', '1M', '3M', '1A'],
  dimensionKeys: ['mood', 'energy', 'anxiety', 'pleasure', 'sleep', 'food'],
  dimensionColors: {
    mood:     '#8B5CF6',
    energy:   '#F59E0B',
    anxiety:  '#EF4444',
    pleasure: '#059669',
    sleep:    '#0EA5E9',
    food:     '#10B981',
  },
  emptyIcon: 'emoticon-outline',
}

export default function MoodTrackerScreen() {
  return <DimensionTrackerView config={MOOD_CONFIG} />
}
