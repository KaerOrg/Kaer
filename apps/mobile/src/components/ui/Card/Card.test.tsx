import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { Card } from './Card'

describe('Card', () => {
  it('affiche le titre du header', () => {
    render(<Card header={{ title: 'Titre' }} />)
    expect(screen.getByText('Titre')).toBeTruthy()
  })

  it('affiche le sous-titre si fourni', () => {
    render(<Card header={{ title: 'T', subtitle: 'Sous-titre' }} />)
    expect(screen.getByText('Sous-titre')).toBeTruthy()
  })

  it('affiche les children', () => {
    render(<Card><Text>Contenu</Text></Card>)
    expect(screen.getByText('Contenu')).toBeTruthy()
  })

  it("n'affiche pas le header si absent", () => {
    render(<Card><Text>body</Text></Card>)
    expect(screen.queryByText('Titre')).toBeNull()
  })

  it("n'affiche pas les actions si absentes", () => {
    render(<Card><Text>body</Text></Card>)
    expect(screen.queryByText('Action')).toBeNull()
  })
})
