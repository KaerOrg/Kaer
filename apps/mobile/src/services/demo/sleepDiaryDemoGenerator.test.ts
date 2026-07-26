const mockSave = jest.fn().mockResolvedValue(undefined)
const mockDelete = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/sleepDiaryService', () => ({
  saveSleepEntry: (...a: unknown[]) => mockSave(...a),
  deleteSleepEntry: (...a: unknown[]) => mockDelete(...a),
}))

const mockGetAll = jest.fn().mockResolvedValue([])
jest.mock('../../lib/database', () => ({
  getAllSleepEntries: (...a: unknown[]) => mockGetAll(...a),
}))

import { shiftDate } from '@kaer/shared'
import {
  buildSleepDemoEntries,
  sleepDiaryDemoGenerator,
  SLEEP_DEMO_DAYS,
} from './sleepDiaryDemoGenerator'

beforeEach(() => jest.clearAllMocks())

describe('buildSleepDemoEntries', () => {
  const TODAY = '2026-07-26'
  const entries = buildSleepDemoEntries(TODAY)

  it('génère SLEEP_DEMO_DAYS (~2 mois) de nuits', () => {
    expect(entries).toHaveLength(SLEEP_DEMO_DAYS)
  })

  it('préfixe tous les local_id par « demo-sleep- » (purgeables)', () => {
    expect(entries.every((e) => e.id.startsWith('demo-sleep-'))).toBe(true)
  })

  it('couvre les 60 jours précédant today, en dates locales croissantes et uniques', () => {
    expect(entries[0].date).toBe(shiftDate(TODAY, -SLEEP_DEMO_DAYS))
    expect(entries[entries.length - 1].date).toBe(shiftDate(TODAY, -1))
    const dates = entries.map((e) => e.date)
    expect(new Set(dates).size).toBe(SLEEP_DEMO_DAYS)
    const sorted = [...dates].sort()
    expect(dates).toEqual(sorted)
  })

  it('produit des ressentis bruts bornés 1 à 5 (aucune interprétation MDR)', () => {
    for (const e of entries) {
      expect(e.quality).toBeGreaterThanOrEqual(1)
      expect(e.quality).toBeLessThanOrEqual(5)
      expect(e.restedness).toBeGreaterThanOrEqual(1)
      expect(e.restedness).toBeLessThanOrEqual(5)
    }
  })

  it('produit des heures au format HH:MM', () => {
    const hhmm = /^\d{2}:\d{2}$/
    for (const e of entries) {
      expect(e.bedtime).toMatch(hhmm)
      expect(e.wake_time).toMatch(hhmm)
      expect(e.in_bed_time).toMatch(hhmm)
      expect(e.out_of_bed_time).toMatch(hhmm)
    }
  })

  it('est déterministe (mêmes valeurs à chaque appel)', () => {
    expect(buildSleepDemoEntries(TODAY)).toEqual(entries)
  })
})

describe('sleepDiaryDemoGenerator', () => {
  it('module = sleep_diary', () => {
    expect(sleepDiaryDemoGenerator.module).toBe('sleep_diary')
  })

  it('generate : écrit chaque nuit via le service réel saveSleepEntry', async () => {
    const count = await sleepDiaryDemoGenerator.generate()
    expect(count).toBe(SLEEP_DEMO_DAYS)
    expect(mockSave).toHaveBeenCalledTimes(SLEEP_DEMO_DAYS)
    const firstArg = mockSave.mock.calls[0][0] as { id: string }
    expect(firstArg.id.startsWith('demo-sleep-')).toBe(true)
  })

  it('listEntryIds : retourne tous les ids du module (démo ET réels, l\'infra filtre)', async () => {
    mockGetAll.mockResolvedValueOnce([{ id: 'demo-sleep-2026-07-01' }, { id: 'real-entry-1' }])
    const ids = await sleepDiaryDemoGenerator.listEntryIds()
    expect(ids).toEqual(['demo-sleep-2026-07-01', 'real-entry-1'])
  })

  it('deleteEntry : délègue au service réel deleteSleepEntry (→ syncDelete)', async () => {
    await sleepDiaryDemoGenerator.deleteEntry('demo-sleep-2026-07-01')
    expect(mockDelete).toHaveBeenCalledWith('demo-sleep-2026-07-01')
  })
})
