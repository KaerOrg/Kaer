import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { NextAppointmentCard } from './NextAppointmentCard'

const BASE = {
  name: 'Dr Claire Lemoine',
  role: 'Psychiatre référente',
  statusLabel: 'Confirmé',
  statusVariant: 'info' as const,
  dateLabel: 'mer. 16 juil.',
  timeLabel: '14:30',
}

describe('NextAppointmentCard', () => {
  it('affiche le nom, le rôle, le statut, la date et l’heure', () => {
    const { getByText } = render(<NextAppointmentCard {...BASE} />)
    expect(getByText('Dr Claire Lemoine')).toBeTruthy()
    expect(getByText('Psychiatre référente')).toBeTruthy()
    expect(getByText('Confirmé')).toBeTruthy()
    expect(getByText('mer. 16 juil.')).toBeTruthy()
    expect(getByText('14:30')).toBeTruthy()
  })

  it('affiche les initiales du praticien dans l’avatar', () => {
    const { getByText } = render(<NextAppointmentCard {...BASE} />)
    expect(getByText('CL')).toBeTruthy()
  })

  it('omet le rôle quand il est absent', () => {
    const { queryByText } = render(<NextAppointmentCard {...BASE} role={null} />)
    expect(queryByText('Psychiatre référente')).toBeNull()
  })

  it('déclenche onPress au tap', () => {
    const onPress = jest.fn()
    const { getByLabelText } = render(
      <NextAppointmentCard {...BASE} onPress={onPress} accessibilityLabel="Prochain rendez-vous" />,
    )
    fireEvent.press(getByLabelText('Prochain rendez-vous'))
    expect(onPress).toHaveBeenCalled()
  })
})
