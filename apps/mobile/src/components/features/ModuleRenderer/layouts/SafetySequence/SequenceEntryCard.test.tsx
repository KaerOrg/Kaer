import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SequenceEntryCard } from './SequenceEntryCard'
import type { SequenceState } from '@kaer/shared'

const CLOSING: SequenceState = { kind: 'closing' }

describe('SequenceEntryCard', () => {
  it('rend son libellé et sa ligne de précision', () => {
    render(<SequenceEntryCard target={CLOSING} label="Suivre mon plan" hint="Une à la fois" onPress={jest.fn()} />)
    expect(screen.getByText('Suivre mon plan')).toBeTruthy()
    expect(screen.getByText('Une à la fois')).toBeTruthy()
  })

  it('se rend sans ligne de précision, sans laisser de trou', () => {
    render(<SequenceEntryCard target={CLOSING} label="Suivre mon plan" onPress={jest.fn()} testID="entry" />)
    expect(screen.getByTestId('entry')).toBeTruthy()
    expect(screen.getByText('Suivre mon plan')).toBeTruthy()
  })

  // La destination voyage avec la carte : c'est ce qui permet au parent de n'exposer
  // qu'un seul callback stable pour toutes ses entrées.
  it('rappelle le parent avec sa propre destination', () => {
    const onPress = jest.fn()
    render(<SequenceEntryCard target={CLOSING} label="Ce qui me donne envie de tenir" onPress={onPress} testID="entry" />)
    fireEvent.press(screen.getByTestId('entry'))
    expect(onPress).toHaveBeenCalledWith(CLOSING)
  })

  it('porte son libellé en accessibilité, la carte entière étant la cible', () => {
    render(<SequenceEntryCard target={CLOSING} label="Me mettre à l'abri" onPress={jest.fn()} testID="entry" />)
    expect(screen.getByTestId('entry').props.accessibilityLabel).toBe('Me mettre à l\'abri')
  })
})
