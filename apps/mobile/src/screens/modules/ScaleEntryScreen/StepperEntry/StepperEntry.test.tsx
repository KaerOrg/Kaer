import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { StepperEntry } from './StepperEntry'
import type { StepperQuestion, Translate } from './types'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

const LABELS: Record<string, string> = {
  'common.back': 'Retour',
  'modules.scale_entry.review_title': 'Avant d\'envoyer',
  'modules.scale_entry.review_hint': 'Touchez une ligne pour la modifier.',
  'modules.scale_entry.unanswered': 'Sans réponse',
}

const t: Translate = (key, params) => {
  if (key === 'modules.scale_entry.progress') return `${params?.current} / ${params?.total}`
  return LABELS[key] ?? key
}

const OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Plusieurs jours' },
]

const QUESTIONS: StepperQuestion[] = [
  { id: 'q1', label: 'Item un', options: OPTIONS },
  { id: 'q2', label: 'Item deux', options: OPTIONS },
  { id: 'q3', label: 'Item trois', options: OPTIONS },
]

function setup(over: Partial<React.ComponentProps<typeof StepperEntry>> = {}) {
  const props = {
    questions: QUESTIONS,
    instructions: ['Au cours des 2 dernières semaines,'],
    answers: [null, null, null] as (number | null)[],
    onAnswer: jest.fn(),
    onSubmit: jest.fn(),
    onExit: jest.fn(),
    submitLabel: 'Envoyer mes réponses',
    saving: false,
    t,
    ...over,
  }
  const view = render(<StepperEntry {...props} />)
  return { ...view, props }
}

/** Laisse filer le délai d'avance automatique. */
function advance(): void {
  act(() => { jest.advanceTimersByTime(400) })
}

describe('StepperEntry', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers() })

  it('affiche le premier item, sa consigne et sa progression', () => {
    setup()
    expect(screen.getByText('Item un')).toBeTruthy()
    expect(screen.getByText('Au cours des 2 dernières semaines,')).toBeTruthy()
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('répète la consigne sur chaque item', () => {
    // C'est la fenêtre temporelle de l'instrument : sans elle, chacun répond sur la
    // période qu'il veut.
    const { rerender, props } = setup()
    fireEvent.press(screen.getByText('Jamais'))
    advance()
    rerender(<StepperEntry {...props} answers={[0, null, null]} />)
    expect(screen.getByText('Item deux')).toBeTruthy()
    expect(screen.getByText('Au cours des 2 dernières semaines,')).toBeTruthy()
  })

  it('remonte la réponse et avance seule après le délai', () => {
    const { props } = setup()
    fireEvent.press(screen.getByText('Plusieurs jours'))
    expect(props.onAnswer).toHaveBeenCalledWith(0, 1)
    // Avant le délai, on est encore sur l'item : la coche doit être vue.
    expect(screen.getByText('Item un')).toBeTruthy()
    advance()
    expect(screen.getByText('Item deux')).toBeTruthy()
    expect(screen.getByText('2 / 3')).toBeTruthy()
  })

  it('changer d\'avis avant la fin du délai ne fait pas avancer deux fois', () => {
    setup()
    fireEvent.press(screen.getByText('Jamais'))
    act(() => { jest.advanceTimersByTime(150) })
    fireEvent.press(screen.getByText('Plusieurs jours'))
    advance()
    expect(screen.getByText('Item deux')).toBeTruthy()
  })

  it('le retour revient à l\'item précédent, avec sa réponse', () => {
    const { rerender, props } = setup({ answers: [1, null, null] })
    fireEvent.press(screen.getByText('Jamais'))
    advance()
    rerender(<StepperEntry {...props} answers={[1, null, null]} />)
    expect(screen.getByText('Item deux')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Retour'))
    expect(screen.getByText('Item un')).toBeTruthy()
    // La réponse précédente est restaurée : l'option porte la coche de sélection.
    expect(screen.getByRole('radio', { selected: true })).toBeTruthy()
  })

  it('le retour depuis le premier item sort du questionnaire', () => {
    const { props } = setup()
    fireEvent.press(screen.getByLabelText('Retour'))
    expect(props.onExit).toHaveBeenCalled()
  })

  it('le dernier item mène à la relecture, pas à l\'envoi', () => {
    const { props } = setup({ answers: [0, 0, null] })
    // Aller jusqu'au dernier item.
    fireEvent.press(screen.getByText('Jamais')); advance()
    fireEvent.press(screen.getByText('Jamais')); advance()
    expect(screen.getByText('Item trois')).toBeTruthy()
    fireEvent.press(screen.getByText('Jamais')); advance()

    expect(screen.getByText('Avant d\'envoyer')).toBeTruthy()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })
})

describe('StepperEntry : relecture', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers() })

  /** Amène le parcours jusqu'à la relecture avec toutes les réponses données. */
  function setupOnReview(answers: (number | null)[] = [0, 1, 0]) {
    const view = setup({ answers })
    for (let i = 0; i < QUESTIONS.length; i++) {
      fireEvent.press(screen.getAllByText('Jamais')[0])
      advance()
    }
    return view
  }

  it('liste les dix items avec la modalité choisie', () => {
    setupOnReview()
    expect(screen.getByText('1. Item un')).toBeTruthy()
    expect(screen.getByText('2. Item deux')).toBeTruthy()
    expect(screen.getByText('3. Item trois')).toBeTruthy()
    expect(screen.getAllByText('Jamais')).toHaveLength(2)     // items 1 et 3
    expect(screen.getByText('Plusieurs jours')).toBeTruthy()  // item 2
  })

  it('n\'envoie rien sans appui explicite sur le bouton', () => {
    const { props } = setupOnReview()
    expect(props.onSubmit).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('Envoyer mes réponses'))
    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })

  it('un tap sur une ligne ouvre l\'item, et le retour ramène à la relecture', () => {
    setupOnReview()
    fireEvent.press(screen.getByLabelText('Item deux'))
    expect(screen.getByText('Item deux')).toBeTruthy()
    expect(screen.getByText('2 / 3')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Retour'))
    expect(screen.getByText('Avant d\'envoyer')).toBeTruthy()
  })

  it('corriger une réponse depuis la relecture y ramène, sans repartir dans le parcours', () => {
    setupOnReview()
    fireEvent.press(screen.getByLabelText('Item un'))
    fireEvent.press(screen.getByText('Plusieurs jours'))
    advance()
    expect(screen.getByText('Avant d\'envoyer')).toBeTruthy()
  })

  it('le retour depuis la relecture revient au dernier item', () => {
    setupOnReview()
    fireEvent.press(screen.getByLabelText('Retour'))
    expect(screen.getByText('Item trois')).toBeTruthy()
    expect(screen.getByText('3 / 3')).toBeTruthy()
  })

  it('signale un item sans réponse sans le mettre en avant', () => {
    setupOnReview([0, null, 0])
    expect(screen.getByText('Sans réponse')).toBeTruthy()
  })

  it('MDR : aucun total, aucun score, aucun tri par valeur', () => {
    // L'écran affiche des réponses, il ne les qualifie pas. L'ordre est celui du
    // questionnaire, et l'item le plus lourd se lit comme les autres.
    setupOnReview([0, 1, 0])
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.queryByText('/ 27')).toBeNull()
    const rows = screen.getAllByRole('button').map(b => b.props.accessibilityLabel)
    expect(rows).toEqual(expect.arrayContaining(['Item un', 'Item deux', 'Item trois']))
    expect(rows.indexOf('Item un')).toBeLessThan(rows.indexOf('Item deux'))
    expect(rows.indexOf('Item deux')).toBeLessThan(rows.indexOf('Item trois'))
  })
})
