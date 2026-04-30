// Palette spécifique au mode ado. Utilisée via le hook useTeen — ne pas importer directement dans les écrans.

export const TEEN_MODULE_COLORS: Record<string, string> = {
  // Sécurité & Crise → rouge-rose vif
  crisis_plan:              '#FF4D6D',
  therapeutic_commitment:   '#FF4D6D',
  distress_tolerance:       '#FF4D6D',
  // Surveillance & Somatique → violet moyen
  medication_side_effects:  '#8B5CF6',
  medication_adherence:     '#8B5CF6',
  // Hygiène de vie → bleu-cyan
  sleep_diary:              '#06B6D4',
  diet_weight_psycho:       '#06B6D4',
  chronobiology_tracker:    '#06B6D4',
  // Émotions & Humeur → orange-corail
  mood_tracker:             '#F97316',
  emotion_wheel:            '#F97316',
  behavioral_activation:    '#F97316',
  // Restructuration cognitive → vert menthe
  beck_columns:             '#10B981',
  cognitive_distortions:    '#10B981',
  grounding:                '#10B981',
  rim:                      '#10B981',
  // Anxiété → jaune-doré
  fear_thermometer:         '#F59E0B',
  exposure_hierarchy:       '#F59E0B',
  breathing_techniques:     '#F59E0B',
  cognitive_saturation:     '#F59E0B',
  // Addictologie → rose fuchsia
  craving_journal:          '#EC4899',
  decisional_balance:       '#EC4899',
  // Échelles & Questionnaires → turquoise
  phq9:                     '#0EA5E9',
  gad7:                     '#0EA5E9',
  bsl23:                    '#0EA5E9',
  rcads:                    '#0EA5E9',
  epds:                     '#0EA5E9',
  nsi:                      '#0EA5E9',
  snap_iv:                  '#0EA5E9',
  asrs6:                    '#0EA5E9',
  asrs18:                   '#0EA5E9',
}

export const TEEN_DEFAULT_COLOR = '#6366F1'

export function teenColorFor(moduleType: string): string {
  return TEEN_MODULE_COLORS[moduleType] ?? TEEN_DEFAULT_COLOR
}

export const teenCardStyle = {
  borderLeftWidth: 4,
  borderRadius: 14,
} as const
