import { render, screen } from '@testing-library/react-native'
import { SpreadBars, type SpreadRow } from './SpreadBars'

const ROWS: SpreadRow[] = [
  { key: 'wake_time', color: '#F59E0B', label: 'Lever', sdMinutes: 20, count: 5 },
  { key: 'bedtime', color: '#8B5CF6', label: 'Coucher', sdMinutes: 40, count: 5 },
  { key: 'light', color: '#14B8A6', label: 'Lumière', sdMinutes: 0, count: 0 }, // jamais saisi
]

describe('SpreadBars', () => {
  it('affiche une ligne + valeur ±NN par repère suivi', () => {
    render(<SpreadBars rows={ROWS} title="Écart d'un jour à l'autre" unit="minutes" testID="spread" />)
    expect(screen.getByTestId('spread-wake_time')).toBeTruthy()
    expect(screen.getByTestId('spread-bedtime')).toBeTruthy()
    expect(screen.getByText('±20')).toBeTruthy()
    expect(screen.getByText('±40')).toBeTruthy()
  })

  it('masque les repères jamais saisis (count 0)', () => {
    render(<SpreadBars rows={ROWS} title="t" unit="minutes" />)
    expect(screen.queryByTestId('spread-light')).toBeNull()
  })

  it('ne rend rien si aucun repère n’est suivi', () => {
    render(<SpreadBars rows={[ROWS[2]]} title="t" unit="minutes" testID="spread" />)
    expect(screen.queryByTestId('spread')).toBeNull()
  })
})
