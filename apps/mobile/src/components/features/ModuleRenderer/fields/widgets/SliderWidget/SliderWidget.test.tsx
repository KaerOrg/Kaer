import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SliderWidget } from './SliderWidget'

describe('SliderWidget', () => {
  it('affiche la valeur médiane avec unité', () => {
    render(<SliderWidget min={0} max={120} unit="min" />)
    expect(screen.getByText('60 min')).toBeTruthy()
  })

  it('affiche la valeur médiane sans unité', () => {
    render(<SliderWidget min={0} max={10} />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('affiche la médiane quand min et max sont inversés (min > max)', () => {
    // min=10, max=5 → mid=round(7.5)=8, ratio=0.5 (edge case défensif)
    render(<SliderWidget min={10} max={5} />)
    expect(screen.getByText('8')).toBeTruthy()
  })

  it('affiche 0 quand min=max=0', () => {
    render(<SliderWidget min={0} max={0} />)
    expect(screen.getByText('0')).toBeTruthy()
  })
})
