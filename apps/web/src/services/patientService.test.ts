import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('./auditService', () => ({
  logDataAccess: vi.fn(),
}))

import { supabase } from '../lib/supabase'
import { logDataAccess } from './auditService'
import {
  fetchPatientHeader,
  fetchPatientOptions,
  fetchPatientsWithModules,
  setTeenMode,
} from './patientService'

function makeChain(result: { data: unknown; error?: unknown } = { data: null, error: null }) {
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

describe('patientService.fetchPatientsWithModules', () => {
  it('combine relation + patient (objet) + patient_modules', async () => {
    const relations = [
      {
        patient_id: 'pat-1',
        patient_alias: 'Alias',
        patient_first_name: 'Jean',
        patient_last_name: 'Dupont',
        patient_birth_date: '1990-01-01',
        patient_sex: 'M',
        patients: { id: 'pat-1', email: 'jean@t.fr' },
      },
    ]
    const modules = [{ id: 'pm-1', patient_id: 'pat-1', module_type: 'sleep_diary' }]

    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: relations, error: null }) as never)
      .mockReturnValueOnce(makeChain({ data: modules, error: null }) as never)

    const result = await fetchPatientsWithModules('p-1')

    expect(result).toEqual([
      {
        id: 'pat-1',
        email: 'jean@t.fr',
        patient_alias: 'Alias',
        patient_first_name: 'Jean',
        patient_last_name: 'Dupont',
        patient_birth_date: '1990-01-01',
        patient_sex: 'M',
        modules,
      },
    ])
  })

  it("supporte le cas où patients arrive sous forme de tableau (jointure foreign 1-N)", async () => {
    const relations = [
      {
        patient_id: 'pat-1',
        patient_alias: null,
        patient_first_name: null,
        patient_last_name: null,
        patient_birth_date: null,
        patient_sex: null,
        patients: [{ id: 'pat-1', email: 'a@t.fr' }],
      },
    ]
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ data: relations, error: null }) as never)
      .mockReturnValueOnce(makeChain({ data: [], error: null }) as never)

    const result = await fetchPatientsWithModules('p-1')

    expect(result[0].email).toBe('a@t.fr')
  })

  it('retourne [] si aucune relation', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(makeChain({ data: null, error: null }) as never)

    const result = await fetchPatientsWithModules('p-1')

    expect(result).toEqual([])
  })
})

describe('patientService.fetchPatientOptions', () => {
  it("renvoie alias quand présent, sinon email", async () => {
    const relations = [
      { patient_id: 'a', patient_alias: 'Alias', patients: { email: 'a@t.fr' } },
      { patient_id: 'b', patient_alias: null,    patients: { email: 'b@t.fr' } },
    ]
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: relations, error: null }) as never)

    const result = await fetchPatientOptions('p-1')

    expect(result).toEqual([
      { id: 'a', label: 'Alias' },
      { id: 'b', label: 'b@t.fr' },
    ])
  })
})

describe('patientService.fetchPatientHeader', () => {
  it('extrait email + alias + teenMode', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({
        data: {
          patient_alias: 'A',
          patient_first_name: 'Jean',
          patient_last_name: 'Dupont',
          teen_mode: true,
          created_at: '2024-01-01T00:00:00Z',
          general_note: null,
          patients: { email: 'p@t.fr', first_name: null, last_name: null },
        },
        error: null,
      }) as never
    )

    const result = await fetchPatientHeader('p-1', 'pat-1')

    expect(result).toEqual({
      email: 'p@t.fr',
      alias: 'A',
      firstName: 'Jean',
      lastName: 'Dupont',
      teenMode: true,
      enrolledAt: '2024-01-01T00:00:00Z',
      generalNote: null,
    })
  })

  it("journalise l'accès au dossier patient (audit RGPD)", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({
        data: {
          patient_alias: null,
          patient_first_name: null,
          patient_last_name: null,
          teen_mode: false,
          created_at: '2024-01-01T00:00:00Z',
          general_note: null,
          patients: { email: 'p@t.fr', first_name: null, last_name: null },
        },
        error: null,
      }) as never
    )

    await fetchPatientHeader('p-1', 'pat-1')

    expect(logDataAccess).toHaveBeenCalledWith({
      action: 'read',
      targetTable: 'patients',
      targetId: 'pat-1',
      patientId: 'pat-1',
      metadata: { scope: 'header' },
    })
  })

  it('retourne null si la relation n’existe pas', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await fetchPatientHeader('p-1', 'pat-1')

    expect(result).toBeNull()
    expect(logDataAccess).not.toHaveBeenCalled()
  })
})

describe('patientService.setTeenMode', () => {
  it('renvoie ok: true en cas de succès', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: null }) as never)

    const result = await setTeenMode('p-1', 'pat-1', true)

    expect(result).toEqual({ ok: true })
  })

  it('renvoie ok: false si Supabase remonte une erreur', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: null, error: { message: 'fail' } }) as never)

    const result = await setTeenMode('p-1', 'pat-1', true)

    expect(result).toEqual({ ok: false })
  })
})
