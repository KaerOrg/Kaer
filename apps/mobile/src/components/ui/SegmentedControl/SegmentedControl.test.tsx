import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react-native'

jest.mock('@theme', () => ({
  colors: { neutral: '#EEE', card: '#FFF', border: '#CCC', textMuted: '#999', white: '#FFF', primary: '#PRIMARY' },
  spacing: { xs: 4, sm: 8 },
  radius: { sm: 6 },
}))

import { SegmentedControl } from './SegmentedControl'
import type { SegmentOption } from './SegmentedControl.types'

const RANGES: SegmentOption<'7J' | '1M' | '3M'>[] = [
  { value: '7J', label: '7J' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
]

describe('SegmentedControl', () => {
  it('rend une option par valeur', () => {
    render(<SegmentedControl options={RANGES} value="1M" onChange={jest.fn()} />)
    expect(screen.getByText('7J')).toBeTruthy()
    expect(screen.getByText('1M')).toBeTruthy()
    expect(screen.getByText('3M')).toBeTruthy()
  })

  it('émet onChange avec la valeur sélectionnée', () => {
    const onChange = jest.fn()
    render(<SegmentedControl options={RANGES} value="1M" onChange={onChange} />)
    fireEvent.press(screen.getByText('3M'))
    expect(onChange).toHaveBeenCalledWith('3M')
  })

  it('marque exactement un segment actif via accessibilityState', () => {
    render(<SegmentedControl options={RANGES} value="1M" onChange={jest.fn()} />)
    const selected = screen.getAllByRole('button').filter(b => b.props.accessibilityState?.selected)
    expect(selected).toHaveLength(1)
    expect(within(selected[0]).getByText('1M')).toBeTruthy()
  })
})
