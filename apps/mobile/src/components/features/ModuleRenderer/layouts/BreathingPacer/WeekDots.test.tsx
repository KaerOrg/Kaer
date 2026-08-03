import React from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { render } from '@testing-library/react-native'
import type { WeekPracticeDay } from '@kaer/shared'
import { WeekDots } from './WeekDots'

const LABELS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']

const week = (practicedIso: string[], todayIso: string): WeekPracticeDay[] =>
  ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09']
    .map(iso => ({ iso, practiced: practicedIso.includes(iso), isToday: iso === todayIso }))

function dotStyle(testID: string, days: WeekPracticeDay[]): ViewStyle {
  const { getByTestId } = render(
    <WeekDots days={days} dayLabels={LABELS} color="#4A9EA3" accessibilityLabel="2 jours pratiqués" />,
  )
  return StyleSheet.flatten<ViewStyle>(getByTestId(testID).props.style)
}

describe('WeekDots', () => {
  it('remplit les jours pratiqués avec la couleur de la technique', () => {
    const style = dotStyle('breathing-week-dot-2026-08-03', week(['2026-08-03'], '2026-08-05'))
    expect(style.backgroundColor).toBe('#4A9EA3')
  })

  it('laisse les jours sans session non remplis', () => {
    const style = dotStyle('breathing-week-dot-2026-08-04', week(['2026-08-03'], '2026-08-05'))
    expect(style.backgroundColor).toBeUndefined()
  })

  it('marque aujourd’hui d’une bordure pointillée', () => {
    const style = dotStyle('breathing-week-dot-2026-08-05', week([], '2026-08-05'))
    expect(style.borderStyle).toBe('dashed')
  })

  it('affiche les sept initiales dans l’ordre lundi → dimanche', () => {
    const { getByText } = render(
      <WeekDots days={week([], '2026-08-05')} dayLabels={LABELS} color="#4A9EA3" accessibilityLabel="rien" />,
    )
    for (const label of LABELS) expect(getByText(label)).toBeTruthy()
  })

  it('se lit comme un seul élément accessible, avec son résumé', () => {
    const { getByTestId } = render(
      <WeekDots days={week([], '2026-08-05')} dayLabels={LABELS} color="#4A9EA3" accessibilityLabel="2 jours pratiqués cette semaine" />,
    )
    const row = getByTestId('breathing-week-dots')
    expect(row.props.accessible).toBe(true)
    expect(row.props.accessibilityLabel).toBe('2 jours pratiqués cette semaine')
  })
})
