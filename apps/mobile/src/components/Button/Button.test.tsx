import React from 'react'
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
})
