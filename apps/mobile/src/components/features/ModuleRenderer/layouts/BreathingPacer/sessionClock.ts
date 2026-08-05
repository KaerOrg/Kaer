// Horloge d'une session de respiration : temps réellement pratiqué, hors pauses.
//
// Le temps ne s'accumule PAS en comptant les ticks (un `setInterval` dérive, et
// continue de compter quand l'app passe en fond) : il se mesure à l'horloge murale
// entre le début du segment courant et maintenant. Le retour au premier plan reprend
// donc exactement là où on en était, sans avoir compté le temps passé en fond.

/** État de l'horloge : temps déjà cumulé, plus le segment en cours s'il tourne. */
export interface ClockState {
  /** Millisecondes accumulées par les segments terminés. */
  accumulatedMs: number
  /** Horodatage de début du segment en cours, `null` si l'horloge est en pause. */
  startedAtMs: number | null
}

/** Horloge à l'arrêt, rien de cumulé. */
export const CLOCK_IDLE: ClockState = { accumulatedMs: 0, startedAtMs: null }

/** Démarre ou reprend l'horloge. Sans effet si elle tourne déjà. */
export function startClock(state: ClockState, nowMs: number): ClockState {
  return state.startedAtMs !== null ? state : { ...state, startedAtMs: nowMs }
}

/** Met l'horloge en pause en figeant le segment en cours. Sans effet si déjà en pause. */
export function pauseClock(state: ClockState, nowMs: number): ClockState {
  if (state.startedAtMs === null) return state
  return {
    accumulatedMs: state.accumulatedMs + Math.max(0, nowMs - state.startedAtMs),
    startedAtMs: null,
  }
}

/** Millisecondes réellement écoulées, pauses exclues. */
export function elapsedMs(state: ClockState, nowMs: number): number {
  const running = state.startedAtMs === null ? 0 : Math.max(0, nowMs - state.startedAtMs)
  return state.accumulatedMs + running
}

/** Secondes réellement écoulées (valeur continue, pas un compte de ticks). */
export function elapsedSeconds(state: ClockState, nowMs: number): number {
  return elapsedMs(state, nowMs) / 1000
}
