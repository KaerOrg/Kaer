import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const stub = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  return {
    __esModule: true, default: stub, Svg: stub, Polyline: stub, Circle: stub, Line: stub,
    Text: ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children),
  }
})
jest.mock('../../../../../lib/database', () => ({ computeSleepEfficiency: () => 90 }))

import { SleepEvolutionView } from './SleepEvolutionView'
import { todayIso } from './sleepHelpers'
import type { SleepEntry } from '../../../../../lib/database'

// lbl renvoie la clé elle-même → assertions lisibles sur les libellés.
const lbl = (key: string) => key

function makeEntry(date: string): SleepEntry {
  return {
    id: date, date, in_bed_time: '22:45', bedtime: '23:00', wake_time: '07:00',
    out_of_bed_time: '07:15', sleep_onset_minutes: 0, awakenings: 0, awakenings_duration_minutes: 0,
    quality: 4, restedness: 3, nap_minutes: 0, sleep_aid: 0, nightmares: 0, notes: null,
    created_at: `${date}T08:00:00Z`,
  }
}

describe('SleepEvolutionView', () => {
  it('rend les deux sélecteurs, les deux graphiques et la note MDR', () => {
    render(
      <SleepEvolutionView
        entries={[makeEntry(todayIso())]} range="1M" onRangeChange={jest.fn()} lbl={lbl} locale="fr"
      />,
    )
    expect(screen.getByTestId('sleep-evolution')).toBeTruthy()
    expect(screen.getByTestId('evolution-range')).toBeTruthy()
    expect(screen.getByTestId('evolution-metric')).toBeTruthy()
    expect(screen.getByText('evolution_nightly_title')).toBeTruthy()
    expect(screen.getByText('evolution_weekly_title')).toBeTruthy()
    expect(screen.getByText('evolution_mdr_note')).toBeTruthy()
  })

  it('remonte le changement de plage', () => {
    const onRangeChange = jest.fn()
    render(
      <SleepEvolutionView
        entries={[]} range="1M" onRangeChange={onRangeChange} lbl={lbl} locale="fr"
      />,
    )
    fireEvent.press(screen.getByText('evolution_range_3m'))
    expect(onRangeChange).toHaveBeenCalledWith('3M')
  })

  it('bascule la métrique Durée → Efficacité sans planter', () => {
    render(
      <SleepEvolutionView
        entries={[makeEntry(todayIso())]} range="1M" onRangeChange={jest.fn()} lbl={lbl} locale="fr"
      />,
    )
    fireEvent.press(screen.getByText('evolution_metric_efficiency'))
    expect(screen.getByTestId('sleep-evolution')).toBeTruthy()
  })
})
