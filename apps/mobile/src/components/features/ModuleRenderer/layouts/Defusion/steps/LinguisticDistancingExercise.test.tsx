import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { LinguisticDistancingExercise } from './LinguisticDistancingExercise'

const PALIERS = ['Je ne vais pas y arriver', 'J\'ai la pensée que je ne vais pas y arriver', 'Je remarque que j\'ai la pensée que je ne vais pas y arriver']

function renderExercise(onDone = jest.fn()) {
  render(
    <LinguisticDistancingExercise
      paliers={PALIERS}
      accent="#F59E0B"
      instruction="Lisez chaque reformulation"
      nextLabel="Palier suivant"
      finishLabel="Terminer"
      onDone={onDone}
    />,
  )
  return onDone
}

describe('LinguisticDistancingExercise', () => {
  it('n\'affiche que le premier palier au départ', () => {
    renderExercise()
    expect(screen.getByText(PALIERS[0])).toBeTruthy()
    expect(screen.queryByText(PALIERS[1])).toBeNull()
    expect(screen.getByText('Palier suivant')).toBeTruthy()
  })

  it('empile les paliers au fil de l\'avancement', () => {
    renderExercise()
    fireEvent.press(screen.getByText('Palier suivant'))
    expect(screen.getByText(PALIERS[0])).toBeTruthy()
    expect(screen.getByText(PALIERS[1])).toBeTruthy()
    expect(screen.queryByText(PALIERS[2])).toBeNull()
  })

  it('au dernier palier, propose « Terminer » et appelle onDone(0)', () => {
    const onDone = renderExercise()
    fireEvent.press(screen.getByText('Palier suivant'))
    fireEvent.press(screen.getByText('Palier suivant'))
    expect(screen.getByText(PALIERS[2])).toBeTruthy()
    fireEvent.press(screen.getByText('Terminer'))
    expect(onDone).toHaveBeenCalledWith(0)
  })
})
