import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { LikertWidget, type LikertOption } from './LikertWidget'

const OPTIONS: LikertOption[] = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Parfois' },
  { value: 2, label: 'Souvent' },
  { value: 3, label: 'Toujours' },
]

describe('LikertWidget', () => {
  it('rend un label par option', () => {
    render(<LikertWidget options={OPTIONS} selected={null} onSelect={() => {}} />)
    OPTIONS.forEach(o => expect(screen.getByText(o.label)).toBeTruthy())
  })

  it('appelle onSelect avec la valeur numérique de l\'option pressée', () => {
    const onSelect = jest.fn()
    render(<LikertWidget options={OPTIONS} selected={null} onSelect={onSelect} />)
    fireEvent.press(screen.getByText('Souvent'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('reflète l\'option sélectionnée via accessibilityState', () => {
    render(<LikertWidget options={OPTIONS} selected={1} onSelect={() => {}} />)
    expect(screen.getByRole('radio', { selected: true })).toBeTruthy()
  })

  it('selected null : aucune option sélectionnée, aucun crash', () => {
    render(<LikertWidget options={OPTIONS} selected={null} onSelect={() => {}} />)
    expect(screen.queryByRole('radio', { selected: true })).toBeNull()
  })
})
