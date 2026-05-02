import {
  clampSuds,
  createExposureHierarchy,
  listExposureHierarchies,
  deleteExposureHierarchy,
  addExposureItem,
  updateExposureItem,
  listExposureItems,
  toggleExposureItemDone,
  deleteExposureItem,
  addExposureSession,
  listSessionsForItem,
  countSessionsForItems,
  deleteExposureSession,
} from './database'

// ─── Mock SQLite ──────────────────────────────────────────────────────────────

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue(undefined),
  getFirstAsync: jest.fn().mockResolvedValue(null),
}

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── clampSuds ────────────────────────────────────────────────────────────────

describe('clampSuds', () => {
  it('retourne la valeur dans les bornes', () => {
    expect(clampSuds(50)).toBe(50)
  })

  it('bloque à 0 en dessous de 0', () => {
    expect(clampSuds(-10)).toBe(0)
  })

  it('bloque à 100 au dessus de 100', () => {
    expect(clampSuds(150)).toBe(100)
  })

  it('retourne 0 exact', () => {
    expect(clampSuds(0)).toBe(0)
  })

  it('retourne 100 exact', () => {
    expect(clampSuds(100)).toBe(100)
  })

  it('arrondit les valeurs décimales', () => {
    expect(clampSuds(47.6)).toBe(48)
    expect(clampSuds(47.3)).toBe(47)
  })
})

// ─── createExposureHierarchy ──────────────────────────────────────────────────

describe('createExposureHierarchy', () => {
  it('insère une hiérarchie avec titre', async () => {
    await createExposureHierarchy('id-1', 'Peur des ascenseurs')
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_hierarchies'),
      expect.arrayContaining(['id-1', 'Peur des ascenseurs'])
    )
  })

  it('accepte un titre null', async () => {
    await createExposureHierarchy('id-2', null)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_hierarchies'),
      expect.arrayContaining([null])
    )
  })
})

// ─── listExposureHierarchies ──────────────────────────────────────────────────

describe('listExposureHierarchies', () => {
  it('retourne une liste vide par défaut', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    const result = await listExposureHierarchies()
    expect(result).toEqual([])
  })

  it('retourne les hiérarchies telles que renvoyées par la BDD', async () => {
    const hierarchies = [
      { id: 'h1', title: 'Ascenseurs', created_at: '2024-01-02T00:00:00Z' },
      { id: 'h2', title: null, created_at: '2024-01-01T00:00:00Z' },
    ]
    mockDb.getAllAsync.mockResolvedValueOnce(hierarchies)
    const result = await listExposureHierarchies()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('h1')
  })

  it('interroge la table exposure_hierarchies', async () => {
    await listExposureHierarchies()
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM exposure_hierarchies'),
    )
  })
})

// ─── deleteExposureHierarchy ──────────────────────────────────────────────────

describe('deleteExposureHierarchy', () => {
  it('supprime la hiérarchie par id', async () => {
    await deleteExposureHierarchy('h1')
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM exposure_hierarchies WHERE id = ?',
      ['h1']
    )
  })
})

// ─── addExposureItem ──────────────────────────────────────────────────────────

describe('addExposureItem', () => {
  it('insère un item avec le score SUDS correct', async () => {
    await addExposureItem('item-1', 'h1', "Prendre l'ascenseur", 70)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_items'),
      expect.arrayContaining(['item-1', 'h1', "Prendre l'ascenseur", 70])
    )
  })

  it('insère un item avec SUDS à 0 (borne basse)', async () => {
    await addExposureItem('item-2', 'h1', 'Situation facile', 0)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_items'),
      expect.arrayContaining([0])
    )
  })

  it('insère un item avec SUDS à 100 (borne haute)', async () => {
    await addExposureItem('item-3', 'h1', 'Situation maximale', 100)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_items'),
      expect.arrayContaining([100])
    )
  })
})

// ─── updateExposureItem ───────────────────────────────────────────────────────

describe('updateExposureItem', () => {
  it('met à jour description et score SUDS', async () => {
    await updateExposureItem('item-1', 'Nouvelle description', 55)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE exposure_items'),
      ['Nouvelle description', 55, 'item-1']
    )
  })
})

// ─── listExposureItems ────────────────────────────────────────────────────────

describe('listExposureItems', () => {
  it('convertit is_done 0 → false', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'i1', hierarchy_id: 'h1', description: 'Test', suds_score: 30, is_done: 0, created_at: '2024-01-01' },
    ])
    const items = await listExposureItems('h1')
    expect(items[0].is_done).toBe(false)
  })

  it('convertit is_done 1 → true', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'i1', hierarchy_id: 'h1', description: 'Test', suds_score: 30, is_done: 1, created_at: '2024-01-01' },
    ])
    const items = await listExposureItems('h1')
    expect(items[0].is_done).toBe(true)
  })

  it('retourne une liste vide si aucun item', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    const items = await listExposureItems('h1')
    expect(items).toHaveLength(0)
  })

  it('filtre par hierarchy_id', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    await listExposureItems('hierarchy-abc')
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE hierarchy_id = ?'),
      ['hierarchy-abc']
    )
  })

  it('trie par suds_score ascendant (ORDER BY dans la requête)', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    await listExposureItems('h1')
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY suds_score ASC'),
      expect.anything()
    )
  })
})

// ─── toggleExposureItemDone ───────────────────────────────────────────────────

describe('toggleExposureItemDone', () => {
  it('passe is_done = 1 quand isDone = true', async () => {
    await toggleExposureItemDone('i1', true)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE exposure_items'),
      [1, 'i1']
    )
  })

  it('passe is_done = 0 quand isDone = false', async () => {
    await toggleExposureItemDone('i1', false)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE exposure_items'),
      [0, 'i1']
    )
  })
})

// ─── deleteExposureItem ───────────────────────────────────────────────────────

describe('deleteExposureItem', () => {
  it('supprime l\'item par id', async () => {
    await deleteExposureItem('i1')
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM exposure_items WHERE id = ?',
      ['i1']
    )
  })
})

// ─── addExposureSession ───────────────────────────────────────────────────────

describe('addExposureSession', () => {
  it('insère une séance avec l\'item_id et le score SUDS', async () => {
    await addExposureSession('sess-1', 'item-1', 65)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_sessions'),
      expect.arrayContaining(['sess-1', 'item-1', 65])
    )
  })

  it('insère une séance avec SUDS à 0 (borne basse)', async () => {
    await addExposureSession('sess-2', 'item-1', 0)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_sessions'),
      expect.arrayContaining([0])
    )
  })

  it('insère une séance avec SUDS à 100 (borne haute)', async () => {
    await addExposureSession('sess-3', 'item-1', 100)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO exposure_sessions'),
      expect.arrayContaining([100])
    )
  })
})

// ─── listSessionsForItem ──────────────────────────────────────────────────────

describe('listSessionsForItem', () => {
  it('retourne une liste vide si aucune séance', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    const result = await listSessionsForItem('item-1')
    expect(result).toEqual([])
  })

  it('retourne les séances telles que renvoyées par la BDD', async () => {
    const sessions = [
      { id: 's1', item_id: 'item-1', suds_score: 70, session_date: '2024-01-01', created_at: '2024-01-01' },
      { id: 's2', item_id: 'item-1', suds_score: 55, session_date: '2024-01-08', created_at: '2024-01-08' },
    ]
    mockDb.getAllAsync.mockResolvedValueOnce(sessions)
    const result = await listSessionsForItem('item-1')
    expect(result).toHaveLength(2)
    expect(result[0].suds_score).toBe(70)
    expect(result[1].suds_score).toBe(55)
  })

  it('filtre par item_id', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    await listSessionsForItem('item-abc')
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE item_id = ?'),
      ['item-abc']
    )
  })

  it('trie par session_date ascendant', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    await listSessionsForItem('item-1')
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY session_date ASC'),
      expect.anything()
    )
  })
})

// ─── countSessionsForItems ────────────────────────────────────────────────────

describe('countSessionsForItems', () => {
  it('retourne un objet vide si la liste d\'ids est vide', async () => {
    const result = await countSessionsForItems([])
    expect(result).toEqual({})
    expect(mockDb.getAllAsync).not.toHaveBeenCalled()
  })

  it('retourne les comptes par item_id', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { item_id: 'item-1', cnt: 3 },
      { item_id: 'item-2', cnt: 1 },
    ])
    const result = await countSessionsForItems(['item-1', 'item-2'])
    expect(result['item-1']).toBe(3)
    expect(result['item-2']).toBe(1)
  })

  it('renvoie undefined pour un item sans séance (absent du résultat GROUP BY)', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { item_id: 'item-1', cnt: 2 },
    ])
    const result = await countSessionsForItems(['item-1', 'item-2'])
    expect(result['item-1']).toBe(2)
    expect(result['item-2']).toBeUndefined()
  })

  it('utilise un WHERE IN avec les ids fournis', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([])
    await countSessionsForItems(['item-1', 'item-2'])
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE item_id IN'),
      ['item-1', 'item-2']
    )
  })
})

// ─── deleteExposureSession ────────────────────────────────────────────────────

describe('deleteExposureSession', () => {
  it('supprime la séance par id', async () => {
    await deleteExposureSession('sess-1')
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'DELETE FROM exposure_sessions WHERE id = ?',
      ['sess-1']
    )
  })
})
