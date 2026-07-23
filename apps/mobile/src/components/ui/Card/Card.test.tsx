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

  it('rend une bande d\'accent gauche colorée quand leftAccentColor est fourni', () => {
    render(<Card leftAccentColor="#EF4444"><Text>body</Text></Card>)
    const stripe = screen.getByTestId('card-left-accent')
    const style = Object.assign({}, ...(stripe.props.style as unknown[]))
    expect(style.backgroundColor).toBe('#EF4444')
  })

  it("n'affiche aucune bande d'accent gauche par défaut", () => {
    render(<Card><Text>body</Text></Card>)
    expect(screen.queryByTestId('card-left-accent')).toBeNull()
  })
})
