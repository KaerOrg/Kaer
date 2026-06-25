import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TechniqueCard } from './TechniqueCard'
import type { BreathingTechnique } from '../../../services/breathingService'

jest.mock('../../../services/breathingService', () => ({
  getCycleDuration: (t: { phases: { seconds: number }[] }) => t.phases.reduce((a, p) => a + p.seconds, 0),
}))

const TECHNIQUE: BreathingTechnique = {
  key: 'coherence_cardiaque',
  color: '#4F46E5',
  recommended_duration_min: 5,
  phases: [
    { type: 'inhale', seconds: 5 },
    { type: 'exhale', seconds: 5 },
  ],
}

describe('TechniqueCard', () => {
  it('affiche le nom, le sous-titre et la durée du cycle', () => {
    render(<TechniqueCard technique={TECHNIQUE} sessionCount={0} onOpen={jest.fn()} />)
    expect(screen.getByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.getByText('6 respirations par minute')).toBeTruthy()
    expect(screen.getByText('10s / cycle')).toBeTruthy()
  })

  it('appelle onOpen avec la clé de la technique au tap', () => {
    const onOpen = jest.fn()
    render(<TechniqueCard technique={TECHNIQUE} sessionCount={0} onOpen={onOpen} />)
    fireEvent.press(screen.getByLabelText('Cohérence cardiaque'))
    expect(onOpen).toHaveBeenCalledWith('coherence_cardiaque')
  })

  it('affiche le badge de sessions quand sessionCount > 0', () => {
    render(<TechniqueCard technique={TECHNIQUE} sessionCount={3} onOpen={jest.fn()} />)
    expect(screen.getByText('3 sessions')).toBeTruthy()
  })

  it('masque le badge de sessions quand sessionCount vaut 0', () => {
    render(<TechniqueCard technique={TECHNIQUE} sessionCount={0} onOpen={jest.fn()} />)
    expect(screen.queryByText(/session/i)).toBeNull()
  })
})
