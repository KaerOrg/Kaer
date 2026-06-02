import { DimensionTrackerView, type DimensionTrackerConfig } from '../../components/features/DimensionTrackerView'

// Suivi des effets indésirables du traitement — coquille du tracker générique
// multi-dimensions (cf. DimensionTrackerView), même mécanique que mood_tracker.
// 12 effets suivis en intensité 0–10 (base 0 = absent, pas de repère central).
// Les repères temporels servent d'« événements de traitement » (changement de dose…).
const SIDE_EFFECTS_CONFIG: DimensionTrackerConfig = {
  scaleId: 'medication_side_effects',
  moduleColor: '#8B5CF6',
  yMax: 10,
  ranges: ['7J', '1M', '3M', '1A'],
  // Ordre = sort_order du seed (sedation → sexual) = ordre des answers de la saisie.
  dimensionKeys: [
    'sedation', 'sleep', 'akathisia', 'tremors', 'dry_mouth', 'nausea',
    'constipation', 'weight', 'appetite_loss', 'dizziness', 'headache', 'sexual',
  ],
  dimensionColors: {
    sedation:      '#8B5CF6',
    sleep:         '#0EA5E9',
    akathisia:     '#F59E0B',
    tremors:       '#EF4444',
    dry_mouth:     '#06B6D4',
    nausea:        '#10B981',
    constipation:  '#A16207',
    weight:        '#EC4899',
    appetite_loss: '#14B8A6',
    dizziness:     '#6366F1',
    headache:      '#F97316',
    sexual:        '#A855F7',
  },
  emptyIcon: 'pill',
}

export default function MedicationSideEffectsHistoryScreen() {
  return <DimensionTrackerView config={SIDE_EFFECTS_CONFIG} />
}
