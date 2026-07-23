import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { CrisisBanner } from './CrisisBanner'

describe('CrisisBanner', () => {
  it('affiche le titre et le sous-titre de crise (i18n)', () => {
    render(<CrisisBanner onPress={jest.fn()} />)
    expect(screen.getByText('Je suis en crise')).toBeTruthy()
    expect(screen.getByText('Aide immédiate, à toute heure')).toBeTruthy()
  })

  it('déclenche onPress au tap sur la carte', () => {
    const onPress = jest.fn()
    render(<CrisisBanner onPress={onPress} />)
    fireEvent.press(screen.getByLabelText('Je suis en crise'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
