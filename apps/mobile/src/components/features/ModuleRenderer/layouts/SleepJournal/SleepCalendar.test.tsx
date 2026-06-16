import React from 'react'
import { render, screen } from '@testing-library/react-native'
import type { SleepEntry } from '../../../../../lib/database'
import { SleepCalendar } from './SleepCalendar'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

function makeEntry(date: string, nightmares: 0 | 1): SleepEntry {
  return {
    id: date, date, in_bed_time: null, bedtime: null, wake_time: null, out_of_bed_time: null,
    sleep_onset_minutes: 0, awakenings: 0, awakenings_duration_minutes: 0, quality: null,
    restedness: null, nap_minutes: 0, sleep_aid: 0, nightmares, notes: null, created_at: date,
  }
}

const NOW = new Date(2026, 5, 15) // 15 juin 2026

describe('SleepCalendar', () => {
  it('rend tous les jours du mois (1 → 30 pour juin)', () => {
    render(<SleepCalendar monthYear={2026} monthNum={6} monthEntryByDate={{}} now={NOW} />)
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('15')).toBeTruthy()
    expect(screen.getByText('30')).toBeTruthy()
    expect(screen.queryByText('31')).toBeNull() // juin a 30 jours
  })

  it('rend l’en-tête des 7 jours de semaine', () => {
    render(<SleepCalendar monthYear={2026} monthNum={6} monthEntryByDate={{}} now={NOW} />)
    expect(screen.getByText('L')).toBeTruthy()
    expect(screen.getByText('D')).toBeTruthy()
  })

  it('rend sans erreur avec des entrées (dont un cauchemar)', () => {
    const map: Record<string, SleepEntry> = {
      '2026-06-10': makeEntry('2026-06-10', 1),
      '2026-06-12': makeEntry('2026-06-12', 0),
    }
    render(<SleepCalendar monthYear={2026} monthNum={6} monthEntryByDate={map} now={NOW} />)
    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
  })
})
