import React from 'react'
import { render } from '@testing-library/react-native'
import { SessionProgress } from './SessionProgress'

describe('SessionProgress', () => {
  it('affiche le temps restant en m:ss', () => {
    const { getByTestId } = render(
      <SessionProgress elapsedSeconds={106} plannedSeconds={300} accessibilityLabel="Progression" />,
    )
    expect(getByTestId('session-remaining').props.children).toBe('3:14')
  })

  it('remplit la jauge au prorata de la durée choisie', () => {
    const { getByTestId } = render(
      <SessionProgress elapsedSeconds={150} plannedSeconds={300} accessibilityLabel="Progression" />,
    )
    expect(getByTestId('session-progress').props.accessibilityValue).toEqual({ min: 0, max: 300, now: 150 })
  })

  it('n’affiche jamais de temps négatif en fin de session', () => {
    const { getByTestId } = render(
      <SessionProgress elapsedSeconds={310} plannedSeconds={300} accessibilityLabel="Progression" />,
    )
    expect(getByTestId('session-remaining').props.children).toBe('0:00')
  })
})
