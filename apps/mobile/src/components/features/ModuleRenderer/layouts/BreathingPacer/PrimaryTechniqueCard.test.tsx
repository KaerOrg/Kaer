import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PrimaryTechniqueCard } from './PrimaryTechniqueCard'
import type { BreathingTechnique } from '@services/breathingService'

const TECHNIQUE: BreathingTechnique = {
  key: 'coherence_cardiaque',
  color: '#4A9EA3',
  recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
}

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

function renderCard(over: Partial<React.ComponentProps<typeof PrimaryTechniqueCard>> = {}) {
  const props = {
    technique: TECHNIQUE,
    durationMin: 5,
    lastSessionLabel: 'Dernière session : hier, 5 min',
    lbl,
    onStart: jest.fn(),
    onInfo: jest.fn(),
    ...over,
  }
  return { ...render(<PrimaryTechniqueCard {...props} />), props }
}

describe('PrimaryTechniqueCard', () => {
  it('annonce la technique travaillée en séance', () => {
    const { getByText } = renderCard()
    expect(getByText('hub_in_session')).toBeTruthy()
    expect(getByText('coherence_cardiaque_name')).toBeTruthy()
  })

  it('affiche un bénéfice orienté patient, jamais une citation', () => {
    const { getByText, queryByText } = renderCard()
    expect(getByText('coherence_cardiaque_benefit')).toBeTruthy()
    expect(queryByText('coherence_cardiaque_evidence')).toBeNull()
  })

  it('affiche une puce de rythme par phase', () => {
    const { getByText } = renderCard()
    expect(getByText('hub_rhythm_inhale:5')).toBeTruthy()
    expect(getByText('hub_rhythm_exhale:5')).toBeTruthy()
  })

  it('porte la durée proposée sur le bouton de démarrage', () => {
    const { getByText } = renderCard({ durationMin: 10 })
    expect(getByText('hub_start_btn:10')).toBeTruthy()
  })

  it('remonte le démarrage et l’ouverture de « En savoir plus »', () => {
    const { getByTestId, props } = renderCard()
    fireEvent.press(getByTestId('breathing-start-btn'))
    expect(props.onStart).toHaveBeenCalled()
    fireEvent.press(getByTestId('breathing-info-btn'))
    expect(props.onInfo).toHaveBeenCalled()
  })

  it('remplace le sous-texte par un repli quand aucune session n’existe', () => {
    const { getByText } = renderCard({ lastSessionLabel: null })
    expect(getByText('hub_last_session_none')).toBeTruthy()
  })
})
