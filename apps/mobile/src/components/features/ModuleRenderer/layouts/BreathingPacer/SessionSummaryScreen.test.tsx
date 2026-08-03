import React from 'react'
import { StyleSheet, type TextStyle } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { SessionSummaryScreen } from './SessionSummaryScreen'
import type { SessionResult } from './BreathingSessionScreen'

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native')
  return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }), SafeAreaView: View }
})

const RESULT: SessionResult = {
  techniqueKey: 'coherence_cardiaque',
  startedAt: '2026-08-05T10:00:00.000Z',
  durationSeconds: 300,
  plannedDurationSeconds: 300,
  cyclesCompleted: 30,
  completed: true,
}

const lbl = (key: string) => key

function renderSummary(over: Partial<React.ComponentProps<typeof SessionSummaryScreen>> = {}) {
  const props = {
    result: RESULT,
    techniqueName: 'Cohérence cardiaque',
    streak: 4,
    lbl,
    onClose: jest.fn(),
    ...over,
  }
  return { ...render(<SessionSummaryScreen {...props} />), props }
}

describe('SessionSummaryScreen', () => {
  it('annonce la fin de session et la technique pratiquée', () => {
    const { getByText } = renderSummary()
    expect(getByText('summary_title')).toBeTruthy()
    expect(getByText('Cohérence cardiaque')).toBeTruthy()
  })

  it('affiche les trois comptes bruts', () => {
    const { getByText } = renderSummary()
    expect(getByText('5:00')).toBeTruthy()   // durée réelle
    expect(getByText('30')).toBeTruthy()     // cycles
    expect(getByText('4')).toBeTruthy()      // jours de suite
  })

  it('affiche la durée réellement pratiquée, pas celle qui était prévue', () => {
    const { getByText, queryByText } = renderSummary({
      result: { ...RESULT, durationSeconds: 92, plannedDurationSeconds: 300 },
    })
    expect(getByText('1:32')).toBeTruthy()
    expect(queryByText('5:00')).toBeNull()
  })

  it('n’a aucun ressenti présélectionné', () => {
    const { getByTestId, props } = renderSummary()
    fireEvent.press(getByTestId('breathing-summary-save'))
    expect(props.onClose).toHaveBeenCalledWith(null)
  })

  it('remonte le ressenti choisi', () => {
    const { getByText, getByTestId, props } = renderSummary()
    fireEvent.press(getByText('feeling_calmer'))
    fireEvent.press(getByTestId('breathing-summary-save'))
    expect(props.onClose).toHaveBeenCalledWith('calmer')
  })

  it('propose les trois ressentis, et rien d’autre', () => {
    const { getByText } = renderSummary()
    expect(getByText('feeling_calmer')).toBeTruthy()
    expect(getByText('feeling_same')).toBeTruthy()
    expect(getByText('feeling_tenser')).toBeTruthy()
  })

  it('« Passer » clôt sans ressenti', () => {
    const { getByTestId, props } = renderSummary()
    fireEvent.press(getByTestId('breathing-summary-skip'))
    expect(props.onClose).toHaveBeenCalledWith(null)
  })

  it('« Passer » clôt même après un ressenti choisi (aucun refus n’est noté)', () => {
    const { getByText, getByTestId, props } = renderSummary()
    fireEvent.press(getByText('feeling_tenser'))
    fireEvent.press(getByTestId('breathing-summary-skip'))
    expect(props.onClose).toHaveBeenCalledWith(null)
  })

  it('affiche l’encart de régularité, texte fixe et non dérivé des données', () => {
    const short = renderSummary({ result: { ...RESULT, durationSeconds: 20, completed: false } })
    expect(short.getByText('summary_regularity')).toBeTruthy()
    short.unmount()
    const long = renderSummary()
    expect(long.getByText('summary_regularity')).toBeTruthy()
  })

  it('n’affiche ni score, ni moyenne, ni texte d’évaluation (MDR)', () => {
    const { queryByText } = renderSummary()
    expect(queryByText(/score|moyenne|efficac|meilleure|progress(ion|e)/i)).toBeNull()
  })

  it('habille les trois ressentis à l’identique (aucune valence de couleur, MDR)', () => {
    const { getByText } = renderSummary()
    const styleOf = (label: string) =>
      JSON.stringify(StyleSheet.flatten<TextStyle>(getByText(label).props.style))
    expect(styleOf('feeling_same')).toBe(styleOf('feeling_calmer'))
    expect(styleOf('feeling_tenser')).toBe(styleOf('feeling_calmer'))
  })
})
