import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { SessionControls } from './SessionControls'

function renderControls(over: Partial<React.ComponentProps<typeof SessionControls>> = {}) {
  const props = {
    running: true,
    muted: false,
    onToggleSound: jest.fn(),
    onTogglePause: jest.fn(),
    onStop: jest.fn(),
    soundLabel: 'Couper le son',
    pauseLabel: 'Mettre en pause',
    stopLabel: 'Arrêter la session',
    ...over,
  }
  return { ...render(<SessionControls {...props} />), props }
}

describe('SessionControls', () => {
  it('remonte la pause et l’arrêt', () => {
    const { getByTestId, props } = renderControls()
    fireEvent.press(getByTestId('session-pause'))
    expect(props.onTogglePause).toHaveBeenCalled()
    fireEvent.press(getByTestId('session-stop'))
    expect(props.onStop).toHaveBeenCalled()
  })

  it('masque le bouton son quand aucun accompagnement n’est disponible', () => {
    const { queryByTestId } = renderControls({ muted: null })
    expect(queryByTestId('session-sound')).toBeNull()
  })

  it('affiche le bouton son quand un accompagnement existe', () => {
    const { getByTestId, props } = renderControls({ muted: true })
    fireEvent.press(getByTestId('session-sound'))
    expect(props.onToggleSound).toHaveBeenCalled()
  })

  it('porte des libellés accessibles fournis par l’appelant', () => {
    const { getByTestId } = renderControls({ running: false, pauseLabel: 'Reprendre' })
    expect(getByTestId('session-pause').props.accessibilityLabel).toBe('Reprendre')
    expect(getByTestId('session-stop').props.accessibilityLabel).toBe('Arrêter la session')
  })
})
