// ─── Machine d'état du lecteur « Décrocher d'une pensée » ────────────────────
//
// Flux partagé par les deux techniques (répétition de mot, distanciation) :
//   input → before → exercise → after → finish
//
// Reducer PUR (aucun I/O, aucune animation) : le rendu, les curseurs, le halo et
// l'enregistrement vivent dans les composants. Isoler ici la logique de transition
// la rend testable exhaustivement (Story 7 : A→E, arrêt anticipé, skip des mesures).
//
// Nullabilité PAR PAIRE (MDR + schéma defusion_sessions) : une mesure est UN objet
// `{ discomfort, belief }` ou `null` (étape « Passer »). Modéliser la mesure comme
// un seul objet rend structurellement impossible une dimension renseignée sans sa
// jumelle — l'invariant du schéma n'est jamais violable depuis l'UI.

export type DefusionStep = 'input' | 'before' | 'exercise' | 'after' | 'finish'

export interface DefusionMeasure {
  discomfort: number
  belief: number
}

export interface DefusionReaderState {
  step: DefusionStep
  wordOrThought: string
  before: DefusionMeasure | null
  after: DefusionMeasure | null
  durationSeconds: number
}

export type DefusionReaderAction =
  | { type: 'set_input'; value: string }
  | { type: 'submit_input' }
  | { type: 'submit_before'; measure: DefusionMeasure | null }
  | { type: 'finish_exercise'; durationSeconds: number }
  | { type: 'submit_after'; measure: DefusionMeasure | null }
  | { type: 'restart' }

export const INITIAL_READER_STATE: DefusionReaderState = {
  step: 'input',
  wordOrThought: '',
  before: null,
  after: null,
  durationSeconds: 0,
}

export function defusionReaderReducer(
  state: DefusionReaderState,
  action: DefusionReaderAction,
): DefusionReaderState {
  switch (action.type) {
    case 'set_input':
      return { ...state, wordOrThought: action.value }

    case 'submit_input':
      // Garde : mot/pensée non vide (le CTA est aussi désactivé côté UI).
      if (state.step !== 'input' || state.wordOrThought.trim() === '') return state
      return { ...state, step: 'before' }

    case 'submit_before':
      if (state.step !== 'before') return state
      return { ...state, before: action.measure, step: 'exercise' }

    case 'finish_exercise':
      if (state.step !== 'exercise') return state
      return { ...state, durationSeconds: action.durationSeconds, step: 'after' }

    case 'submit_after':
      if (state.step !== 'after') return state
      return { ...state, after: action.measure, step: 'finish' }

    case 'restart':
      return { ...INITIAL_READER_STATE }

    default:
      return state
  }
}
