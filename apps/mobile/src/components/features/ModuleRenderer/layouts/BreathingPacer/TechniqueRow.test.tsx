import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TechniqueRow } from './TechniqueRow'
import type { BreathingTechnique } from '@services/breathingService'

const TECHNIQUE: BreathingTechnique = {
  key: 'diaphragmatique',
  color: '#5FAE9B',
  recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 4 }, { type: 'exhale', seconds: 7 }],
}

const lbl = (key: string) => key

describe('TechniqueRow', () => {
  it('affiche le nom, le bénéfice et le rythme compact', () => {
    const { getByText } = render(<TechniqueRow technique={TECHNIQUE} lbl={lbl} onOpen={jest.fn()} />)
    expect(getByText('diaphragmatique_name')).toBeTruthy()
    expect(getByText('diaphragmatique_benefit')).toBeTruthy()
    expect(getByText('4s · 7s')).toBeTruthy()
  })

  it('remonte la clé de la technique au tap sur la ligne entière', () => {
    const onOpen = jest.fn()
    const { getByTestId } = render(<TechniqueRow technique={TECHNIQUE} lbl={lbl} onOpen={onOpen} />)
    fireEvent.press(getByTestId('breathing-technique-diaphragmatique'))
    expect(onOpen).toHaveBeenCalledWith('diaphragmatique')
  })

  it('n’affiche aucune preuve scientifique', () => {
    const { queryByText } = render(<TechniqueRow technique={TECHNIQUE} lbl={lbl} onOpen={jest.fn()} />)
    expect(queryByText('diaphragmatique_evidence')).toBeNull()
  })
})
