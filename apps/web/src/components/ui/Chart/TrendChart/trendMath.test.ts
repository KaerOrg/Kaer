import {
  computeTrendMean, lastFilledPoint, eventDates, formatTrendValue, mergeTrendSeries,
  type TrendPoint,
} from './trendMath'

const DATA: TrendPoint[] = [
  { date: '2026-03-01', value: 80 },
  { date: '2026-03-02', value: null, event: true },
  { date: '2026-03-03', value: 90 },
]

describe('trendMath', () => {
  it('computeTrendMean : moyenne brute des valeurs renseignées, null si vide', () => {
    expect(computeTrendMean(DATA)).toBe(85)
    expect(computeTrendMean([{ date: 'd', value: null }])).toBeNull()
    expect(computeTrendMean([])).toBeNull()
  })

  it('lastFilledPoint : dernier point renseigné', () => {
    expect(lastFilledPoint(DATA)).toEqual({ date: '2026-03-03', value: 90 })
    expect(lastFilledPoint([{ date: 'd', value: null }])).toBeNull()
  })

  it('eventDates : dates des nuits marquées', () => {
    expect(eventDates(DATA)).toEqual(['2026-03-02'])
  })

  it('formatTrendValue : valeur + unité', () => {
    expect(formatTrendValue(85, '%')).toBe('85 %')
    expect(formatTrendValue(27, 'min')).toBe('27 min')
    expect(formatTrendValue(3, '')).toBe('3')
  })

  it('mergeTrendSeries : union des dates triée, ref alignée', () => {
    const main: TrendPoint[] = [{ date: '2026-03-02', value: 5 }, { date: '2026-03-01', value: 8 }]
    const ref: TrendPoint[] = [{ date: '2026-03-01', value: 6 }, { date: '2026-03-03', value: 7 }]
    expect(mergeTrendSeries(main, ref)).toEqual([
      { date: '2026-03-01', value: 8, ref: 6 },
      { date: '2026-03-02', value: 5 },
      { date: '2026-03-03', value: null, ref: 7 },
    ])
  })

  it('mergeTrendSeries : sans comparaison, série principale seule', () => {
    expect(mergeTrendSeries([{ date: 'd1', value: 1 }])).toEqual([{ date: 'd1', value: 1 }])
  })
})
