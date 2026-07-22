import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'

const mockFetch = jest.fn().mockResolvedValue([])
const mockSave = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/customChipService', () => ({
  fetchCustomChips: (...a: unknown[]) => mockFetch(...a),
  saveCustomChip: (...a: unknown[]) => mockSave(...a),
}))
jest.mock('../../../../../lib/database', () => ({ generateId: () => 'chip-id' }))

import { ColumnChipsField } from './ColumnChipsField'

const options = [
  { code: 'home', label: 'Maison' },
  { code: 'work', label: 'Travail' },
]

function renderField(over: Partial<React.ComponentProps<typeof ColumnChipsField>> = {}) {
  const onChange = jest.fn()
  render(
    <ColumnChipsField
      fieldKey="locations" moduleId="craving_journal" groupKey="location"
      label="OÙ ?" options={options} allowCustom accent="#2C97A9"
      value={[]} addLabel="+ Autre…" onChange={onChange} {...over}
    />,
  )
  return onChange
}

beforeEach(() => jest.clearAllMocks())

describe('ColumnChipsField — multi-sélection', () => {
  it('ajoute un code au tap', () => {
    const onChange = renderField()
    fireEvent.press(screen.getByTestId('chip-locations-home'))
    expect(onChange).toHaveBeenCalledWith(['home'])
  })

  it('retire un code déjà sélectionné', () => {
    const onChange = renderField({ value: ['home'] })
    fireEvent.press(screen.getByTestId('chip-locations-home'))
    expect(onChange).toHaveBeenCalledWith([])
  })
})

describe('ColumnChipsField — chips personnelles', () => {
  it('charge et affiche les chips personnelles du groupe en tête', async () => {
    mockFetch.mockResolvedValueOnce([{ id: 'c1', module_id: 'craving_journal', group_key: 'location', label: 'apéro', created_at: '' }])
    renderField()
    await waitFor(() => expect(screen.getByText('apéro')).toBeTruthy())
    expect(mockFetch).toHaveBeenCalledWith('craving_journal', 'location')
  })

  it('« + Autre… » crée une chip personnelle persistée et la sélectionne', async () => {
    const onChange = renderField()
    fireEvent.press(screen.getByTestId('chip-add-locations'))
    const input = screen.getByTestId('chip-input-locations')
    fireEvent.changeText(input, 'bar')
    fireEvent(input, 'submitEditing')
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ module_id: 'craving_journal', group_key: 'location', label: 'bar' }),
    ))
    expect(onChange).toHaveBeenCalledWith(['custom:bar'])
  })
})
