import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TimePicker } from './TimePicker'

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

describe('TimePicker', () => {
  it('affiche la valeur HH:MM quand elle est posée', () => {
    render(<TimePicker value="22:45" onChange={jest.fn()} confirmLabel="OK" testID="t" />)
    expect(screen.getByText('22:45')).toBeTruthy()
    expect(screen.getByTestId('t-button')).toBeTruthy()
  })

  it('affiche le placeholder quand la valeur est vide', () => {
    render(<TimePicker value="" onChange={jest.fn()} placeholder="Définir l’heure" confirmLabel="OK" testID="t" />)
    expect(screen.getByText('Définir l’heure')).toBeTruthy()
  })

  it('n’affiche pas la croix d’effacement sans clearable', () => {
    render(<TimePicker value="07:00" onChange={jest.fn()} confirmLabel="OK" testID="t" />)
    expect(screen.queryByTestId('t-clear')).toBeNull()
  })

  it('affiche et déclenche l’effacement quand clearable + valeur posée', () => {
    const onChange = jest.fn()
    render(<TimePicker value="07:00" onChange={onChange} clearable confirmLabel="OK" testID="t" />)
    fireEvent.press(screen.getByTestId('t-clear'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('masque la croix quand clearable mais aucune valeur', () => {
    render(<TimePicker value="" onChange={jest.fn()} clearable confirmLabel="OK" testID="t" />)
    expect(screen.queryByTestId('t-clear')).toBeNull()
  })
})
