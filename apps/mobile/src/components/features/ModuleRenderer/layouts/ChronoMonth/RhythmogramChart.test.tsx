jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').pop() ?? key }),
}))

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import type { RhythmEntry } from '@kaer/shared'
import { RhythmogramChart } from './RhythmogramChart'
import { DEFAULT_ANCHORS } from './chronoMonthUtils'

const ENTRIES: RhythmEntry[] = [
  { date: '2026-06-02', values: { wake_time: '07:00', bedtime: '23:00' } },
  { date: '2026-06-09', values: { wake_time: '07:30', bedtime: '23:30' } },
  { date: '2026-05-30', values: { wake_time: '06:00' } }, // autre mois → ignoré
]

describe('RhythmogramChart', () => {
  it('rend le rythmogramme et la légende des repères saisis du mois', () => {
    render(<RhythmogramChart entries={ENTRIES} year={2026} month={6} anchors={DEFAULT_ANCHORS} />)
    expect(screen.getByTestId('chrono-rhythmogram')).toBeTruthy()
    // Repères renseignés en juin → libellés présents dans la légende.
    expect(screen.getByText('anchor_wake')).toBeTruthy()
    expect(screen.getByText('anchor_bedtime')).toBeTruthy()
    // Repère jamais saisi → absent de la légende.
    expect(screen.queryByText('anchor_first_meal')).toBeNull()
  })

  it('rend sans repère saisi (mois vide) sans planter', () => {
    render(<RhythmogramChart entries={[]} year={2026} month={6} anchors={DEFAULT_ANCHORS} />)
    expect(screen.getByTestId('chrono-rhythmogram')).toBeTruthy()
    expect(screen.queryByText('anchor_wake')).toBeNull()
  })
})
