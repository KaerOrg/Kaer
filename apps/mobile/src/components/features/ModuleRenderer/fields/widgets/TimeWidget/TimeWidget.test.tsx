import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TimeWidget } from './TimeWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('TimeWidget', () => {
  it('affiche la valeur par défaut 22:00', () => {
    render(<TimeWidget />)
    expect(screen.getByText('22:00')).toBeTruthy()
  })

  it('affiche l\'icône time-outline', () => {
    const { UNSAFE_getByProps } = render(<TimeWidget />)
    expect(UNSAFE_getByProps({ name: 'time-outline' })).toBeTruthy()
  })
})
