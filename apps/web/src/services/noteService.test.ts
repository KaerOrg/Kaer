import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  fetchNotes,
  saveNote,
  updateNote,
  deleteNote,
  extractUniqueTags,
  selectableAppointmentsForNote,
  NOTE_APPOINTMENT_PAST_DAYS,
  NOTE_APPOINTMENT_FUTURE_DAYS,
} from './noteService'
import type { AppointmentStatus } from '../lib/calendar.types'

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
  appointment_id: null,
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

  it('insère appointment_id null par défaut (note libre)', async () => {
    const chain = makeChain({ data: NOTE, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)
    await saveNote('prac-1', 'pat-1', 'Note libre', [])
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ appointment_id: null }))
  })

  it('insère appointment_id quand un RDV est fourni', async () => {
    const linked = { ...NOTE, appointment_id: 'appt-9' }
    const chain = makeChain({ data: linked, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)
    const result = await saveNote('prac-1', 'pat-1', 'Note liée', ['Suivi'], 'appt-9')
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ appointment_id: 'appt-9' }))
    expect(result.note?.appointment_id).toBe('appt-9')
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

  it('met à jour appointment_id (rattachement à un RDV)', async () => {
    const chain = makeChain({ error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)
    await updateNote('n-1', 'Contenu', ['Suivi'], 'appt-3')
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ appointment_id: 'appt-3' }))
  })

  it('remet appointment_id à null (note redevenue libre)', async () => {
    const chain = makeChain({ error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)
    await updateNote('n-1', 'Contenu', [])
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ appointment_id: null }))
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

describe('selectableAppointmentsForNote', () => {
  const NOW = new Date('2026-06-15T12:00:00Z')
  const daysFromNow = (days: number) =>
    new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  function appt(id: string, days: number, status: AppointmentStatus = 'confirmed') {
    return { id, starts_at: daysFromNow(days), status }
  }

  it('garde les RDV dans la fenêtre [now - PAST, now + FUTURE]', () => {
    const appts = [
      appt('past-in', -NOTE_APPOINTMENT_PAST_DAYS + 1),
      appt('future-in', NOTE_APPOINTMENT_FUTURE_DAYS - 1),
    ]
    const result = selectableAppointmentsForNote(appts, NOW)
    expect(result.map(a => a.id).sort()).toEqual(['future-in', 'past-in'])
  })

  it('exclut les RDV hors fenêtre (trop anciens ou trop lointains)', () => {
    const appts = [
      appt('too-old', -NOTE_APPOINTMENT_PAST_DAYS - 5),
      appt('too-far', NOTE_APPOINTMENT_FUTURE_DAYS + 5),
    ]
    expect(selectableAppointmentsForNote(appts, NOW)).toEqual([])
  })

  it('exclut les RDV annulés même dans la fenêtre', () => {
    const appts = [
      appt('cancel-p', -2, 'cancelled_by_patient'),
      appt('cancel-pr', -1, 'cancelled_by_practitioner'),
      appt('ok', -3),
    ]
    expect(selectableAppointmentsForNote(appts, NOW).map(a => a.id)).toEqual(['ok'])
  })

  it('trie du plus récent au plus ancien', () => {
    const appts = [appt('a', -30), appt('b', -1), appt('c', -10)]
    expect(selectableAppointmentsForNote(appts, NOW).map(a => a.id)).toEqual(['b', 'c', 'a'])
  })

  it('inclut toujours le RDV déjà lié, même hors fenêtre ou annulé', () => {
    const appts = [
      appt('old-linked', -NOTE_APPOINTMENT_PAST_DAYS - 30, 'completed'),
      appt('cancelled-linked', -1, 'cancelled_by_patient'),
      appt('recent', -2),
    ]
    expect(
      selectableAppointmentsForNote(appts, NOW, 'old-linked').map(a => a.id),
    ).toContain('old-linked')
    expect(
      selectableAppointmentsForNote(appts, NOW, 'cancelled-linked').map(a => a.id),
    ).toContain('cancelled-linked')
  })
})
