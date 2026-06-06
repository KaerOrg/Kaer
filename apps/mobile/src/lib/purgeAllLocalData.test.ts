const mockExecAsync = jest.fn().mockResolvedValue(undefined)
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => ({ execAsync: (...a: unknown[]) => mockExecAsync(...a) }),
}))

import { purgeAllLocalData } from './database'

beforeEach(() => jest.clearAllMocks())

describe('purgeAllLocalData', () => {
  it('vide chaque table patient connue (DELETE FROM) + la file de sync', async () => {
    await purgeAllLocalData()

    const deleted = mockExecAsync.mock.calls.map(c => String(c[0]))
    // Représentatif : saisies, agrégats, marqueurs, et la file de sync.
    expect(deleted).toContain('DELETE FROM scale_entries;')
    expect(deleted).toContain('DELETE FROM form_entries;')
    expect(deleted).toContain('DELETE FROM mood_markers;')
    expect(deleted).toContain('DELETE FROM crisis_plan_items;')
    expect(deleted).toContain('DELETE FROM sync_outbox;')
    // Toutes les commandes sont des DELETE FROM (aucune autre opération).
    expect(deleted.every(sql => sql.startsWith('DELETE FROM '))).toBe(true)
    expect(deleted.length).toBeGreaterThanOrEqual(30)
  })

  it('ignore une table absente sans interrompre la purge', async () => {
    mockExecAsync
      .mockRejectedValueOnce(new Error('no such table'))
      .mockResolvedValue(undefined)

    await expect(purgeAllLocalData()).resolves.toBeUndefined()
    // La purge continue malgré la première erreur.
    expect(mockExecAsync.mock.calls.length).toBeGreaterThanOrEqual(30)
  })
})
