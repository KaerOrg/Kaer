import React from 'react'
import { Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { Sheet } from './Sheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}))

describe('Sheet', () => {
  it('rend le titre, le sous-titre et le contenu quand elle est ouverte', () => {
    const { getByText } = render(
      <Sheet visible onClose={jest.fn()} closeLabel="Fermer" title="Mon objectif" subtitle="Proposé en séance">
        <Text>Contenu</Text>
      </Sheet>,
    )
    expect(getByText('Mon objectif')).toBeTruthy()
    expect(getByText('Proposé en séance')).toBeTruthy()
    expect(getByText('Contenu')).toBeTruthy()
  })

  it('ferme au tap sur le voile', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(
      <Sheet visible onClose={onClose} closeLabel="Fermer" testID="sh">
        <Text>Contenu</Text>
      </Sheet>,
    )
    const backdrop = getByTestId('sh-backdrop')
    expect(backdrop.props.accessibilityLabel).toBe('Fermer')
    fireEvent.press(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('n’affiche pas de bloc d’en-tête sans titre ni sous-titre', () => {
    const { queryByText } = render(
      <Sheet visible onClose={jest.fn()} closeLabel="Fermer">
        <Text>Contenu</Text>
      </Sheet>,
    )
    expect(queryByText('Mon objectif')).toBeNull()
  })

  it('rend le contenu masqué tant que la feuille est fermée', () => {
    const { queryByText } = render(
      <Sheet visible={false} onClose={jest.fn()} closeLabel="Fermer">
        <Text>Contenu</Text>
      </Sheet>,
    )
    expect(queryByText('Contenu')).toBeNull()
  })
})
