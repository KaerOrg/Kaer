import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { BreathingExercisePlayer } from './BreathingExercisePlayer'
import type { BreathingTechnique } from '@services/breathingService'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSave = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/breathingService', () => ({
  getCycleDuration: (t: { phases: { seconds: number }[] }) => t.phases.reduce((a, p) => a + p.seconds, 0),
  saveBreathingSession: (...args: unknown[]) => mockSave(...args),
}))

jest.mock('../../../../../lib/database', () => ({ generateId: () => 'session-id' }))

// showConfirm exécute immédiatement onConfirm (comme une confirmation acceptée).
const mockShowConfirm = jest.fn((opts: { onConfirm: () => void | Promise<void> }) => opts.onConfirm())
jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

const CARREE: BreathingTechnique = {
  key: 'carree',
  color: '#D97706',
  recommended_duration_min: 4,
  phases: [
    { type: 'inhale', seconds: 4 },
    { type: 'hold_in', seconds: 4 },
    { type: 'exhale', seconds: 4 },
    { type: 'hold_out', seconds: 4 },
  ],
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingExercisePlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('affiche le nom de la technique et le bouton Démarrer', () => {
    render(<BreathingExercisePlayer technique={CARREE} moduleId="breathing_techniques" onClose={jest.fn()} />)
    expect(screen.getByText('Respiration carrée')).toBeTruthy()
    expect(screen.getByText('Démarrer')).toBeTruthy()
  })

  it('ferme sans enregistrer si aucune session n\'a démarré', () => {
    const onClose = jest.fn()
    render(<BreathingExercisePlayer technique={CARREE} moduleId="breathing_techniques" onClose={onClose} />)
    fireEvent.press(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalledWith(false)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('démarre puis fait progresser le décompte à chaque seconde', () => {
    render(<BreathingExercisePlayer technique={CARREE} moduleId="breathing_techniques" onClose={jest.fn()} />)
    fireEvent.press(screen.getByText('Démarrer'))
    // 3 ticks : totalSeconds = 3 → le compteur de durée affiche "3s".
    act(() => { jest.advanceTimersByTime(3000) })
    expect(screen.getByText('3s')).toBeTruthy()
  })

  it('enregistre la session et ferme (saved) à l\'arrêt après avoir tourné', async () => {
    const onClose = jest.fn()
    render(<BreathingExercisePlayer technique={CARREE} moduleId="breathing_techniques" onClose={onClose} />)
    fireEvent.press(screen.getByText('Démarrer'))
    act(() => { jest.advanceTimersByTime(5000) })

    await act(async () => {
      fireEvent.press(screen.getByText('Terminer'))
    })

    expect(mockShowConfirm).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ technique_key: 'carree', duration_seconds: 5, id: 'session-id' })
    )
    expect(onClose).toHaveBeenCalledWith(true)
  })
})
