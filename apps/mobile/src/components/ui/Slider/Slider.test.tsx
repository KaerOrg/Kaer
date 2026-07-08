import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Slider } from './Slider'

describe('Slider', () => {
  it('affiche le label et la valeur formatée avec l’unité', () => {
    render(<Slider label="Intensité" value={40} min={0} max={100} unit="%" color="#8B5CF6" onChange={jest.fn()} testID="s" />)
    expect(screen.getByText('Intensité')).toBeTruthy()
    expect(screen.getByTestId('s-value')).toBeTruthy()
    expect(screen.getByText('40 %')).toBeTruthy()
  })

  it('value=null : aucune valeur affichée, aucun thumb (pas d’ancrage MDR)', () => {
    render(<Slider label="Intensité" value={null} min={0} max={100} color="#000" onChange={jest.fn()} testID="s" />)
    // Le libellé reste, mais aucune valeur n'est rendue tant que rien n'est saisi.
    expect(screen.getByText('Intensité')).toBeTruthy()
    expect(screen.queryByTestId('s-value')).toBeNull()
  })

  it('affiche les bornes min/max quand showEndLabels', () => {
    render(<Slider value={30} min={0} max={100} color="#000" showEndLabels onChange={jest.fn()} />)
    expect(screen.getByText('0')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
  })

  it('action d’accessibilité « increment » décale la valeur d’un pas', () => {
    const onChange = jest.fn()
    render(<Slider label="X" value={40} min={0} max={100} step={10} color="#000" onChange={onChange} testID="s" />)
    fireEvent(screen.getByTestId('s-track'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } })
    expect(onChange).toHaveBeenCalledWith(50)
  })

  it('action « decrement » depuis une valeur nulle part de min', () => {
    const onChange = jest.fn()
    render(<Slider label="X" value={null} min={0} max={100} step={10} color="#000" onChange={onChange} testID="s" />)
    fireEvent(screen.getByTestId('s-track'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } })
    expect(onChange).toHaveBeenCalledWith(10)
  })
})
