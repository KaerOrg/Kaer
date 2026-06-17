import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { RadioWidget } from './RadioWidget'

describe('RadioWidget', () => {
  it('affiche le label "Pris" pour la variante ok', () => {
    render(<RadioWidget variant="ok" />)
    expect(screen.getByText('Pris')).toBeTruthy()
  })

  it('affiche le label "Partiel" pour la variante partial', () => {
    render(<RadioWidget variant="partial" />)
    expect(screen.getByText('Partiel')).toBeTruthy()
  })

  it('affiche "Non pris" pour la variante miss', () => {
    render(<RadioWidget variant="miss" />)
    expect(screen.getByText('Non pris')).toBeTruthy()
  })

  it('replie sur ok pour une variante inconnue', () => {
    render(<RadioWidget variant="unknown" />)
    expect(screen.getByText('Pris')).toBeTruthy()
  })
})
