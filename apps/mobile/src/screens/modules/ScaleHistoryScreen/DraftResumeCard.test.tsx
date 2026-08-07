import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DraftResumeCard } from './DraftResumeCard'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

function setup(over: Partial<React.ComponentProps<typeof DraftResumeCard>> = {}) {
  const props = {
    position: 5,
    title: 'Vous en étiez à la question 6',
    subtitle: 'Commencé le jeu. 3 avr. 21:40. Vos réponses sont gardées sur ce téléphone.',
    resumeLabel: 'Reprendre',
    restartLabel: 'Recommencer',
    onResume: jest.fn(),
    onRestart: jest.fn(),
    ...over,
  }
  render(<DraftResumeCard {...props} />)
  return props
}

describe('DraftResumeCard', () => {
  it('affiche la position atteinte et la date de début', () => {
    setup()
    expect(screen.getByText('Vous en étiez à la question 6')).toBeTruthy()
    expect(screen.getByText(/Commencé le jeu. 3 avr. 21:40/)).toBeTruthy()
  })

  it('propose les deux actions', () => {
    setup()
    expect(screen.getByText('Reprendre')).toBeTruthy()
    expect(screen.getByText('Recommencer')).toBeTruthy()
  })

  it('remonte la reprise', () => {
    const props = setup()
    fireEvent.press(screen.getByText('Reprendre'))
    expect(props.onResume).toHaveBeenCalledTimes(1)
    expect(props.onRestart).not.toHaveBeenCalled()
  })

  it('remonte le redémarrage', () => {
    const props = setup()
    fireEvent.press(screen.getByText('Recommencer'))
    expect(props.onRestart).toHaveBeenCalledTimes(1)
    expect(props.onResume).not.toHaveBeenCalled()
  })

  it('MDR : ne dit rien des réponses déjà données', () => {
    // La carte parle de la POSITION dans le questionnaire, jamais de son contenu :
    // rien de ce qu'elle affiche ne dépend d'une valeur saisie par le patient.
    setup({ title: 'Vous en étiez à la question 6' })
    expect(screen.queryByText(/score/i)).toBeNull()
    expect(screen.queryByText(/point/i)).toBeNull()
  })
})
