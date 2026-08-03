import type { BreathingPhase } from '@services/breathingService'

/** Où en est la session dans le cycle de la technique, à un instant donné. */
export interface PhaseCursor {
  /** Index de la phase courante dans `technique.phases`. */
  phaseIndex: number
  /** Numéro d'instance de phase depuis le début : change à CHAQUE changement de phase. */
  phaseInstance: number
  /** Secondes restantes dans la phase, arrondies au supérieur (le décompte affiché). */
  remainingInPhase: number
  /** Secondes que dure la phase courante. */
  phaseSeconds: number
  /** Cycles complets terminés. */
  cyclesCompleted: number
}

/**
 * Position dans le cycle après `elapsedSeconds` de pratique. **Pure** : le même temps
 * écoulé donne toujours le même curseur, ce qui rend la session rejouable et testable
 * sans horloge.
 *
 * Sert indifféremment les cinq techniques (2, 3 ou 4 phases) : le nombre de phases
 * n'est jamais codé en dur, il vient de la config.
 *
 * Retourne `null` pour une technique sans phase ou de durée nulle : l'appelant ne doit
 * alors rien afficher plutôt que de diviser par zéro.
 */
export function cursorAt(
  phases: readonly BreathingPhase[],
  elapsedSeconds: number,
): PhaseCursor | null {
  const cycleSeconds = phases.reduce((total, phase) => total + phase.seconds, 0)
  if (phases.length === 0 || cycleSeconds <= 0) return null

  const elapsed = Math.max(0, elapsedSeconds)
  const cyclesCompleted = Math.floor(elapsed / cycleSeconds)
  const intoCycle = elapsed - cyclesCompleted * cycleSeconds

  let phaseStart = 0
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index]
    const phaseEnd = phaseStart + phase.seconds
    // `<` et non `<=` : à la seconde pile, on est déjà dans la phase suivante.
    if (intoCycle < phaseEnd) {
      return {
        phaseIndex: index,
        phaseInstance: cyclesCompleted * phases.length + index,
        remainingInPhase: Math.ceil(phaseEnd - intoCycle),
        phaseSeconds: phase.seconds,
        cyclesCompleted,
      }
    }
    phaseStart = phaseEnd
  }

  // Inatteignable (intoCycle < cycleSeconds par construction), mais le compilateur
  // ne peut pas le savoir : on rend la dernière phase plutôt que `null`.
  const lastIndex = phases.length - 1
  return {
    phaseIndex: lastIndex,
    phaseInstance: cyclesCompleted * phases.length + lastIndex,
    remainingInPhase: 1,
    phaseSeconds: phases[lastIndex].seconds,
    cyclesCompleted,
  }
}

/**
 * Une session est « menée au bout » si le patient a pratiqué au moins la moitié de la
 * durée qu'il avait choisie. En deçà, elle est enregistrée quand même, marquée
 * interrompue (`completed = false`) : c'est une donnée, pas un échec.
 */
export function isCompleted(elapsedSeconds: number, plannedSeconds: number): boolean {
  if (plannedSeconds <= 0) return false
  return elapsedSeconds >= plannedSeconds / 2
}

/**
 * Un nombre de secondes au format `m:ss`, borné à zéro. Sert au temps restant de la
 * session comme à la durée pratiquée affichée à la clôture : le nom décrit le format,
 * pas ce que la valeur signifie.
 */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
