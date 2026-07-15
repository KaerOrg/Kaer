jest.mock('@ui/Chart/TimeRangeCharts', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    DimensionChart: ({ label }: { label: string }) => React.createElement(Text, { testID: 'dimension-chart' }, label),
    buildXLabels: () => [],
  }
})

import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TrackingTab } from './TrackingTab'
import type { ScaleEntry } from '../../../lib/database'

const dimensionKeys = ['mood', 'energy']
const entry: ScaleEntry = {
  id: 'e1', scale_id: 'mood_tracker', answers: [], total_score: 0,
  subscale_scores: { mood: 7, energy: 5 }, created_at: new Date(2026, 6, 3, 12).toISOString(),
}

const labels = {
  ribbonTitle: 'Vue par symptôme',
  assiduity: (d: number, t: number) => `${d}/${t} saisis`,
  ribbonLegend: 'Colonne vide = jour non renseigné',
  chartSection: 'Détail par dimension',
  emptyText: 'Aucune saisie',
  seasonTitle: 'Saisonnalité',
  seasonHint: 'Superpose 5 ans',
  seasonCompare: 'Comparer',
}

function renderTab(overrides: Partial<React.ComponentProps<typeof TrackingTab>> = {}) {
  render(
    <TrackingTab
      entries={[entry]}
      dimensionKeys={dimensionKeys}
      dimLabel={(k) => k}
      ribbonDimensions={[{ key: 'mood', label: 'Humeur', color: '#9C89D6' }, { key: 'energy', label: 'Énergie', color: '#E3B45E' }]}
      midColors={{ mood: '#9C89D6', energy: '#E3B45E' }}
      yMax={10}
      accentColor="#4FA5A9"
      locale="fr"
      timeRange="1M"
      rangeOptions={[{ value: '1M', label: '1 mois' }]}
      onRangeChange={jest.fn()}
      chartData={{ mood: [], energy: [] }}
      showSeasonality
      seasonDimension="mood"
      markersSlot={<Text>REPERES</Text>}
      labels={labels}
      {...overrides}
    />
  )
}

describe('TrackingTab', () => {
  it('compose ruban + saisonnalité + repères + courbes de détail', () => {
    renderTab()
    expect(screen.getByTestId('symptom-ribbon')).toBeTruthy()
    expect(screen.getByTestId('seasonality-strip')).toBeTruthy()
    expect(screen.getByText('REPERES')).toBeTruthy()
    expect(screen.getAllByTestId('dimension-chart').length).toBe(2)
  })

  it('masque la saisonnalité quand showSeasonality=false', () => {
    renderTab({ showSeasonality: false })
    expect(screen.queryByTestId('seasonality-strip')).toBeNull()
    expect(screen.getByTestId('symptom-ribbon')).toBeTruthy()
  })

  it('affiche l’état vide des courbes quand aucune saisie', () => {
    renderTab({ entries: [] })
    expect(screen.getByText('Aucune saisie')).toBeTruthy()
    expect(screen.queryByTestId('dimension-chart')).toBeNull()
  })

  it('le bouton mois précédent ne casse pas le rendu du ruban', () => {
    renderTab()
    // Le premier bouton de la barre de mois est « précédent ».
    const ribbonBefore = screen.getByTestId('symptom-ribbon')
    expect(ribbonBefore).toBeTruthy()
    fireEvent.press(screen.getAllByRole('button')[0])
    expect(screen.getByTestId('symptom-ribbon')).toBeTruthy()
  })
})
