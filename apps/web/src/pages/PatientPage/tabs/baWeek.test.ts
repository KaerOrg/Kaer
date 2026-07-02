import { describe, it, expect } from 'vitest'
import { groupByDate } from './baWeek'
import type { ActivityEntryPoint } from '@services/engagementService'

// L'arithmétique de semaine (shiftDate/mondayOf/weekDays) est testée dans
// @kaer/shared (weekDates.test.ts) : ici, seul le groupement local.

function makeEntry(over: Partial<ActivityEntryPoint>): ActivityEntryPoint {
  return {
    id: 'a1',
    date: '2026-06-01',
    label: 'Marche',
    done: false,
    expected_pleasure: null,
    expected_mastery: null,
    pleasure: null,
    mastery: null,
    planned_time: null,
    domain_id: null,
    notes: null,
    ...over,
  }
}

describe('baWeek.groupByDate', () => {
  it("groupe par date métier en conservant l'ordre interne", () => {
    const entries = [
      makeEntry({ id: 'a1', date: '2026-06-01' }),
      makeEntry({ id: 'a2', date: '2026-06-02' }),
      makeEntry({ id: 'a3', date: '2026-06-01' }),
    ]
    const grouped = groupByDate(entries)
    expect(grouped.get('2026-06-01')?.map(e => e.id)).toEqual(['a1', 'a3'])
    expect(grouped.get('2026-06-02')?.map(e => e.id)).toEqual(['a2'])
    expect(grouped.get('2026-06-03')).toBeUndefined()
  })
})
