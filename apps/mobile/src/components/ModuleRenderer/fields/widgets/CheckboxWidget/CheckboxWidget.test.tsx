import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { CheckboxWidget } from './CheckboxWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('CheckboxWidget', () => {
  it('affiche le label "Non accompli"', () => {
    render(<CheckboxWidget />)
    expect(screen.getByText('Non accompli')).toBeTruthy()
  })

  it("affiche l'icône case vide", () => {
    const { UNSAFE_getByProps } = render(<CheckboxWidget />)
    expect(UNSAFE_getByProps({ name: 'square-outline' })).toBeTruthy()
  })
})
