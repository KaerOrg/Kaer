import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SymptomRibbon } from './SymptomRibbon'
import { buildRibbonGrid } from './ribbonGrid'
import type { ScaleEntry } from '../../../lib/database'

const DIMS = [
  { key: 'mood', label: 'Humeur', color: '#9C89D6' },
  { key: 'energy', label: 'Énergie', color: '#E3B45E' },
]

function entry(day: number, subs: Record<string, number>): ScaleEntry {
  return {
    id: `e-${day}`, scale_id: 'mood_tracker', answers: [], total_score: 0,
    subscale_scores: subs, created_at: new Date(2026, 6, day, 12).toISOString(),
  }
}

describe('SymptomRibbon', () => {
  it('rend le titre, l’assiduité et une ligne par dimension', () => {
    const grid = buildRibbonGrid([entry(3, { mood: 7, energy: 5 })], ['mood', 'energy'], 2026, 6)
    render(
      <SymptomRibbon
        dimensions={DIMS}
        grid={grid}
        yMax={10}
        title="Vue par symptôme · 31 j."
        assiduityLabel="1/31 saisis"
        legendLabel="Colonne vide = jour non renseigné"
        testID="ribbon"
      />
    )
    expect(screen.getByText('Vue par symptôme · 31 j.')).toBeTruthy()
    expect(screen.getByText('1/31 saisis')).toBeTruthy()
    expect(screen.getByText('Humeur')).toBeTruthy()
    expect(screen.getByText('Énergie')).toBeTruthy()
    expect(screen.getByText('Colonne vide = jour non renseigné')).toBeTruthy()
  })
})
