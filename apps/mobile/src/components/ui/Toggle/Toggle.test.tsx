import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('affiche le label et le sous-titre', () => {
    const { getByText } = render(
      <Toggle value={false} onValueChange={jest.fn()} label="Vibrations" sublabel="Un repère à chaque phase" />,
    )
    expect(getByText('Vibrations')).toBeTruthy()
    expect(getByText('Un repère à chaque phase')).toBeTruthy()
  })

  it('remonte la nouvelle valeur au changement', () => {
    const onValueChange = jest.fn()
    const { getByTestId } = render(
      <Toggle value={false} onValueChange={onValueChange} label="Vibrations" testID="tg" />,
    )
    fireEvent(getByTestId('tg-switch'), 'valueChange', true)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('est statique (désactivé) sans onValueChange', () => {
    const { getByTestId } = render(<Toggle value label="Vibrations" testID="tg" />)
    expect(getByTestId('tg-switch').props.disabled).toBe(true)
  })

  it('reflète l’état dans l’accessibilité', () => {
    const { getByTestId } = render(
      <Toggle value onValueChange={jest.fn()} label="Vibrations" testID="tg" />,
    )
    const sw = getByTestId('tg-switch')
    expect(sw.props.accessibilityState).toEqual({ checked: true, disabled: false })
    expect(sw.props.accessibilityLabel).toBe('Vibrations')
  })
})
