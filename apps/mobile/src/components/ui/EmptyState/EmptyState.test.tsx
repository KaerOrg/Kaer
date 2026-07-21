import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('affiche le titre', () => {
    render(<EmptyState title="Rien ici" />)
    expect(screen.getByText('Rien ici')).toBeTruthy()
  })

  it('affiche la description si fournie', () => {
    render(<EmptyState title="T" description="Description" />)
    expect(screen.getByText('Description')).toBeTruthy()
  })

  it("n'affiche pas la description si absente", () => {
    render(<EmptyState title="T" />)
    expect(screen.queryByText('Description')).toBeNull()
  })

  it("affiche l'icône si fournie", () => {
    render(<EmptyState title="T" icon="📭" />)
    expect(screen.getByText('📭')).toBeTruthy()
  })

  it('déclenche le callback action au clic', () => {
    const onPress = jest.fn()
    render(<EmptyState title="T" action={{ label: 'Créer', onPress }} />)
    fireEvent.press(screen.getByText('Créer'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("n'affiche pas le bouton si action absente", () => {
    render(<EmptyState title="T" />)
    expect(screen.queryByText('Créer')).toBeNull()
  })

  it('rend un nœud d\'illustration personnalisé à la place d\'un emoji', () => {
    render(<EmptyState title="T" icon={<Text>illustration-node</Text>} />)
    expect(screen.getByText('illustration-node')).toBeTruthy()
  })

  it('affiche la ligne d\'aide (footer) si fournie', () => {
    render(<EmptyState title="T" footer="Petit conseil" />)
    expect(screen.getByText('Petit conseil')).toBeTruthy()
  })

  it('expose le testID du conteneur et de l\'action', () => {
    const onPress = jest.fn()
    render(
      <EmptyState
        testID="es-root"
        title="T"
        action={{ label: 'Créer', onPress, variant: 'primary', testID: 'es-cta' }}
      />,
    )
    expect(screen.getByTestId('es-root')).toBeTruthy()
    fireEvent.press(screen.getByTestId('es-cta'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
