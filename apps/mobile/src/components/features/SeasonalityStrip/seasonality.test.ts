import { buildSeasonality } from './seasonality'
import type { ScaleEntry } from '../../../lib/database'

function entry(year: number, month: number, day: number, mood: number): ScaleEntry {
  return {
    id: `e-${year}-${month}-${day}-${Math.random()}`,
    scale_id: 'mood_tracker', answers: [], total_score: 0,
    subscale_scores: { mood }, created_at: new Date(year, month, day, 12).toISOString(),
  }
}

describe('buildSeasonality', () => {
  it('produit 12 mois par année demandée, null si aucune saisie', () => {
    const rows = buildSeasonality([], 'mood', [2026, 2025])
    expect(rows).toHaveLength(2)
    expect(rows[0].year).toBe(2026)
    expect(rows[0].months).toHaveLength(12)
    expect(rows[0].months.every(m => m === null)).toBe(true)
  })

  it('moyenne les valeurs d’un même mois', () => {
    const rows = buildSeasonality(
      [entry(2026, 2, 1, 4), entry(2026, 2, 15, 8)], // mars 2026 → moyenne 6
      'mood', [2026],
    )
    expect(rows[0].months[2]).toBe(6)
    expect(rows[0].months[0]).toBeNull() // janvier vide
  })

  it('ventile par année et ignore les années non demandées', () => {
    const rows = buildSeasonality(
      [entry(2026, 0, 1, 5), entry(2025, 0, 1, 9), entry(2020, 0, 1, 1)],
      'mood', [2026, 2025],
    )
    expect(rows[0].months[0]).toBe(5) // 2026 janvier
    expect(rows[1].months[0]).toBe(9) // 2025 janvier
    // 2020 non demandée → absente
    expect(rows.find(r => r.year === 2020)).toBeUndefined()
  })
})
