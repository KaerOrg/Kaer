import { renderHook } from '@testing-library/react-native'

const mockTeenColor = jest.fn()
let mockIsTeenMode = false
jest.mock('../useTeen', () => ({
  useTeen: () => ({ isTeenMode: mockIsTeenMode, teenColor: mockTeenColor, tt: () => '', tg: () => '' }),
}))

const stableT = (key: string) => key
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: stableT, i18n: { language: 'fr' } })),
}))

jest.mock('@theme', () => ({ colors: { primary: '#PRIMARY' } }))

jest.mock('../../lib/scaleScoring', () => ({
  SCALE_SCORING: {
    phq9: { items_count: 9, score_decimals: 0, formula: 'sum' },
  },
}))

import { useScaleScreen } from './useScaleScreen'
import { useTranslation } from 'react-i18next'

describe('useScaleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsTeenMode = false
    mockTeenColor.mockReturnValue(undefined)
  })

  it('renvoie la config de scoring du module', () => {
    const { result } = renderHook(() => useScaleScreen('phq9'))
    expect(result.current.config).toEqual({ items_count: 9, score_decimals: 0, formula: 'sum' })
  })

  it('renvoie config = undefined pour un scale_id inconnu', () => {
    const { result } = renderHook(() => useScaleScreen('unknown'))
    expect(result.current.config).toBeUndefined()
  })

  it('hors mode ado : accentColor undefined, activeColor = primary', () => {
    const { result } = renderHook(() => useScaleScreen('phq9'))
    expect(result.current.isTeenMode).toBe(false)
    expect(result.current.accentColor).toBeUndefined()
    expect(result.current.activeColor).toBe('#PRIMARY')
  })

  it('en mode ado : accentColor et activeColor = couleur du module', () => {
    mockIsTeenMode = true
    mockTeenColor.mockReturnValue('#ACCENT')
    const { result } = renderHook(() => useScaleScreen('phq9'))
    expect(result.current.isTeenMode).toBe(true)
    expect(result.current.accentColor).toBe('#ACCENT')
    expect(result.current.activeColor).toBe('#ACCENT')
    expect(mockTeenColor).toHaveBeenCalledWith('phq9')
  })

  it('résout la traduction sur le namespace teen+common en mode ado', () => {
    mockIsTeenMode = true
    mockTeenColor.mockReturnValue('#ACCENT')
    renderHook(() => useScaleScreen('phq9'))
    expect(useTranslation).toHaveBeenCalledWith(['teen', 'common'])
  })

  it('résout la traduction sur common hors mode ado', () => {
    renderHook(() => useScaleScreen('phq9'))
    expect(useTranslation).toHaveBeenCalledWith('common')
  })
})
