import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import type { WeekPracticeDay } from '@kaer/shared'
import { WeekCard } from './WeekCard'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const lbl = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

const WEEK: WeekPracticeDay[] = [
  { iso: '2026-08-03', practiced: true, isToday: false },
  { iso: '2026-08-04', practiced: false, isToday: false },
  { iso: '2026-08-05', practiced: true, isToday: true },
  { iso: '2026-08-06', practiced: false, isToday: false },
  { iso: '2026-08-07', practiced: false, isToday: false },
  { iso: '2026-08-08', practiced: false, isToday: false },
  { iso: '2026-08-09', practiced: false, isToday: false },
]

function renderCard(over: Partial<React.ComponentProps<typeof WeekCard>> = {}) {
  const props = {
    days: WEEK,
    dayLabels: ['L', 'M', 'Me', 'J', 'V', 'S', 'D'],
    streak: 3,
    done: 3,
    goal: 5,
    color: '#4A9EA3',
    lbl,
    onAdjustGoal: jest.fn(),
    reminder: { summary: 'Rappel : tous les jours à 21:00', actionLabel: 'Modifier', onPress: jest.fn() },
    ...over,
  }
  return { ...render(<WeekCard {...props} />), props }
}

describe('WeekCard', () => {
  it('affiche la série et l’avancement en comptes bruts', () => {
    const { getByText } = renderCard()
    expect(getByText('hub_streak:3')).toBeTruthy()
    expect(getByText('hub_week_progress:3,5')).toBeTruthy()
  })

  it('dérive le résumé accessible du nombre de jours pratiqués', () => {
    const { getByTestId } = renderCard()
    expect(getByTestId('breathing-week-dots').props.accessibilityLabel).toBe('hub_week_days_a11y:2')
  })

  it('remplit la barre au prorata de l’objectif', () => {
    const { getByTestId } = renderCard()
    const bar = getByTestId('breathing-week-progress')
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3 })
  })

  it('remonte l’ouverture de la feuille d’objectif', () => {
    const { getByTestId, props } = renderCard()
    fireEvent.press(getByTestId('breathing-adjust-goal'))
    expect(props.onAdjustGoal).toHaveBeenCalled()
  })

  it('affiche la ligne de rappel telle que le parent la fournit', () => {
    const { getByText, getByTestId, props } = renderCard()
    expect(getByText('Rappel : tous les jours à 21:00')).toBeTruthy()
    fireEvent.press(getByTestId('breathing-reminder-action'))
    expect(props.reminder.onPress).toHaveBeenCalled()
  })

  it('garde la même couleur de barre quel que soit l’avancement (MDR)', () => {
    const low = renderCard({ done: 0 }).getByTestId('breathing-week-progress-fill').props.style
    const high = renderCard({ done: 5 }).getByTestId('breathing-week-progress-fill').props.style
    const color = (style: unknown[]) => Object.assign({}, ...(style as object[]).flat()).backgroundColor
    expect(color(low)).toBe(color(high))
  })
})
