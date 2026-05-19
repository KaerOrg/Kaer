import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import { fetchNotes, saveNote, updateNote, deleteNote, extractUniqueTags } from './noteService'

function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => vi.clearAllMocks())

const NOTE = {
  id: 'n-1',
  practitioner_id: 'prac-1',
  patient_id: 'pat-1',
  content: 'Séance productive',
  tags: ['Séance', 'Suivi'],
  created_at: '2026-05-15T10:00:00Z',
  updated_at: '2026-05-15T10:00:00Z',
}

describe('fetchNotes', () => {
  it('retourne les notes avec leurs tags', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: [NOTE] }) as never)
    const result = await fetchNotes('prac-1', 'pat-1')
    expect(result).toEqual([NOTE])
  })

  it('retourne [] en cas d\'erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: null, error: { message: 'RLS' } }) as never)
    const result = await fetchNotes('prac-1', 'pat-1')
    expect(result).toEqual([])
  })

  it('retourne [] si data est null sans erreur', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: null }) as never)
    const result = await fetchNotes('prac-1', 'pat-1')
    expect(result).toEqual([])
  })
})

describe('saveNote', () => {
  it('insère une note avec tags et retourne { ok: true, note }', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: NOTE, error: null }) as never)
    const result = await saveNote('prac-1', 'pat-1', 'Séance productive', ['Séance', 'Suivi'])
    expect(result).toEqual({ ok: true, note: NOTE })
  })

  it('insère une note sans tags (défaut vide)', async () => {
    const noteNoTags = { ...NOTE, tags: [] }
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: noteNoTags, error: null }) as never)
    const result = await saveNote('prac-1', 'pat-1', 'Note sans tag')
    expect(result.ok).toBe(true)
    expect(result.note?.tags).toEqual([])
  })

  it('retourne { ok: false } si le contenu est vide', async () => {
    const result = await saveNote('prac-1', 'pat-1', '   ')
    expect(result).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('retourne { ok: false } en cas d\'erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: null, error: { message: 'DB error' } }) as never)
    const result = await saveNote('prac-1', 'pat-1', 'Note valide')
    expect(result).toEqual({ ok: false })
  })
})

describe('updateNote', () => {
  it('met à jour la note avec tags et retourne { ok: true }', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ error: null }) as never)
    const result = await updateNote('n-1', 'Contenu modifié', ['Urgence'])
    expect(result).toEqual({ ok: true })
  })

  it('retourne { ok: false } si le contenu est vide', async () => {
    const result = await updateNote('n-1', '   ', [])
    expect(result).toEqual({ ok: false })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('retourne { ok: false } en cas d\'erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ error: { message: 'DB error' } }) as never)
    const result = await updateNote('n-1', 'Contenu valide', [])
    expect(result).toEqual({ ok: false })
  })
})

describe('deleteNote', () => {
  it('supprime la note et retourne { ok: true }', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ error: null }) as never)
    const result = await deleteNote('n-1')
    expect(result).toEqual({ ok: true })
  })

  it('retourne { ok: false } en cas d\'erreur Supabase', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ error: { message: 'DB error' } }) as never)
    const result = await deleteNote('n-1')
    expect(result).toEqual({ ok: false })
  })
})

describe('extractUniqueTags', () => {
  it('retourne les tags uniques triés alphabétiquement', () => {
    const notes = [
      { ...NOTE, tags: ['Suivi', 'Séance'] },
      { ...NOTE, id: 'n-2', tags: ['Urgence', 'Suivi'] },
    ]
    const result = extractUniqueTags(notes)
    expect(result).toEqual(['Séance', 'Suivi', 'Urgence'])
  })

  it('retourne [] si aucune note n\'a de tags', () => {
    const notes = [
      { ...NOTE, tags: [] },
      { ...NOTE, id: 'n-2', tags: [] },
    ]
    expect(extractUniqueTags(notes)).toEqual([])
  })

  it('retourne [] pour une liste de notes vide', () => {
    expect(extractUniqueTags([])).toEqual([])
  })
})
