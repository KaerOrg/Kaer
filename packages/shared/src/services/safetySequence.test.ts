import { describe, it, expect } from 'vitest'
import {
  buildDisplayableSteps,
  isLastStep,
  advance,
  goBack,
  formatProgress,
  INITIAL_STATE,
  type SequenceState,
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

describe('goBack', () => {
  it('ne renvoie rien depuis l\'accueil : c\'est la sortie du parcours', () => {
    expect(goBack({ kind: 'home' }, 3)).toBeNull()
  })

  it('revient à l\'accueil depuis la première étape', () => {
    expect(goBack({ kind: 'step', index: 0 }, 3)).toEqual({ kind: 'home' })
  })

  it('revient à l\'étape précédente', () => {
    expect(goBack({ kind: 'step', index: 2 }, 3)).toEqual({ kind: 'step', index: 1 })
  })

  it('revient à la dernière étape depuis les ressources', () => {
    expect(goBack({ kind: 'resources' }, 3)).toEqual({ kind: 'step', index: 2 })
  })

  it('revient à l\'accueil depuis les ressources quand le plan est vide', () => {
    expect(goBack({ kind: 'resources' }, 0)).toEqual({ kind: 'home' })
  })

  it('revient aux ressources depuis la clôture', () => {
    expect(goBack({ kind: 'closing' }, 3)).toEqual({ kind: 'resources' })
  })

  it('permet de revenir sur ses pas après un appui accidentel (aller-retour)', () => {
    const start: SequenceState = { kind: 'step', index: 1 }
    const forward = advance(start, 4)
    expect(goBack(forward, 4)).toEqual(start)
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
