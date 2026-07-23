import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { BrandHeader } from './BrandHeader'

describe('BrandHeader', () => {
  it('affiche le wordmark de marque', () => {
    render(<BrandHeader />)
    expect(screen.getByText('KAER')).toBeTruthy()
    expect(screen.getByText('k')).toBeTruthy()
  })

  it('n\'affiche pas de bouton d\'action sans rightAction', () => {
    render(<BrandHeader />)
    expect(screen.queryByLabelText('Réglages')).toBeNull()
  })

  it('affiche le bouton d\'action et déclenche onPress', () => {
    const onPress = jest.fn()
    render(
      <BrandHeader
        rightAction={{ icon: <Text>ic</Text>, onPress, accessibilityLabel: 'Mon profil' }}
      />,
    )
    const btn = screen.getByLabelText('Mon profil')
    expect(btn).toBeTruthy()
    fireEvent.press(btn)
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
