import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Chip } from './Chip'
import { colors } from '@theme'

describe('Chip', () => {
  it('affiche le label', () => {
    render(<Chip label="jj/mm/aaaa" />)
    expect(screen.getByText('jj/mm/aaaa')).toBeTruthy()
  })

  it('rend le nœud icône fourni', () => {
    render(<Chip label="22:00" icon={<Text>⏱</Text>} />)
    expect(screen.getByText('⏱')).toBeTruthy()
  })

  it('sans onPress : rendu statique, aucun crash au press', () => {
    render(<Chip label="Aperçu" testID="chip" />)
    fireEvent.press(screen.getByTestId('chip'))
    expect(screen.getByText('Aperçu')).toBeTruthy()
  })

  it('avec onPress : bouton accessible déclenché au press', () => {
    const onPress = jest.fn()
    render(<Chip label="Filtre" onPress={onPress} testID="chip" />)
    fireEvent.press(screen.getByTestId('chip'))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('non sélectionné : label en couleur atténuée', () => {
    render(<Chip label="Off" />)
    expect(screen.getByText('Off').props.style).toContainEqual({ fontSize: 13, color: colors.textMuted })
  })

  it('sélectionné : label coloré par color et état accessibilité sélectionné', () => {
    const onPress = jest.fn()
    render(<Chip label="On" selected color="#FF0000" onPress={onPress} />)
    expect(screen.getByText('On').props.style).toContainEqual({ fontSize: 13, color: '#FF0000' })
    expect(screen.getByRole('button', { selected: true })).toBeTruthy()
  })
})
