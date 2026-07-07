import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { BreathCircle } from './BreathCircle'

describe('BreathCircle', () => {
  it('affiche le compte à rebours et le libellé de la phase d\'inspiration', () => {
    render(<BreathCircle phase={{ type: 'inhale', seconds: 5 }} progress={0.5} color="#4F46E5" countdown={3} moduleId="breathing_techniques" />)
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Inspirez')).toBeTruthy()
  })

  it('affiche le libellé de la phase d\'expiration', () => {
    render(<BreathCircle phase={{ type: 'exhale', seconds: 6 }} progress={0.2} color="#059669" countdown={5} moduleId="breathing_techniques" />)
    expect(screen.getByText('Expirez')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })
})
