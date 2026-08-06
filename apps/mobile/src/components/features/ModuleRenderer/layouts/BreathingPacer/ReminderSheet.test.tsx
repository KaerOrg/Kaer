import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ReminderSheet, type ReminderDraft } from './ReminderSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const lbl = (key: string) => key
const DAY_LABELS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']
const EMPTY: ReminderDraft = { enabled: false, time: null, days: [] }

function renderSheet(over: Partial<React.ComponentProps<typeof ReminderSheet>> = {}) {
  const props = {
    visible: true,
    value: EMPTY,
    onClose: jest.fn(),
    onSave: jest.fn(),
    lbl,
    dayLabels: DAY_LABELS,
    closeLabel: 'Fermer',
    saveLabel: 'Enregistrer',
    confirmLabel: 'OK',
    ...over,
  }
  return { ...render(<ReminderSheet {...props} />), props }
}

describe('ReminderSheet', () => {
  it('s’ouvre sur le rappel enregistré', () => {
    const { getByTestId } = renderSheet({ value: { enabled: true, time: '21:00', days: [1, 3] } })
    expect(getByTestId('breathing-reminder-toggle-switch').props.value).toBe(true)
    expect(getByTestId('breathing-reminder-day-1').props.accessibilityState.selected).toBe(true)
    expect(getByTestId('breathing-reminder-day-2').props.accessibilityState.selected).toBe(false)
  })

  it('enregistre la bascule, l’heure et les jours choisis', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent(getByTestId('breathing-reminder-toggle-switch'), 'valueChange', true)
    fireEvent.press(getByTestId('breathing-reminder-day-1'))
    fireEvent.press(getByTestId('breathing-reminder-day-5'))
    fireEvent.press(getByTestId('breathing-reminder-save'))
    expect(props.onSave).toHaveBeenCalledWith({ enabled: true, time: null, days: [1, 5] })
  })

  it('décoche un jour déjà sélectionné', () => {
    const { getByTestId, props } = renderSheet({ value: { enabled: true, time: '21:00', days: [1, 3] } })
    fireEvent.press(getByTestId('breathing-reminder-day-3'))
    fireEvent.press(getByTestId('breathing-reminder-save'))
    expect(props.onSave).toHaveBeenCalledWith({ enabled: true, time: '21:00', days: [1] })
  })

  it('range dimanche (0) en tête de la liste stockée', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-reminder-day-6'))
    fireEvent.press(getByTestId('breathing-reminder-day-0'))
    fireEvent.press(getByTestId('breathing-reminder-save'))
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ days: [0, 6] }))
  })

  it('oublie un réglage abandonné à la réouverture', () => {
    const base = {
      value: EMPTY, onClose: jest.fn(), onSave: jest.fn(), lbl, dayLabels: DAY_LABELS,
      closeLabel: 'Fermer', saveLabel: 'Enregistrer', confirmLabel: 'OK',
    }
    const { getByTestId, rerender } = render(<ReminderSheet {...base} visible />)
    fireEvent.press(getByTestId('breathing-reminder-day-1'))
    expect(getByTestId('breathing-reminder-day-1').props.accessibilityState.selected).toBe(true)

    rerender(<ReminderSheet {...base} visible={false} />)
    rerender(<ReminderSheet {...base} visible />)
    expect(getByTestId('breathing-reminder-day-1').props.accessibilityState.selected).toBe(false)
  })

  it('ferme sans enregistrer au tap sur le voile', () => {
    const { getByTestId, props } = renderSheet()
    fireEvent.press(getByTestId('breathing-reminder-sheet-backdrop'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })
})
