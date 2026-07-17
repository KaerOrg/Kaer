import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DimensionFingerprint, type FingerprintBar } from './DimensionFingerprint'

const BARS: FingerprintBar[] = [
  { key: 'mood', label: 'Hum', value: 7, color: '#C4B8ED' },
  { key: 'energy', label: 'Éne', value: 6, color: '#F0CE96' },
  { key: 'anxiety', label: 'Str', value: null, color: '#EDB1B1' },
]

describe('DimensionFingerprint', () => {
  it('rend une barre par dimension avec sa valeur et son libellé', () => {
    render(<DimensionFingerprint bars={BARS} yMax={10} />)
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('Hum')).toBeTruthy()
    expect(screen.getByTestId('fingerprint-bar-mood')).toBeTruthy()
    // Dimension non renseignée : « - » et barre de hauteur 0.
    expect(screen.getByText('-')).toBeTruthy()
    expect(screen.getByTestId('fingerprint-bar-anxiety').style.height).toBe('0px')
  })

  it('masque les valeurs quand showValues=false', () => {
    render(<DimensionFingerprint bars={BARS} yMax={10} showValues={false} />)
    expect(screen.queryByText('7')).toBeNull()
    expect(screen.getByText('Hum')).toBeTruthy()
  })
})
