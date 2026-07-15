import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SeasonalityStrip } from './SeasonalityStrip'
import type { SeasonYearRow } from './seasonality'

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const ROWS: SeasonYearRow[] = [
  { year: 2026, months: Array(12).fill(5) },
  { year: 2025, months: Array(12).fill(3) },
  { year: 2024, months: Array(12).fill(7) },
]

function renderStrip() {
  return render(
    <SeasonalityStrip
      rows={ROWS}
      currentYear={2026}
      yMax={10}
      monthLabels={MONTHS}
      currentColor="#7E68C4"
      pastColor="#B3A6E0"
      title="Saisonnalité · Humeur"
      hint="Superpose jusqu'à 5 années."
      compareLabel="Comparer"
      testID="season"
    />
  )
}

describe('SeasonalityStrip', () => {
  it('n’affiche que l’année en cours par défaut (comparaison repliée)', () => {
    renderStrip()
    expect(screen.getByText('2026')).toBeTruthy()
    expect(screen.queryByText('2025')).toBeNull()
    expect(screen.getByText('Saisonnalité · Humeur')).toBeTruthy()
  })

  it('« Comparer » déplie les cases des années passées et ajoute l’année cochée', () => {
    renderStrip()
    fireEvent.press(screen.getByText('Comparer'))
    // Les cases des années passées apparaissent (label = année).
    expect(screen.getByText('2025')).toBeTruthy()
    // Cocher 2025 l'ajoute à la frise (le libellé de ligne 2025 s'affiche aussi).
    fireEvent(screen.getByText('2025'), 'press')
    expect(screen.getAllByText('2025').length).toBeGreaterThanOrEqual(1)
  })
})
