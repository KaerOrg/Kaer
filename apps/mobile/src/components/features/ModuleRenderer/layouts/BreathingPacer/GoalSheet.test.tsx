import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GoalSheet } from './GoalSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const lbl = (key: string) => key

function renderSheet(over: Partial<React.ComponentProps<typeof GoalSheet>> = {}) {
  const props = {
    visible: true,
    value: 5,
    onClose: jest.fn(),
    onSave: jest.fn(),
    lbl,
    closeLabel: 'Fermer',
    saveLabel: 'Enregistrer',
    ...over,
  }
  return { ...render(<GoalSheet {...props} />), props }
}

describe('GoalSheet', () => {
  it('s’ouvre sur l’objectif enregistré', () => {
    const { getByTestId } = renderSheet({ value: 7 })
    expect(getByTestId('breathing-goal-stepper-value').props.children).toBe(7)
  })

  it('enregistre l’objectif ajusté', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-goal-stepper-plus'))
    fireEvent.press(getByTestId('breathing-goal-save'))
    expect(props.onSave).toHaveBeenCalledWith(6)
  })

  it('borne l’objectif à 14 sessions (contrainte de la base)', () => {
    const { getByTestId, props } = renderSheet({ value: 14 })
    fireEvent.press(getByTestId('breathing-goal-stepper-plus'))
    fireEvent.press(getByTestId('breathing-goal-save'))
    expect(props.onSave).toHaveBeenCalledWith(14)
  })

  it('borne l’objectif à 1 session', () => {
    const { getByTestId, props } = renderSheet({ value: 1 })
    fireEvent.press(getByTestId('breathing-goal-stepper-minus'))
    fireEvent.press(getByTestId('breathing-goal-save'))
    expect(props.onSave).toHaveBeenCalledWith(1)
  })

  it('oublie une modification abandonnée à la réouverture', () => {
    const { getByTestId, rerender } = renderSheet({ value: 5 })
    fireEvent.press(getByTestId('breathing-goal-stepper-plus'))
    expect(getByTestId('breathing-goal-stepper-value').props.children).toBe(6)

    const props = { visible: false, value: 5, onClose: jest.fn(), onSave: jest.fn(), lbl, closeLabel: 'Fermer', saveLabel: 'Enregistrer' }
    rerender(<GoalSheet {...props} />)
    rerender(<GoalSheet {...props} visible />)
    expect(getByTestId('breathing-goal-stepper-value').props.children).toBe(5)
  })

  it('ferme sans enregistrer au tap sur le voile', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-goal-sheet-backdrop'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })
})
