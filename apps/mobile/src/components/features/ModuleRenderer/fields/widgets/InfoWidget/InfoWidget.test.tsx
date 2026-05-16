import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { InfoWidget } from './InfoWidget'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))

describe('InfoWidget', () => {
  it('affiche le texte quand fourni', () => {
    render(<InfoWidget text="Une note importante" />)
    expect(screen.getByText('Une note importante')).toBeTruthy()
  })

  it("n'affiche pas de texte quand absent", () => {
    render(<InfoWidget />)
    expect(screen.queryByText(/.+/)).toBeNull()
  })
})
