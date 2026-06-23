import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ActivityIndicator } from 'react-native'

jest.mock('@theme', () => ({ colors: { primary: '#PRIMARY' } }))

import { ScreenLoader } from './ScreenLoader'

describe('ScreenLoader', () => {
  it('rend un ActivityIndicator avec la couleur primaire par défaut', () => {
    render(<ScreenLoader testID="loader" />)
    expect(screen.getByTestId('loader')).toBeTruthy()
    expect(screen.UNSAFE_getByType(ActivityIndicator).props.color).toBe('#PRIMARY')
  })

  it('applique la couleur fournie', () => {
    render(<ScreenLoader color="#ACCENT" />)
    expect(screen.UNSAFE_getByType(ActivityIndicator).props.color).toBe('#ACCENT')
  })
})
