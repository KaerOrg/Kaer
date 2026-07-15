import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('../../../../../lib/dateUtils', () => ({ formatDateShort: (s: string) => `short:${s}` }))
jest.mock('../../../../../lib/database', () => ({
  computeSleepDuration: () => '7h30',
  // computeSleepEfficiency requis par sleepHelpers à l'import (non appelé ici).
  computeSleepEfficiency: () => 0,
}))

import { SleepNightRow } from './SleepNightRow'
import type { SleepEntry } from '../../../../../lib/database'

function makeEntry(overrides: Partial<SleepEntry>): SleepEntry {
  return {
    id: 'e1', date: '2026-03-02', in_bed_time: null, bedtime: null, wake_time: null,
    out_of_bed_time: null, sleep_onset_minutes: 0, awakenings: 0, awakenings_duration_minutes: 0,
    quality: null, restedness: null, nap_minutes: 0, sleep_aid: 0, nightmares: 0, notes: null,
    created_at: '2026-03-02T08:00:00Z', ...overrides,
  }
}

describe('SleepNightRow', () => {
  it('affiche la barre fenêtre de sommeil, les horaires et la durée pour une nuit renseignée', () => {
    const entry = makeEntry({ bedtime: '23:00', wake_time: '07:00', quality: 4 })
    render(
      <SleepNightRow
        date="2026-03-02" entry={entry} qualityMax={5}
        emptyLabel="Appuie pour remplir" incompleteLabel="Incomplet" onPress={jest.fn()}
      />,
    )
    expect(screen.getByTestId('day-2026-03-02')).toBeTruthy()
    expect(screen.getByText('23:00')).toBeTruthy()
    expect(screen.getByText('07:00')).toBeTruthy()
    expect(screen.getByText('7h30')).toBeTruthy()
  })

  it('affiche l\'invite discrète pour une nuit non saisie', () => {
    render(
      <SleepNightRow
        date="2026-03-03" entry={null} qualityMax={5}
        emptyLabel="Appuie pour remplir" incompleteLabel="Incomplet" onPress={jest.fn()}
      />,
    )
    expect(screen.getByText('Appuie pour remplir')).toBeTruthy()
  })

  it('affiche le libellé « incomplet » quand les horaires manquent', () => {
    render(
      <SleepNightRow
        date="2026-03-04" entry={makeEntry({ quality: 3 })} qualityMax={5}
        emptyLabel="Appuie pour remplir" incompleteLabel="Incomplet" onPress={jest.fn()}
      />,
    )
    expect(screen.getByText('Incomplet')).toBeTruthy()
  })

  it('remonte la date au tap', () => {
    const onPress = jest.fn()
    render(
      <SleepNightRow
        date="2026-03-02" entry={null} qualityMax={5}
        emptyLabel="Appuie pour remplir" incompleteLabel="Incomplet" onPress={onPress}
      />,
    )
    fireEvent.press(screen.getByTestId('day-2026-03-02'))
    expect(onPress).toHaveBeenCalledWith('2026-03-02')
  })
})
