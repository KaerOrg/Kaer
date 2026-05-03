import {
  createCravingEntriesTable,
  saveCravingEntry,
  listCravingEntries,
  getCravingEntry,
  deleteCravingEntry,
  type CravingEntry,
} from './database'

// ─── Mock expo-sqlite ─────────────────────────────────────────────────────────

const store: CravingEntry[] = []

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockImplementation((sql: string, params: unknown[]) => {
    if (/INSERT OR REPLACE/.test(sql)) {
      const [id, created_at, intensity, trigger_context, emotion, automatic_thought, coping_used, notes] = params as [
        string, string, number, string | null, string | null, string | null, string | null, string | null
      ]
      const idx = store.findIndex(e => e.id === id)
      const entry: CravingEntry = { id, created_at, intensity, trigger_context, emotion, automatic_thought, coping_used, notes }
      if (idx >= 0) store[idx] = entry
      else store.push(entry)
    }
    if (/DELETE FROM craving_entries WHERE id/.test(sql)) {
      const idx = store.findIndex(e => e.id === params[0])
      if (idx >= 0) store.splice(idx, 1)
    }
    return Promise.resolve()
  }),
  getAllAsync: jest.fn().mockImplementation((_sql: string, params: [number]) => {
    const limit = params[0] ?? 30
    return Promise.resolve([...store].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit))
  }),
  getFirstAsync: jest.fn().mockImplementation((_sql: string, params: [string]) => {
    return Promise.resolve(store.find(e => e.id === params[0]) ?? null)
  }),
}

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}))

// ─── Données de test ──────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<CravingEntry> = {}): CravingEntry {
  return {
    id: 'test-id-1',
    created_at: '2026-05-02T10:00:00.000Z',
    intensity: 6,
    trigger_context: 'Après le repas, en regardant une publicité',
    emotion: 'Ennui',
    automatic_thought: 'Juste une fois ça ne changera rien',
    coping_used: 'Marche 10 minutes',
    notes: null,
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  store.length = 0
  jest.clearAllMocks()
})

describe('createCravingEntriesTable', () => {
  it('crée la table sans erreur', async () => {
    await expect(createCravingEntriesTable(mockDb as never)).resolves.toBeUndefined()
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS craving_entries'))
  })
})

describe('saveCravingEntry', () => {
  it('enregistre une saisie complète', async () => {
    const entry = makeEntry()
    await saveCravingEntry(entry)
    const result = await getCravingEntry('test-id-1')
    expect(result).not.toBeNull()
    expect(result?.intensity).toBe(6)
    expect(result?.trigger_context).toBe('Après le repas, en regardant une publicité')
  })

  it('accepte tous les champs optionnels à null (champs non remplis)', async () => {
    const entry = makeEntry({
      trigger_context: null,
      emotion: null,
      automatic_thought: null,
      coping_used: null,
      notes: null,
    })
    await saveCravingEntry(entry)
    const result = await getCravingEntry('test-id-1')
    expect(result?.trigger_context).toBeNull()
    expect(result?.emotion).toBeNull()
  })

  it('intensity à 0 est valide (craving minimal)', async () => {
    const entry = makeEntry({ id: 'zero', intensity: 0 })
    await saveCravingEntry(entry)
    const result = await getCravingEntry('zero')
    expect(result?.intensity).toBe(0)
  })

  it('intensity à 10 est valide (craving maximal)', async () => {
    const entry = makeEntry({ id: 'max', intensity: 10 })
    await saveCravingEntry(entry)
    const result = await getCravingEntry('max')
    expect(result?.intensity).toBe(10)
  })

  it('met à jour une saisie existante (INSERT OR REPLACE)', async () => {
    await saveCravingEntry(makeEntry())
    await saveCravingEntry(makeEntry({ coping_used: 'Respiration lente' }))
    const result = await getCravingEntry('test-id-1')
    expect(result?.coping_used).toBe('Respiration lente')
  })
})

describe('listCravingEntries', () => {
  it('retourne les entrées triées du plus récent au plus ancien', async () => {
    await saveCravingEntry(makeEntry({ id: 'a', created_at: '2026-05-01T08:00:00.000Z' }))
    await saveCravingEntry(makeEntry({ id: 'b', created_at: '2026-05-02T10:00:00.000Z' }))
    const results = await listCravingEntries()
    expect(results[0].id).toBe('b')
    expect(results[1].id).toBe('a')
  })

  it('respecte la limite (défaut 30)', async () => {
    for (let i = 0; i < 5; i++) {
      await saveCravingEntry(makeEntry({ id: `e${i}`, created_at: `2026-05-0${i + 1}T10:00:00.000Z` }))
    }
    const results = await listCravingEntries(3)
    expect(results.length).toBeLessThanOrEqual(3)
  })
})

describe('deleteCravingEntry', () => {
  it('supprime une saisie existante', async () => {
    await saveCravingEntry(makeEntry())
    await deleteCravingEntry('test-id-1')
    const result = await getCravingEntry('test-id-1')
    expect(result).toBeUndefined()
  })

  it('ne plante pas si l\'id n\'existe pas', async () => {
    await expect(deleteCravingEntry('inexistant')).resolves.toBeUndefined()
  })
})
