import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PillSelector } from './PillSelector'

const OPTIONS = ['7J', '1M', '6M', '1A']
const LABELS: Record<string, string> = { '7J': '7 jours', '1M': '1 mois', '6M': '6 mois', '1A': '1 an' }

describe('PillSelector', () => {
  it('rend une pilule par option', () => {
    render(<PillSelector options={OPTIONS} value="1M" onChange={() => {}} labels={LABELS} />)
    OPTIONS.forEach(opt => expect(screen.getByText(LABELS[opt])).toBeTruthy())
  })

  it('appelle onChange avec l\'identifiant de l\'option cliquée', () => {
    const onChange = jest.fn()
    render(<PillSelector options={OPTIONS} value="1M" onChange={onChange} labels={LABELS} />)
    fireEvent.press(screen.getByText(LABELS['7J']))
    expect(onChange).toHaveBeenCalledWith('7J')
  })

  it('n\'appelle pas onChange si l\'option est déjà sélectionnée', () => {
    const onChange = jest.fn()
    render(<PillSelector options={OPTIONS} value="1M" onChange={onChange} labels={LABELS} />)
    fireEvent.press(screen.getByText(LABELS['1M']))
    expect(onChange).toHaveBeenCalledWith('1M')
  })

  it('fallback sur l\'identifiant si label manquant', () => {
    render(<PillSelector options={['7J']} value="7J" onChange={() => {}} labels={{}} />)
    expect(screen.getByText('7J')).toBeTruthy()
  })
})
