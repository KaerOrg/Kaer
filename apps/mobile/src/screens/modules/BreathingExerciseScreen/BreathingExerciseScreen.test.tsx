import React from 'react'
import { render, screen } from '@testing-library/react-native'
import BreathingExerciseScreen from './BreathingExerciseScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────

let mockRouteParams: { techniqueKey: string } = { techniqueKey: 'carree' }

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
}))

jest.mock('../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: jest.fn() }),
}))

jest.mock('../../../lib/database', () => ({ generateId: () => 'id' }))

const CARREE = {
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

const mockFetchTechniques = jest.fn().mockResolvedValue([CARREE])
jest.mock('../../../services/breathingService', () => ({
  fetchBreathingTechniques: () => mockFetchTechniques(),
  getCycleDuration: (t: { phases: { seconds: number }[] }) => t.phases.reduce((a, p) => a + p.seconds, 0),
  saveBreathingSession: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingExerciseScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { techniqueKey: 'carree' }
    mockFetchTechniques.mockResolvedValue([CARREE])
  })

  it('charge la technique depuis la base et affiche le bouton Démarrer', async () => {
    render(<BreathingExerciseScreen />)
    expect(await screen.findByText('Démarrer')).toBeTruthy()
    expect(mockFetchTechniques).toHaveBeenCalled()
  })

  it('affiche un message si la clé de technique est introuvable', async () => {
    mockRouteParams = { techniqueKey: 'inconnue' }
    render(<BreathingExerciseScreen />)
    expect(await screen.findByText('Technique introuvable.')).toBeTruthy()
  })
})
