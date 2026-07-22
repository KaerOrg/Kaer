import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { WordRepetitionExercise } from './WordRepetitionExercise'

// showConfirm exécute immédiatement onConfirm (confirmation acceptée).
const mockShowConfirm = jest.fn((opts: { onConfirm: () => void }) => opts.onConfirm())
jest.mock('../../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

const baseProps = {
  word: 'rater',
  accent: '#F59E0B',
  instruction: 'Répétez le mot à voix haute',
  remainingLabel: (n: number) => `encore ${n} s`,
  pauseLabel: 'Pause',
  resumeLabel: 'Reprendre',
  stopLabel: 'Arrêter',
  pausedLabel: 'En pause',
  confirm: { title: 'Arrêter ?', message: 'La durée sera enregistrée.', confirmLabel: 'Arrêter' },
}

describe('WordRepetitionExercise', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  it('affiche le mot et l\'instruction', () => {
    render(<WordRepetitionExercise {...baseProps} onDone={jest.fn()} />)
    expect(screen.getByText('rater')).toBeTruthy()
    expect(screen.getByText('Répétez le mot à voix haute')).toBeTruthy()
  })

  it('termine automatiquement après 30 s avec la durée pleine', () => {
    const onDone = jest.fn()
    render(<WordRepetitionExercise {...baseProps} onDone={onDone} />)
    act(() => { jest.advanceTimersByTime(30000) })
    expect(onDone).toHaveBeenCalledWith(30)
  })

  it('met en pause : le décompte n\'avance plus', () => {
    const onDone = jest.fn()
    render(<WordRepetitionExercise {...baseProps} onDone={onDone} />)
    act(() => { jest.advanceTimersByTime(3000) })
    fireEvent.press(screen.getByText('Pause'))
    act(() => { jest.advanceTimersByTime(30000) })
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByText('En pause')).toBeTruthy()
  })

  it('arrêt anticipé : confirme puis termine avec la durée réelle écoulée', () => {
    const onDone = jest.fn()
    render(<WordRepetitionExercise {...baseProps} onDone={onDone} />)
    act(() => { jest.advanceTimersByTime(9000) })
    fireEvent.press(screen.getByText('Arrêter'))
    expect(mockShowConfirm).toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledWith(9)
  })
})
