import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { DefusionLayout } from './DefusionLayout'

const mockFetch = jest.fn().mockResolvedValue([])
jest.mock('@services/defusionService', () => ({
  fetchDefusionSessions: (...a: unknown[]) => mockFetch(...a),
  enabledTechniquesFromConfig: (config: { enabled_techniques?: unknown } | null) => {
    const raw = config?.enabled_techniques
    const all = ['word_repetition', 'linguistic_distancing']
    if (!Array.isArray(raw)) return all
    const kept = all.filter((t) => raw.includes(t))
    return kept.length > 0 ? kept : all
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

describe('DefusionLayout', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche la technique principale dominante et son bouton « Commencer »', async () => {
    render(<DefusionLayout moduleId="cognitive_saturation" />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByText('Répétition de mot')).toBeTruthy()
    expect(screen.getByText('Distanciation par le langage')).toBeTruthy()
    expect(screen.getByText('Commencer')).toBeTruthy()
  })

  it('affiche l\'état vide quand aucune séance', async () => {
    render(<DefusionLayout moduleId="cognitive_saturation" />)
    await waitFor(() => expect(screen.getByText('Aucune séance pour le moment')).toBeTruthy())
  })

  it('n\'affiche que la technique activée par le praticien', async () => {
    render(<DefusionLayout moduleId="cognitive_saturation" patientConfig={{ enabled_techniques: ['linguistic_distancing'] }} />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByText('Distanciation par le langage')).toBeTruthy()
    expect(screen.queryByText('Répétition de mot')).toBeNull()
  })
})
