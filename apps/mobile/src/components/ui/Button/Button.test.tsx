import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('affiche le label', () => {
    render(<Button label="Envoyer" onPress={() => {}} />)
    expect(screen.getByText('Envoyer')).toBeTruthy()
  })

  it('déclenche onPress au clic', () => {
    const onPress = jest.fn()
    render(<Button label="Clic" onPress={onPress} />)
    fireEvent.press(screen.getByText('Clic'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ne déclenche pas onPress quand disabled', () => {
    const onPress = jest.fn()
    render(<Button label="Clic" onPress={onPress} disabled />)
    fireEvent.press(screen.getByText('Clic'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('affiche un ActivityIndicator quand loading', () => {
    render(<Button label="Clic" onPress={() => {}} loading />)
    expect(screen.queryByText('Clic')).toBeNull()
  })

  it('ne déclenche pas onPress quand loading', () => {
    const onPress = jest.fn()
    render(<Button label="Clic" onPress={onPress} loading />)
    fireEvent.press(screen.getByTestId('activity-indicator') ?? screen.root)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('size="sm" : label en taille compacte (14)', () => {
    render(<Button label="Compact" onPress={() => {}} size="sm" testID="btn" />)
    const styleArray = screen.getByText('Compact').props.style.flat()
    expect(styleArray).toContainEqual({ fontSize: 14 })
  })

  it('size par défaut (md) : label en taille standard (16)', () => {
    render(<Button label="Standard" onPress={() => {}} />)
    const styleArray = screen.getByText('Standard').props.style.flat()
    expect(styleArray).toContainEqual({ fontSize: 16 })
  })

  it('affiche le sublabel sous le label (bouton à deux lignes)', () => {
    render(<Button label="15, SAMU" sublabel="Urgence médicale" onPress={() => {}} />)
    expect(screen.getByText('15, SAMU')).toBeTruthy()
    expect(screen.getByText('Urgence médicale')).toBeTruthy()
  })

  it('affiche iconLeft et iconRight autour du label', () => {
    render(
      <Button
        label="Continuer"
        onPress={() => {}}
        iconLeft={<Text>L</Text>}
        iconRight={<Text>R</Text>}
      />,
    )
    expect(screen.getByText('L')).toBeTruthy()
    expect(screen.getByText('Continuer')).toBeTruthy()
    expect(screen.getByText('R')).toBeTruthy()
  })

  it('en mode icône seule (sans label), iconRight n\'est pas rendu', () => {
    render(<Button onPress={() => {}} accessibilityLabel="fermer" iconLeft={<Text>X</Text>} iconRight={<Text>R</Text>} />)
    expect(screen.getByText('X')).toBeTruthy()
    expect(screen.queryByText('R')).toBeNull()
  })
})
