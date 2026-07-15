import { buildRibbonGrid } from './ribbonGrid'
import type { ScaleEntry } from '../../../lib/database'

function entry(day: number, subs: Record<string, number>): ScaleEntry {
  // Ancrage midi local pour éviter tout basculement de jour en fuseau positif.
  const created = new Date(2026, 6, day, 12, 0, 0).toISOString()
  return {
    id: `e-${day}-${Math.random()}`,
    scale_id: 'mood_tracker',
    answers: [],
    total_score: 0,
    subscale_scores: subs,
    created_at: created,
  }
}

const KEYS = ['mood', 'energy']

describe('buildRibbonGrid', () => {
  it('produit une ligne par dimension, chacune longue de daysInMonth', () => {
    const grid = buildRibbonGrid([], KEYS, 2026, 6) // juillet 2026 = 31 jours
    expect(grid.daysInMonth).toBe(31)
    expect(grid.rows).toHaveLength(2)
    expect(grid.rows[0].values).toHaveLength(31)
    expect(grid.rows[0].values.every(v => v === null)).toBe(true)
    expect(grid.filledDays).toBe(0)
  })

  it('place les valeurs au bon jour et compte les jours saisis', () => {
    const grid = buildRibbonGrid(
      [entry(5, { mood: 7, energy: 6 }), entry(10, { mood: 3, energy: 4 })],
      KEYS, 2026, 6,
    )
    expect(grid.rows[0].values[4]).toBe(7) // jour 5 → index 4
    expect(grid.rows[1].values[4]).toBe(6)
    expect(grid.rows[0].values[9]).toBe(3) // jour 10 → index 9
    expect(grid.rows[0].values[0]).toBeNull() // jour 1 non saisi
    expect(grid.filledDays).toBe(2)
  })

  it('ignore les entrées hors du mois affiché', () => {
    const juneEntry: ScaleEntry = {
      ...entry(5, { mood: 9, energy: 9 }),
      created_at: new Date(2026, 5, 5, 12, 0, 0).toISOString(), // juin
    }
    const grid = buildRibbonGrid([juneEntry], KEYS, 2026, 6)
    expect(grid.filledDays).toBe(0)
    expect(grid.rows[0].values.every(v => v === null)).toBe(true)
  })

  it('la dernière saisie du jour l’emporte (entrées récent→ancien)', () => {
    // getAllScaleEntries rend récent→ancien : la plus récente est en tête.
    const recent = entry(8, { mood: 2, energy: 2 })
    const older = entry(8, { mood: 9, energy: 9 })
    const grid = buildRibbonGrid([recent, older], KEYS, 2026, 6)
    expect(grid.rows[0].values[7]).toBe(2)
  })
})
