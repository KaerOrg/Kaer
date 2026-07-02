import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { BreathingPacerLayout } from './BreathingPacerLayout'
import type { BreathingTechnique } from '@services/breathingService'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const TECHNIQUES: BreathingTechnique[] = [
  { key: 'coherence_cardiaque', color: '#4F46E5', recommended_duration_min: 5, phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }] },
  { key: 'carree', color: '#D97706', recommended_duration_min: 4, phases: [{ type: 'inhale', seconds: 4 }, { type: 'hold_in', seconds: 4 }, { type: 'exhale', seconds: 4 }, { type: 'hold_out', seconds: 4 }] },
]

const mockFetchSessions = jest.fn().mockResolvedValue([])
jest.mock('@services/breathingService', () => ({
  techniquesFromFields: () => TECHNIQUES,
  fetchBreathingSessions: () => mockFetchSessions(),
  getCycleDuration: (t: { phases: { seconds: number }[] }) => t.phases.reduce((a, p) => a + p.seconds, 0),
}))

jest.mock('../../../../../hooks/useTeen', () => ({
  useTeen: () => ({ tt: () => '' }),
}))

// Le lecteur d'exercice a son propre test : ici, un stub qui expose la clé de la
// technique active pour vérifier l'ouverture de la modale par le layout.
jest.mock('./BreathingExercisePlayer', () => ({
  BreathingExercisePlayer: ({ technique }: { technique: { key: string } }) => {
    const { Text } = require('react-native')
    return <Text testID="player">{technique.key}</Text>
  },
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BreathingPacerLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchSessions.mockResolvedValue([])
  })

  it('affiche une carte par technique', async () => {
    render(<BreathingPacerLayout fields={[]} moduleId="breathing_techniques" />)
    expect(await screen.findByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.getByText('Respiration carrée')).toBeTruthy()
  })

  it('ouvre le lecteur d\'exercice au tap sur une carte', async () => {
    render(<BreathingPacerLayout fields={[]} moduleId="breathing_techniques" />)
    fireEvent.press(await screen.findByLabelText('Respiration carrée'))
    const player = await screen.findByTestId('player')
    expect(player.props.children).toBe('carree')
  })

  it('n\'affiche pas de lecteur tant qu\'aucune technique n\'est sélectionnée', async () => {
    render(<BreathingPacerLayout fields={[]} moduleId="breathing_techniques" />)
    await screen.findByText('Cohérence cardiaque')
    expect(screen.queryByTestId('player')).toBeNull()
  })

  it('affiche l\'historique récent quand des sessions existent', async () => {
    mockFetchSessions.mockResolvedValue([
      { id: 's1', date: '2026-04-14', technique_key: 'carree', duration_seconds: 240, created_at: '2026-04-14T10:00:00' },
    ])
    render(<BreathingPacerLayout fields={[]} moduleId="breathing_techniques" />)
    expect(await screen.findByText('Sessions récentes')).toBeTruthy()
    // "Respiration carrée" apparaît dans la carte ET dans l'historique.
    expect(screen.getAllByText('Respiration carrée').length).toBeGreaterThanOrEqual(2)
  })
})
