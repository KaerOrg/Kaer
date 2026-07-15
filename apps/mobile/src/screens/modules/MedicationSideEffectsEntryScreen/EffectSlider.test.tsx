import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EffectSlider } from './EffectSlider'

const base = {
  effectKey: 'sedation', label: 'Somnolence', color: '#8B5CF6',
  lowHint: 'Aucune', highHint: 'Intense', onChange: jest.fn(),
}

describe('EffectSlider', () => {
  it('affiche le libellé, les ancres, et la valeur quand renseignée', () => {
    render(<EffectSlider {...base} value={4} />)
    expect(screen.getByText('Somnolence')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('Aucune')).toBeTruthy()
    expect(screen.getByText('Intense')).toBeTruthy()
  })

  it('value=null : aucune valeur affichée (effet non renseigné)', () => {
    render(<EffectSlider {...base} value={null} />)
    expect(screen.getByText('Somnolence')).toBeTruthy()
    expect(screen.queryByTestId('effect-sedation-value')).toBeNull()
  })

  it('propage la valeur avec la clé de l’effet', () => {
    const onChange = jest.fn()
    render(<EffectSlider {...base} value={null} onChange={onChange} />)
    fireEvent(screen.getByTestId('effect-sedation-track'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    })
    expect(onChange).toHaveBeenCalledWith('sedation', 0 + 1)
  })
})
