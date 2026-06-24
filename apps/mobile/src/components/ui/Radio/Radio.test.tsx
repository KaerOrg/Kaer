import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Radio } from './Radio'
import type { RadioOption } from './Radio.types'

const OPTIONS: RadioOption[] = [
  { value: 'maintenance', label: 'Traitement de fond', sublabel: 'Pris en continu' },
  { value: 'prn', label: 'Si besoin' },
]

describe('Radio', () => {
  it('variant list : rend une rangée par option avec label et sous-label', () => {
    render(<Radio options={OPTIONS} value="maintenance" onChange={() => {}} />)
    expect(screen.getByText('Traitement de fond')).toBeTruthy()
    expect(screen.getByText('Pris en continu')).toBeTruthy()
    expect(screen.getByText('Si besoin')).toBeTruthy()
  })

  it('variant list : appelle onChange avec la valeur de l\'option pressée', () => {
    const onChange = jest.fn()
    render(<Radio options={OPTIONS} value="maintenance" onChange={onChange} />)
    fireEvent.press(screen.getByText('Si besoin'))
    expect(onChange).toHaveBeenCalledWith('prn')
  })

  it('expose l\'état sélectionné via accessibilityState', () => {
    render(<Radio options={OPTIONS} value="prn" onChange={() => {}} />)
    const selected = screen.getByRole('radio', { selected: true })
    expect(selected).toBeTruthy()
  })

  it('variant pills : rend une pilule par option et remonte le clic', () => {
    const onChange = jest.fn()
    render(<Radio options={OPTIONS} value="maintenance" onChange={onChange} variant="pills" />)
    expect(screen.getByText('Traitement de fond')).toBeTruthy()
    fireEvent.press(screen.getByText('Si besoin'))
    expect(onChange).toHaveBeenCalledWith('prn')
  })

  it('variant grid : rend une option par valeur et remonte le clic', () => {
    const onChange = jest.fn()
    render(<Radio options={OPTIONS} value="maintenance" onChange={onChange} variant="grid" />)
    expect(screen.getByText('Traitement de fond')).toBeTruthy()
    fireEvent.press(screen.getByText('Si besoin'))
    expect(onChange).toHaveBeenCalledWith('prn')
  })

  it('variant grid : expose l\'état sélectionné via accessibilityState', () => {
    render(<Radio options={OPTIONS} value="prn" onChange={() => {}} variant="grid" />)
    expect(screen.getByRole('radio', { selected: true })).toBeTruthy()
  })

  it('variant grid + readonly : labels rendus, aucune option n\'a le rôle radio', () => {
    const onChange = jest.fn()
    render(<Radio options={OPTIONS} value="maintenance" variant="grid" readonly onChange={onChange} />)
    expect(screen.getByText('Traitement de fond')).toBeTruthy()
    expect(screen.queryByRole('radio')).toBeNull()
    fireEvent.press(screen.getByText('Si besoin'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('value null : aucune option sélectionnée, aucun crash', () => {
    render(<Radio options={OPTIONS} value={null} onChange={() => {}} />)
    expect(screen.queryByRole('radio', { selected: true })).toBeNull()
  })

  it('readonly : rend les labels mais aucune option n\'a le rôle radio', () => {
    render(<Radio options={OPTIONS} value="maintenance" variant="pills" readonly />)
    expect(screen.getByText('Traitement de fond')).toBeTruthy()
    expect(screen.getByText('Si besoin')).toBeTruthy()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('readonly : un appui sur une option n\'appelle pas onChange', () => {
    const onChange = jest.fn()
    render(<Radio options={OPTIONS} value="maintenance" variant="pills" readonly onChange={onChange} />)
    fireEvent.press(screen.getByText('Si besoin'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
