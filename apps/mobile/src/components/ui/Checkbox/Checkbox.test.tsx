import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Checkbox } from './Checkbox'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('Checkbox', () => {
  it('décoché : icône case vide et état accessibilité non coché', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Accepter" />)
    expect(screen.UNSAFE_getByProps({ name: 'square-outline' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { checked: false })).toBeTruthy()
  })

  it('coché : icône case pleine et état accessibilité coché', () => {
    render(<Checkbox checked onChange={() => {}} label="Accepter" />)
    expect(screen.UNSAFE_getByProps({ name: 'checkbox' })).toBeTruthy()
    expect(screen.getByRole('checkbox', { checked: true })).toBeTruthy()
  })

  it('appelle onChange avec l\'état inversé au press', () => {
    const onChange = jest.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Accepter" />)
    fireEvent.press(screen.getByText('Accepter'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('coché : le press remonte false', () => {
    const onChange = jest.fn()
    render(<Checkbox checked onChange={onChange} label="Accepter" />)
    fireEvent.press(screen.getByText('Accepter'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('sans onChange : rendu statique, aucun crash au press', () => {
    render(<Checkbox checked={false} label="Aperçu" testID="cb" />)
    fireEvent.press(screen.getByTestId('cb'))
    expect(screen.getByText('Aperçu')).toBeTruthy()
    expect(screen.getByRole('checkbox', { checked: false })).toBeTruthy()
  })

  it('disabled : onChange jamais appelé au press', () => {
    const onChange = jest.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Accepter" disabled />)
    fireEvent.press(screen.getByText('Accepter'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
