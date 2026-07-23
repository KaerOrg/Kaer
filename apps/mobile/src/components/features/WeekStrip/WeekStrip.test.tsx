import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { WeekStrip, type WeekDay } from './WeekStrip'

const DAYS: WeekDay[] = [
  { iso: '2026-07-14', weekday: 'LUN', dayNumber: '14', selected: false, hasEvent: false },
  { iso: '2026-07-16', weekday: 'MER', dayNumber: '16', selected: true, hasEvent: false },
  { iso: '2026-07-18', weekday: 'VEN', dayNumber: '18', selected: false, hasEvent: true },
]

describe('WeekStrip', () => {
  it('rend une cellule par jour', () => {
    const { getByText } = render(<WeekStrip days={DAYS} onSelectDay={jest.fn()} />)
    expect(getByText('LUN')).toBeTruthy()
    expect(getByText('MER')).toBeTruthy()
    expect(getByText('VEN')).toBeTruthy()
  })

  it('remonte la date ISO au tap sur un jour', () => {
    const onSelectDay = jest.fn()
    const { getByLabelText } = render(<WeekStrip days={DAYS} onSelectDay={onSelectDay} />)
    fireEvent.press(getByLabelText('VEN 18'))
    expect(onSelectDay).toHaveBeenCalledWith('2026-07-18')
  })

  it('expose l’état sélectionné en accessibilité', () => {
    const { getByLabelText } = render(<WeekStrip days={DAYS} onSelectDay={jest.fn()} />)
    expect(getByLabelText('MER 16').props.accessibilityState).toEqual({ selected: true })
  })
})
