import { describe, it, expect } from 'vitest'
import {
  buildDisplayableSteps,
  isLastStep,
  advance,
  formatProgress,
  INITIAL_STATE,
  INITIAL_PATH,
  currentState,
  goTo,
  advancePath,
  backPath,
  type SequenceState,
  type SequencePath,
} from './safetySequence'

const SIX = ['step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6'] as const

describe('buildDisplayableSteps', () => {
  it('retient les étapes qui ont au moins un item, dans l\'ordre fourni', () => {
    const steps = buildDisplayableSteps([...SIX], new Set(['step_1', 'step_3', 'step_6']))
    expect(steps).toEqual([
      { sectionId: 'step_1', position: 1 },
      { sectionId: 'step_3', position: 2 },
      { sectionId: 'step_6', position: 3 },
    ])
  })

  it('renumérote après retrait des étapes vides (« 2 / 3 », pas « 3 / 6 »)', () => {
    const steps = buildDisplayableSteps([...SIX], new Set(['step_2', 'step_5']))
    expect(steps.map(s => s.position)).toEqual([1, 2])
  })

  it('renvoie une liste vide quand aucune étape n\'a d\'item (plan vide)', () => {
    expect(buildDisplayableSteps([...SIX], new Set())).toEqual([])
  })

  it('ignore une section non vide qui n\'est pas dans l\'ordre de référence', () => {
    const steps = buildDisplayableSteps(['step_1'], new Set(['step_1', 'step_9']))
    expect(steps).toEqual([{ sectionId: 'step_1', position: 1 }])
  })

  it('préserve l\'ordre de référence, pas celui du Set', () => {
    const steps = buildDisplayableSteps([...SIX], new Set(['step_6', 'step_1']))
    expect(steps.map(s => s.sectionId)).toEqual(['step_1', 'step_6'])
  })
})

describe('isLastStep', () => {
  it('reconnaît la dernière étape affichable', () => {
    expect(isLastStep(2, 3)).toBe(true)
  })

  it('est faux sur une étape intermédiaire', () => {
    expect(isLastStep(0, 3)).toBe(false)
  })

  it('est faux quand il n\'y a aucune étape', () => {
    expect(isLastStep(0, 0)).toBe(false)
  })

  it('reste vrai avec une seule étape', () => {
    expect(isLastStep(0, 1)).toBe(true)
  })
})

describe('advance', () => {
  it('mène de l\'accueil à la première étape', () => {
    expect(advance({ kind: 'home' }, 3)).toEqual({ kind: 'step', index: 0 })
  })

  it('saute directement aux ressources quand le plan est vide', () => {
    expect(advance({ kind: 'home' }, 0)).toEqual({ kind: 'resources' })
  })

  it('passe à l\'étape suivante', () => {
    expect(advance({ kind: 'step', index: 0 }, 3)).toEqual({ kind: 'step', index: 1 })
  })

  it('mène aux ressources depuis la dernière étape, jamais dans un cul-de-sac', () => {
    expect(advance({ kind: 'step', index: 2 }, 3)).toEqual({ kind: 'resources' })
  })

  it('mène des ressources à la clôture', () => {
    expect(advance({ kind: 'resources' }, 3)).toEqual({ kind: 'closing' })
  })

  it('reste sur la clôture, qui est un état terminal', () => {
    expect(advance({ kind: 'closing' }, 3)).toEqual({ kind: 'closing' })
  })
})

describe('chemin parcouru', () => {
  it('démarre sur l\'accueil, sans retour possible', () => {
    expect(currentState(INITIAL_PATH)).toEqual({ kind: 'home' })
    expect(backPath(INITIAL_PATH)).toBeNull()
  })

  it('avance d\'un écran et sait revenir sur ses pas après un appui accidentel', () => {
    const path = advancePath(INITIAL_PATH, 3)
    expect(currentState(path)).toEqual({ kind: 'step', index: 0 })
    const back = backPath(path)
    expect(back).not.toBeNull()
    expect(currentState(back as SequencePath)).toEqual({ kind: 'home' })
  })

  it('enchaîne le parcours linéaire jusqu\'aux ressources puis à la clôture', () => {
    let path = advancePath(INITIAL_PATH, 2)     // étape 1
    path = advancePath(path, 2)                 // étape 2
    path = advancePath(path, 2)                 // ressources
    expect(currentState(path)).toEqual({ kind: 'resources' })
    path = advancePath(path, 2)                 // clôture
    expect(currentState(path)).toEqual({ kind: 'closing' })
  })

  // Le cœur du modèle : un raccourci de l'accueil ne fait pas traverser les écrans
  // sautés, donc le retour ne doit pas y renvoyer. Un état seul ne saurait pas le dire.
  it('revient à l\'accueil depuis une étape atteinte par un raccourci, pas à l\'étape précédente', () => {
    const shortcut: SequenceState = { kind: 'step', index: 5 }
    const path = goTo(INITIAL_PATH, shortcut)
    expect(currentState(path)).toEqual(shortcut)
    expect(currentState(backPath(path) as SequencePath)).toEqual({ kind: 'home' })
  })

  it('revient à l\'accueil depuis la clôture atteinte par un raccourci, pas aux ressources', () => {
    const path = goTo(INITIAL_PATH, { kind: 'closing' })
    expect(currentState(backPath(path) as SequencePath)).toEqual({ kind: 'home' })
  })

  it('revient aux ressources depuis la clôture atteinte par le parcours linéaire', () => {
    let path = advancePath(INITIAL_PATH, 0)     // plan vide : accueil → ressources
    expect(currentState(path)).toEqual({ kind: 'resources' })
    path = advancePath(path, 0)                 // → clôture
    expect(currentState(backPath(path) as SequencePath)).toEqual({ kind: 'resources' })
  })

  it('dépile écran par écran, jusqu\'à l\'accueil et pas au-delà', () => {
    let path = advancePath(INITIAL_PATH, 3)
    path = advancePath(path, 3)
    path = backPath(path) as SequencePath
    path = backPath(path) as SequencePath
    expect(currentState(path)).toEqual({ kind: 'home' })
    expect(backPath(path)).toBeNull()
  })

  it('ne modifie jamais le chemin reçu (fonctions pures)', () => {
    const path = advancePath(INITIAL_PATH, 3)
    const before = JSON.stringify(path)
    goTo(path, { kind: 'closing' })
    backPath(path)
    expect(JSON.stringify(path)).toBe(before)
  })
})

describe('formatProgress', () => {
  it('affiche le rang sur le total des étapes retenues', () => {
    expect(formatProgress(1, 4)).toBe('2 / 4')
  })

  it('n\'affiche aucune progression quand il n\'y a rien à numéroter', () => {
    expect(formatProgress(0, 0)).toBe('')
  })

  it('borne le rang au total, sans jamais dépasser', () => {
    expect(formatProgress(9, 3)).toBe('3 / 3')
  })

  it('borne le rang à 1 au minimum', () => {
    expect(formatProgress(-2, 3)).toBe('1 / 3')
  })
})

describe('INITIAL_STATE', () => {
  it('est l\'accueil : la reprise après redémarrage ne restaure aucun état (P-12)', () => {
    expect(INITIAL_STATE).toEqual({ kind: 'home' })
  })
})
