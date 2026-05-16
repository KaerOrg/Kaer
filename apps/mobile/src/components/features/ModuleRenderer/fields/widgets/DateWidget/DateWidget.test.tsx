import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { DateWidget } from './DateWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('DateWidget', () => {
  it('affiche le placeholder de date', () => {
    render(<DateWidget />)
    expect(screen.getByText('jj/mm/aaaa')).toBeTruthy()
  })

  it("affiche l'icône calendrier", () => {
    const { UNSAFE_getByProps } = render(<DateWidget />)
    expect(UNSAFE_getByProps({ name: 'calendar-outline' })).toBeTruthy()
  })
})
