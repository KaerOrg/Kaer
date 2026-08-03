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

// ─── Chemin parcouru ─────────────────────────────────────────────────────────
//
// Depuis P-6, l'accueil ouvre des raccourcis : « Me mettre à l'abri » saute
// directement à l'étape 6, « Ce qui me donne envie de tenir » à la clôture. Le
// parcours n'est donc plus une ligne, et un retour arrière calculé depuis le seul
// état courant renverrait le patient là où il n'est jamais passé (l'étape 5 qu'il a
// sautée, l'écran des ressources qu'il n'a pas vu).
//
// Le chemin conserve donc les écrans RÉELLEMENT traversés, et le retour dépile.
// C'est aussi ce qui tient la promesse de P-7 : un appui accidentel ne coûte jamais
// une étape définitivement, quel que soit le chemin emprunté.
//
// Invariant : le chemin n'est jamais vide, son dernier élément est l'écran courant.

/** Écrans traversés, dans l'ordre. Le dernier est l'écran affiché. */
export type SequencePath = readonly [SequenceState, ...SequenceState[]]

/** Chemin d'entrée du parcours, et de reprise après un redémarrage de l'app (P-12). */
export const INITIAL_PATH: SequencePath = [INITIAL_STATE]

// Ces trois fonctions déstructurent le chemin (`[first, ...rest]`) plutôt que de
// l'indexer : c'est ce qui permet à TypeScript de garder le type « tuple non vide »
// sans le moindre cast, donc de rendre l'invariant vérifiable à la compilation.

/** Écran affiché. */
export function currentState(path: SequencePath): SequenceState {
  const [first, ...rest] = path
  return rest.at(-1) ?? first
}

/** Chemin prolongé d'un écran atteint par un raccourci de l'accueil (P-6). */
export function goTo(path: SequencePath, next: SequenceState): SequencePath {
  const [first, ...rest] = path
  return [first, ...rest, next]
}

/** Chemin prolongé de l'écran suivant du parcours linéaire. */
export function advancePath(path: SequencePath, totalSteps: number): SequencePath {
  return goTo(path, advance(currentState(path), totalSteps))
}

/**
 * Chemin dépilé d'un écran, ou `null` quand il n'y a plus de retour possible
 * (on est resté sur l'écran d'arrivée).
 */
export function backPath(path: SequencePath): SequencePath | null {
  const [first, ...rest] = path
  if (rest.length === 0) return null
  rest.pop()
  return [first, ...rest]
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
