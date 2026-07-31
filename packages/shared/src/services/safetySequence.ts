// ─── Logique pure de la Séquence du plan de sécurité ────────────────────────
//
// Fonctions sans dépendance React ni i18n — testables en isolation.
//
// Conformité MDR 2017/745, invariant fondateur du layout : le parcours se décide
// UNIQUEMENT sur la présence d'items, jamais sur leur contenu. C'est le même
// raisonnement que celui déjà écrit dans `initialPreviewKind.ts` : « existe-t-il
// quelque chose à afficher ? » est un routage structurel, pas une interprétation
// de donnée de santé.
//
// L'invariant est porté par les SIGNATURES, pas par une convention : ces fonctions
// reçoivent un `ReadonlySet<string>` d'identifiants de sections non vides. Elles
// n'ont donc structurellement accès ni au texte des items, ni à leur nombre au-delà
// de zéro, ni à leur nature. Ne jamais élargir ces paramètres à `PlanItem[]`.

/** Une étape retenue dans le parcours, avec son rang d'affichage. */
export interface SequenceStep {
  /** `section_id` de l'étape (`step_1` … `step_6`). */
  sectionId: string
  /** Rang affiché à l'utilisateur, 1-based, calculé APRÈS retrait des étapes vides. */
  position: number
}

/** État courant du parcours. Union discriminée : les états sont exclusifs par construction. */
export type SequenceState =
  | { kind: 'home' }
  | { kind: 'step'; index: number }
  | { kind: 'resources' }
  | { kind: 'closing' }

/** État d'entrée du parcours, et état de reprise après un redémarrage de l'app (P-12). */
export const INITIAL_STATE: SequenceState = { kind: 'home' }

/**
 * Étapes réellement affichables : celles qui portent au moins un item.
 *
 * Une étape vide est sautée et ne compte pas dans la progression — le patient ne
 * doit pas traverser un écran qui lui dirait « tu n'as rien ». Le rang affiché est
 * recalculé sur les seules étapes retenues, d'où « 2 / 4 » et non « 3 / 6 ».
 */
export function buildDisplayableSteps(
  orderedSectionIds: readonly string[],
  sectionsWithItems: ReadonlySet<string>,
): SequenceStep[] {
  const steps: SequenceStep[] = []
  for (const sectionId of orderedSectionIds) {
    if (!sectionsWithItems.has(sectionId)) continue
    steps.push({ sectionId, position: steps.length + 1 })
  }
  return steps
}

/** Cette étape est-elle la dernière affichable ? Le bouton primaire y change de libellé (P-7). */
export function isLastStep(index: number, totalSteps: number): boolean {
  return totalSteps > 0 && index >= totalSteps - 1
}

/**
 * État atteint en appuyant sur le bouton d'avancement (« Autre chose que j'ai prévu »).
 *
 * Un seul bouton d'avancement existe : avancer est une continuation, jamais un
 * constat d'échec. Depuis la dernière étape — ou depuis un plan entièrement vide —
 * on tombe sur l'écran des ressources, jamais sur un cul-de-sac.
 */
export function advance(state: SequenceState, totalSteps: number): SequenceState {
  switch (state.kind) {
    case 'home':
      return totalSteps > 0 ? { kind: 'step', index: 0 } : { kind: 'resources' }
    case 'step':
      return isLastStep(state.index, totalSteps)
        ? { kind: 'resources' }
        : { kind: 'step', index: state.index + 1 }
    case 'resources':
      return { kind: 'closing' }
    case 'closing':
      return { kind: 'closing' }
  }
}

/**
 * État atteint par le retour arrière, ou `null` quand il n'y a plus de retour possible.
 *
 * Le retour arrière est obligatoire (P-7) : un appui accidentel ne doit pas coûter
 * une étape définitivement. C'est l'argument même qui écarte le geste de balayage.
 */
export function goBack(state: SequenceState, totalSteps: number): SequenceState | null {
  switch (state.kind) {
    case 'home':
      return null
    case 'step':
      return state.index <= 0 ? { kind: 'home' } : { kind: 'step', index: state.index - 1 }
    case 'resources':
      return totalSteps > 0 ? { kind: 'step', index: totalSteps - 1 } : { kind: 'home' }
    case 'closing':
      return { kind: 'resources' }
  }
}

/**
 * Progression affichée, « n / m ». Chaîne vide s'il n'y a rien à numéroter :
 * un plan vide n'affiche pas « 0 / 0 », il n'affiche pas de progression du tout.
 */
export function formatProgress(index: number, totalSteps: number): string {
  if (totalSteps <= 0) return ''
  const position = Math.min(Math.max(index + 1, 1), totalSteps)
  return `${position} / ${totalSteps}`
}
