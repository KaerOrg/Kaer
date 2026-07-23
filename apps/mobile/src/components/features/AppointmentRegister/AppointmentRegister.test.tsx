import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AppointmentRegister, type AppointmentRegisterItem } from './AppointmentRegister'

const ITEMS: AppointmentRegisterItem[] = [
  { id: 'a', weekday: 'VEN', dayNumber: '18', title: 'Dr Claire Lemoine', detail: '10:00 · Confirmé', tappable: true },
  { id: 'b', weekday: 'LUN', dayNumber: '21', title: 'Dr Claire Lemoine', detail: '09:15 · En attente', tappable: false },
]

describe('AppointmentRegister', () => {
  it('rend une ligne par rendez-vous', () => {
    const { getByText, getAllByText } = render(<AppointmentRegister items={ITEMS} onSelect={jest.fn()} />)
    expect(getByText('VEN')).toBeTruthy()
    expect(getByText('18')).toBeTruthy()
    expect(getByText('21')).toBeTruthy()
    expect(getAllByText('Dr Claire Lemoine')).toHaveLength(2)
  })

  it('remonte l’id au tap sur une ligne tappable', () => {
    const onSelect = jest.fn()
    const { getByLabelText } = render(<AppointmentRegister items={ITEMS} onSelect={onSelect} />)
    fireEvent.press(getByLabelText('Dr Claire Lemoine, VEN 18'))
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('ne déclenche pas onSelect sur une ligne non tappable', () => {
    const onSelect = jest.fn()
    const { getByLabelText } = render(<AppointmentRegister items={ITEMS} onSelect={onSelect} />)
    fireEvent.press(getByLabelText('Dr Claire Lemoine, LUN 21'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
