// Modes de navigation du parcours d'exposition unifié.
//
//   ladder    → échelle de la peur : marches classées par SUDS cible
//   step_form → ajout / édition d'une marche (libellé + SUDS cible)
//   detail    → une marche : courbe de progression + séances passées
//   exposure  → formulaire d'exposition enrichi (avant → pendant → après)
export type ExposureMode =
  | { kind: 'ladder' }
  | { kind: 'step_form'; stepId: string | null }
  | { kind: 'detail'; stepId: string }
  | { kind: 'exposure'; stepId: string; entryId: string | null }

// Config numérique + couleurs résolues depuis le field `exposure_tracker_config`.
export interface ExposureConfig {
  sudsMin: number
  sudsMax: number
  sudsStep: number
  sudsDefaultBefore: number
  beforeColor: string
  peakColor: string
  afterColor: string
}

// Brouillon produit par le formulaire d'exposition, mappé en FearEntry par l'orchestrateur.
export interface ExposureDraft {
  date: string
  suds_before: number
  suds_peak: number | null
  suds_after: number | null
  expectation_text: string | null
  outcome_text: string | null
  selectedStrategies: string[]
  customStrategy: string | null
  notes: string | null
}
