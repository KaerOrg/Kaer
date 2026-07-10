import { render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { WizardProgress } from './WizardProgress'

const ACCENT = '#123456'

function bgOf(testID: string): unknown {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor
}

describe('WizardProgress', () => {
  it('rend un segment par étape', () => {
    render(<WizardProgress total={7} current={0} accent={ACCENT} testID="wp" />)
    for (let i = 0; i < 7; i++) expect(screen.getByTestId(`wp-${i}`)).toBeTruthy()
    expect(screen.queryByTestId('wp-7')).toBeNull()
  })

  it('remplit les segments jusqu\'à l\'étape courante (incluse) avec l\'accent', () => {
    render(<WizardProgress total={5} current={2} accent={ACCENT} testID="wp" />)
    // 0,1,2 remplis (accent) ; 3,4 non remplis (≠ accent)
    expect(bgOf('wp-0')).toBe(ACCENT)
    expect(bgOf('wp-2')).toBe(ACCENT)
    expect(bgOf('wp-3')).not.toBe(ACCENT)
    expect(bgOf('wp-4')).not.toBe(ACCENT)
  })

  it('à la première étape, seul le premier segment porte l\'accent', () => {
    render(<WizardProgress total={3} current={0} accent={ACCENT} testID="wp" />)
    expect(bgOf('wp-0')).toBe(ACCENT)
    expect(bgOf('wp-1')).not.toBe(ACCENT)
  })
})
