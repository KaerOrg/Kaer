import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Stepper } from './Stepper'

const LABELS = { decrementLabel: 'Diminuer', incrementLabel: 'Augmenter' }

describe('Stepper', () => {
  it('affiche la valeur et son unité', () => {
    const { getByText, getByTestId } = render(
      <Stepper value={5} min={1} max={14} onChange={jest.fn()} unit="sessions par semaine" testID="st" {...LABELS} />,
    )
    expect(getByTestId('st-value').props.children).toBe(5)
    expect(getByText('sessions par semaine')).toBeTruthy()
  })

  it('incrémente et décrémente du pas demandé', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <Stepper value={5} min={1} max={14} step={2} onChange={onChange} testID="st" {...LABELS} />,
    )
    fireEvent.press(getByTestId('st-plus'))
    expect(onChange).toHaveBeenCalledWith(7)
    fireEvent.press(getByTestId('st-minus'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('désactive « moins » à la borne basse et n’émet rien', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <Stepper value={1} min={1} max={14} onChange={onChange} testID="st" {...LABELS} />,
    )
    const minus = getByTestId('st-minus')
    expect(minus.props.accessibilityState).toEqual({ disabled: true })
    fireEvent.press(minus)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('désactive « plus » à la borne haute et n’émet rien', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <Stepper value={14} min={1} max={14} onChange={onChange} testID="st" {...LABELS} />,
    )
    fireEvent.press(getByTestId('st-plus'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('borne la valeur émise quand le pas dépasserait la borne', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <Stepper value={13} min={1} max={14} step={5} onChange={onChange} testID="st" {...LABELS} />,
    )
    fireEvent.press(getByTestId('st-plus'))
    expect(onChange).toHaveBeenCalledWith(14)
  })
})
