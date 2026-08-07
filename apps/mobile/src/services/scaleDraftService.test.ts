import {
  loadDraft,
  saveDraft,
  discardDraft,
  purgeStaleDrafts,
  DRAFT_MAX_AGE_DAYS,
} from './scaleDraftService'
import * as database from '../lib/database'

jest.mock('../lib/database', () => ({
  getScaleDraft: jest.fn(),
  saveScaleDraft: jest.fn().mockResolvedValue(undefined),
  deleteScaleDraft: jest.fn().mockResolvedValue(undefined),
  deleteStaleScaleDrafts: jest.fn().mockResolvedValue(0),
}))

// Un brouillon ne doit produire AUCUN trafic. On mocke la couche de sync avec des
// espions : s'ils sont appelés, c'est que le brouillon est parti quelque part.
const mockEnqueue = jest.fn()
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

const mockFrom = jest.fn()
jest.mock('../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

const getScaleDraft = database.getScaleDraft as jest.Mock
const deleteScaleDraft = database.deleteScaleDraft as jest.Mock
const saveScaleDraft = database.saveScaleDraft as jest.Mock

function row(over: Partial<database.ScaleDraftRow> = {}): database.ScaleDraftRow {
  return {
    scale_id: 'phq9',
    answers: '[1,2,null]',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...over,
  }
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

describe('scaleDraftService.saveDraft', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sérialise les réponses et la position', async () => {
    await saveDraft('phq9', [1, null, 3], 2)
    expect(saveScaleDraft).toHaveBeenCalledWith('phq9', '[1,null,3]', 2)
  })

  it('n\'émet AUCUN appel réseau', async () => {
    // C'est le critère central du ticket : un brouillon n'est pas une passation, il ne
    // part pas, le praticien ne le voit pas, il n'existe pas en base distante.
    await saveDraft('phq9', [1, 2, 3], 2)
    expect(mockEnqueue).not.toHaveBeenCalled()
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('scaleDraftService.loadDraft', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rend le brouillon courant, réponses désérialisées', async () => {
    const started = daysAgo(1)
    getScaleDraft.mockResolvedValue(row({ created_at: started, answers: '[1,2,null]', position: 2 }))
    await expect(loadDraft('phq9')).resolves.toEqual({
      scaleId: 'phq9', answers: [1, 2, null], position: 2, startedAt: started,
    })
  })

  it('rend null et n\'efface rien quand il n\'y a pas de brouillon', async () => {
    getScaleDraft.mockResolvedValue(null)
    await expect(loadDraft('phq9')).resolves.toBeNull()
    expect(deleteScaleDraft).not.toHaveBeenCalled()
  })

  it('efface un brouillon plus vieux que la durée de vie et rend null', async () => {
    // Au delà, la fenêtre de deux semaines a glissé : mélanger d'anciennes réponses
    // avec des nouvelles produirait une passation qui ne mesure rien.
    getScaleDraft.mockResolvedValue(row({ created_at: daysAgo(DRAFT_MAX_AGE_DAYS + 1) }))
    await expect(loadDraft('phq9')).resolves.toBeNull()
    expect(deleteScaleDraft).toHaveBeenCalledWith('phq9')
  })

  it('garde un brouillon juste en deçà de la limite', async () => {
    getScaleDraft.mockResolvedValue(row({ created_at: daysAgo(DRAFT_MAX_AGE_DAYS - 1) }))
    await expect(loadDraft('phq9')).resolves.not.toBeNull()
    expect(deleteScaleDraft).not.toHaveBeenCalled()
  })

  it('efface un brouillon illisible plutôt que de propager des réponses douteuses', async () => {
    getScaleDraft.mockResolvedValue(row({ answers: 'pas du json' }))
    await expect(loadDraft('phq9')).resolves.toBeNull()
    expect(deleteScaleDraft).toHaveBeenCalledWith('phq9')
  })

  it('efface un brouillon dont l\'horodatage est inexploitable', async () => {
    getScaleDraft.mockResolvedValue(row({ created_at: 'jamais' }))
    await expect(loadDraft('phq9')).resolves.toBeNull()
    expect(deleteScaleDraft).toHaveBeenCalledWith('phq9')
  })

  it('remplace par null toute valeur non numérique du tableau', async () => {
    getScaleDraft.mockResolvedValue(row({ answers: '[1,"x",null,3]' }))
    const draft = await loadDraft('phq9')
    expect(draft?.answers).toEqual([1, null, null, 3])
  })
})

describe('scaleDraftService.discardDraft', () => {
  beforeEach(() => jest.clearAllMocks())

  it('efface le brouillon de l\'échelle demandée, et d\'elle seule', async () => {
    await discardDraft('phq9')
    expect(deleteScaleDraft).toHaveBeenCalledWith('phq9')
    expect(deleteScaleDraft).toHaveBeenCalledTimes(1)
  })
})

describe('scaleDraftService.purgeStaleDrafts', () => {
  beforeEach(() => jest.clearAllMocks())

  it('purge avec une coupure à la durée de vie et remonte le nombre effacé', async () => {
    ;(database.deleteStaleScaleDrafts as jest.Mock).mockResolvedValue(3)
    await expect(purgeStaleDrafts()).resolves.toBe(3)

    const cutoff = (database.deleteStaleScaleDrafts as jest.Mock).mock.calls[0][0] as string
    const ageDays = (Date.now() - new Date(cutoff).getTime()) / 86_400_000
    expect(ageDays).toBeCloseTo(DRAFT_MAX_AGE_DAYS, 1)
  })
})
