import React from 'react'
import { render, screen } from '@testing-library/react-native'

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  const stub = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  return { __esModule: true, default: stub, Svg: stub, Circle: stub }
})

import { ProgressRing } from './ProgressRing'

describe('ProgressRing', () => {
  it('affiche le label et le sous-label au centre', () => {
    render(<ProgressRing value={91} label="91 %" sublabel="efficacité" testID="ring" />)
    expect(screen.getByTestId('ring')).toBeTruthy()
    expect(screen.getByText('91 %')).toBeTruthy()
    expect(screen.getByText('efficacité')).toBeTruthy()
  })

  it('rend sans label ni sous-label (jauge seule)', () => {
    render(<ProgressRing value={50} testID="ring" />)
    expect(screen.getByTestId('ring')).toBeTruthy()
  })

  it('expose un libellé accessible', () => {
    render(<ProgressRing value={80} accessibilityLabel="Efficacité du sommeil" testID="ring" />)
    expect(screen.getByLabelText('Efficacité du sommeil')).toBeTruthy()
  })

  it('accepte des valeurs hors bornes sans planter (clamp)', () => {
    render(<ProgressRing value={130} max={100} label="130" testID="ring-over" />)
    expect(screen.getByTestId('ring-over')).toBeTruthy()
    render(<ProgressRing value={-10} max={100} label="-10" testID="ring-under" />)
    expect(screen.getByTestId('ring-under')).toBeTruthy()
  })
})
