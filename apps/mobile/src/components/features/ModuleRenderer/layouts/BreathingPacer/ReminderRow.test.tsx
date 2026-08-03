import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ReminderRow } from './ReminderRow'

describe('ReminderRow', () => {
  it('affiche le résumé et l’action', () => {
    const { getByText } = render(
      <ReminderRow summary="Rappel : tous les jours à 21:00" actionLabel="Modifier" onPress={jest.fn()} />,
    )
    expect(getByText('Rappel : tous les jours à 21:00')).toBeTruthy()
    expect(getByText('Modifier')).toBeTruthy()
  })

  it('propose la création quand le parent le demande (opt-in)', () => {
    const { getByText } = render(
      <ReminderRow summary="Aucun rappel" actionLabel="Créer un rappel" onPress={jest.fn()} />,
    )
    expect(getByText('Créer un rappel')).toBeTruthy()
  })

  it('remonte l’appui sur l’action', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <ReminderRow summary="Aucun rappel" actionLabel="Créer un rappel" onPress={onPress} />,
    )
    fireEvent.press(getByTestId('breathing-reminder-action'))
    expect(onPress).toHaveBeenCalled()
  })
})
