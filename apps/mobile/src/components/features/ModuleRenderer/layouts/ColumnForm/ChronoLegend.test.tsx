import { render, screen } from '@testing-library/react-native'
import { ChronoLegend } from './ChronoLegend'
import { CHRONO_ANCHORS } from '@kaer/shared'

const t = (k: string) => k

describe('ChronoLegend', () => {
  it('affiche une pastille + libellé pour chacun des 6 repères', () => {
    render(<ChronoLegend t={t} />)
    expect(screen.getByTestId('chrono-legend')).toBeTruthy()
    for (const anchor of CHRONO_ANCHORS) {
      expect(screen.getByText(anchor.labelCode)).toBeTruthy()
    }
  })
})
