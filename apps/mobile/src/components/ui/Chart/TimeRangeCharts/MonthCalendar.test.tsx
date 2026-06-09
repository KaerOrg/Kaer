import React from 'react'
import { render, screen } from '@testing-library/react-native'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

jest.mock('../../../../theme', () => ({
  colors: { card: '#fff', border: '#ccc', text: '#111', textMuted: '#999' },
  spacing: { sm: 8 },
  radius: { full: 999 },
}))

import { MonthCalendar } from './MonthCalendar'
import type { ScaleEntry } from '../../../../lib/database'

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)

const makeEntry = (date: string, scores: Record<string, number>): ScaleEntry => ({
  id: date,
  scale_id: 'mood_tracker',
  answers: [],
  total_score: 0,
  subscale_scores: scores,
  created_at: `${date}T10:00:00`,
})

describe('MonthCalendar', () => {
  it('affiche la légende et le libellé des jours saisis', () => {
    render(
      <MonthCalendar
        entries={[makeEntry(iso(today), { mood: 7, energy: 6 })]}
        dimensionKeys={['mood', 'energy']}
        accentColor="#F97316"
        locale="fr-FR"
        daysLabel="jours saisis"
        legendLabel="Saisie effectuée"
      />
    )
    expect(screen.getByText('Saisie effectuée')).toBeTruthy()
    expect(screen.getByText(/jours saisis/)).toBeTruthy()
  })

  it('compte 1 jour saisi pour une entrée du mois courant', () => {
    render(
      <MonthCalendar
        entries={[makeEntry(iso(today), { mood: 8 })]}
        dimensionKeys={['mood']}
        accentColor="#F97316"
        locale="fr-FR"
        daysLabel="j."
        legendLabel="legend"
      />
    )
    // Badge "1 / <jours du mois> j."
    expect(screen.getByText(/^1 \/ \d+ j\.$/)).toBeTruthy()
  })

  it('rend sans erreur sans aucune entrée', () => {
    const { toJSON } = render(
      <MonthCalendar entries={[]} dimensionKeys={['mood']} accentColor="#F97316"
        locale="fr-FR" daysLabel="j." legendLabel="legend" />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('mode dayMarkers : compte les jours marqués indépendamment des scores', () => {
    const markers = new Map([[iso(today), { color: '#10B981', label: 'Pris' }]])
    render(
      <MonthCalendar
        dayMarkers={markers}
        accentColor="#8B5CF6"
        locale="fr-FR"
        daysLabel="j."
        legendLabel="legend"
      />
    )
    expect(screen.getByText(/^1 \/ \d+ j\.$/)).toBeTruthy()
  })
})
