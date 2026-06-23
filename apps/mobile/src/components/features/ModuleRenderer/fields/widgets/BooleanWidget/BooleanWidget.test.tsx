import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { BooleanWidget } from './BooleanWidget'

describe('BooleanWidget', () => {
  it('affiche les deux options Oui et Non', () => {
    render(<BooleanWidget />)
    expect(screen.getByText('Non')).toBeTruthy()
    expect(screen.getByText('Oui')).toBeTruthy()
  })

  it('aperçu non interactif : aucune option avec le rôle radio', () => {
    render(<BooleanWidget />)
    expect(screen.queryByRole('radio')).toBeNull()
  })
})
