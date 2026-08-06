import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TechniqueInfoSheet } from './TechniqueInfoSheet'
import type { BreathingTechnique } from '@services/breathingService'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const TECHNIQUE: BreathingTechnique = {
  key: 'coherence_cardiaque',
  color: '#4A9EA3',
  recommended_duration_min: 5,
  phases: [{ type: 'inhale', seconds: 5 }, { type: 'exhale', seconds: 5 }],
}

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

function renderSheet(over: Partial<React.ComponentProps<typeof TechniqueInfoSheet>> = {}) {
  const props = {
    visible: true, technique: TECHNIQUE, onClose: jest.fn(), lbl, closeLabel: 'Fermer', ...over,
  }
  return { ...render(<TechniqueInfoSheet {...props} />), props }
}

describe('TechniqueInfoSheet', () => {
  it('présente la technique en langage patient', () => {
    const { getByText } = renderSheet()
    expect(getByText('coherence_cardiaque_name')).toBeTruthy()
    expect(getByText('coherence_cardiaque_benefit')).toBeTruthy()
    expect(getByText('coherence_cardiaque_description')).toBeTruthy()
  })

  it('garde les références repliées à l’ouverture', () => {
    const { queryByTestId } = renderSheet()
    expect(queryByTestId('breathing-info-sources')).toBeNull()
  })

  it('déplie les références à la demande', () => {
    const { getByTestId } = renderSheet()
    fireEvent.press(getByTestId('breathing-info-sources-toggle'))
    expect(getByTestId('breathing-info-sources').props.children).toBe('coherence_cardiaque_evidence')
  })

  it('replie les références à la réouverture', () => {
    const base = { technique: TECHNIQUE, onClose: jest.fn(), lbl, closeLabel: 'Fermer' }
    const { getByTestId, queryByTestId, rerender } = render(<TechniqueInfoSheet {...base} visible />)
    fireEvent.press(getByTestId('breathing-info-sources-toggle'))
    expect(queryByTestId('breathing-info-sources')).toBeTruthy()

    rerender(<TechniqueInfoSheet {...base} visible={false} />)
    rerender(<TechniqueInfoSheet {...base} visible />)
    expect(queryByTestId('breathing-info-sources')).toBeNull()
  })

  it('rappelle le rythme phase par phase', () => {
    const { getByText } = renderSheet()
    expect(getByText('hub_rhythm_inhale:5')).toBeTruthy()
  })
})
