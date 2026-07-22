import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DefusionHistory } from './DefusionHistory'
import type { DefusionSession } from '@services/defusionService'

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

const SESSION: DefusionSession = {
  id: 's1',
  technique: 'word_repetition',
  word_or_thought: 'rater',
  duration_seconds: 30,
  discomfort_before: 8,
  discomfort_after: 5,
  belief_before: 7,
  belief_after: 6,
  created_at: '2026-07-20T10:00:00Z',
}

function renderHistory(sessions: DefusionSession[] = [SESSION]) {
  return render(
    <DefusionHistory sessions={sessions} moduleId="cognitive_saturation" accent="#F59E0B" onClose={jest.fn()} />,
  )
}

describe('DefusionHistory — masquage du mot', () => {
  it('masque le mot par défaut, propose de l\'afficher', () => {
    renderHistory()
    expect(screen.queryByText('rater')).toBeNull()
    expect(screen.getByTestId('defusion-reveal-s1')).toBeTruthy()
  })

  it('révèle le mot ligne par ligne au tap', () => {
    renderHistory()
    fireEvent.press(screen.getByTestId('defusion-reveal-s1'))
    expect(screen.getByTestId('defusion-word-s1')).toBeTruthy()
    expect(screen.getByText('rater')).toBeTruthy()
  })

  it('remasque après démontage (réouverture de l\'historique)', () => {
    const { unmount } = renderHistory()
    fireEvent.press(screen.getByTestId('defusion-reveal-s1'))
    expect(screen.getByText('rater')).toBeTruthy()
    unmount()
    renderHistory()
    expect(screen.queryByText('rater')).toBeNull()
  })
})

describe('DefusionHistory — MDR (chiffres bruts, pas de flèche)', () => {
  it('affiche « 8 puis 5 » sans flèche ni écart', () => {
    renderHistory()
    expect(screen.getByText(/Inconfort 8 puis 5/)).toBeTruthy()
    expect(screen.getByText(/Conviction 7 puis 6/)).toBeTruthy()
    expect(screen.queryByText(/→/)).toBeNull()
    expect(screen.queryByText(/-3/)).toBeNull()
  })

  it('mesures passées (paire null) → « - (mesures passées) »', () => {
    renderHistory([
      { ...SESSION, discomfort_before: null, belief_before: null, discomfort_after: null, belief_after: null },
    ])
    expect(screen.getByText('- (mesures passées)')).toBeTruthy()
  })

  it('mesure après passée seule → « puis - » côté après', () => {
    renderHistory([{ ...SESSION, discomfort_after: null, belief_after: null }])
    expect(screen.getByText(/Inconfort 8 puis -/)).toBeTruthy()
  })
})
