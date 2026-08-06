import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { DayChip } from './DayChip'

describe('DayChip', () => {
  it('remonte le jour au format getDay() (dimanche = 0)', () => {
    const onToggle = jest.fn()
    const { getByTestId } = render(<DayChip jsDay={0} label="D" selected={false} onToggle={onToggle} />)
    fireEvent.press(getByTestId('breathing-reminder-day-0'))
    expect(onToggle).toHaveBeenCalledWith(0)
  })

  it('reflète la sélection dans l’état accessible', () => {
    const { getByTestId } = render(<DayChip jsDay={3} label="Me" selected onToggle={jest.fn()} />)
    expect(getByTestId('breathing-reminder-day-3').props.accessibilityState.selected).toBe(true)
  })

  it('affiche l’initiale du jour', () => {
    const { getByText } = render(<DayChip jsDay={1} label="L" selected={false} onToggle={jest.fn()} />)
    expect(getByText('L')).toBeTruthy()
  })
})
