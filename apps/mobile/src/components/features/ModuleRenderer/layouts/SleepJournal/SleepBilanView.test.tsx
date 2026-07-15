import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
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

import { SleepBilanView } from './SleepBilanView'

const lbl = (key: string) => key
const t = (key: string) => key

function renderBilan(onBack = jest.fn(), onEvolutionRangeChange = jest.fn()) {
  render(
    <SleepBilanView
      lbl={lbl} t={t} locale="fr"
      monthYear={2026} monthNum={3} monthEntries={[]} now={new Date('2026-03-15T12:00:00')}
      evolutionEntries={[]} evolutionRange="1M" onEvolutionRangeChange={onEvolutionRangeChange}
      onPrevMonth={jest.fn()} onNextMonth={jest.fn()} onBack={onBack}
    />,
  )
}

describe('SleepBilanView', () => {
  it('affiche l\'onglet Mois par défaut', () => {
    renderBilan()
    expect(screen.getByTestId('sleep-journal-bilan')).toBeTruthy()
    expect(screen.getByTestId('sleep-journal-month')).toBeTruthy()
    expect(screen.queryByTestId('sleep-evolution')).toBeNull()
  })

  it('bascule sur l\'onglet Évolution', () => {
    renderBilan()
    fireEvent.press(screen.getByText('bilan_tab_evolution'))
    expect(screen.getByTestId('sleep-evolution')).toBeTruthy()
    expect(screen.queryByTestId('sleep-journal-month')).toBeNull()
  })

  it('remonte le retour à la liste', () => {
    const onBack = jest.fn()
    renderBilan(onBack)
    fireEvent.press(screen.getByTestId('bilan-back-button'))
    expect(onBack).toHaveBeenCalled()
  })
})
