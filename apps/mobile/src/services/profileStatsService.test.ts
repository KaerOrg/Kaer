jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }))

import { supabase } from '../lib/supabase'
import { fetchProfileStats } from './profileStatsService'

const mockFrom = supabase.from as jest.Mock

// Construit un faux client par table : `patients` (maybeSingle), `patient_modules`
// et `appointments` (comptages head).
function stubTables(opts: {
  createdAt?: string | null
  moduleCount?: number | null
  sessionCount?: number | null
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'patients') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: opts.createdAt === undefined ? null : { created_at: opts.createdAt } }),
          }),
        }),
      }
    }
    if (table === 'patient_modules') {
      return { select: () => ({ eq: () => Promise.resolve({ count: opts.moduleCount ?? null }) }) }
    }
    // appointments — deux `.eq` enchaînés (patient_id puis status)
    return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: opts.sessionCount ?? null }) }) }) }
  })
}

beforeEach(() => jest.clearAllMocks())

describe('profileStatsService.fetchProfileStats', () => {
  it('agrège created_at, modules débloqués et séances honorées', async () => {
    stubTables({ createdAt: '2025-03-01T10:00:00Z', moduleCount: 3, sessionCount: 8 })

    const stats = await fetchProfileStats('pat-1')

    expect(stats).toEqual({ createdAt: '2025-03-01T10:00:00Z', activeModules: 3, sessions: 8 })
  })

  it('renvoie des valeurs neutres quand le profil est absent et les comptages nuls', async () => {
    stubTables({ createdAt: undefined, moduleCount: null, sessionCount: null })

    const stats = await fetchProfileStats('pat-2')

    expect(stats).toEqual({ createdAt: null, activeModules: 0, sessions: 0 })
  })

  it('interroge la table appointments filtrée sur le statut completed', async () => {
    const statusEq = jest.fn().mockReturnValue({ eq: () => Promise.resolve({ count: 1 }) })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'patients') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) }
      }
      if (table === 'patient_modules') {
        return { select: () => ({ eq: () => Promise.resolve({ count: 0 }) }) }
      }
      return { select: () => ({ eq: statusEq }) }
    })

    await fetchProfileStats('pat-3')

    expect(statusEq).toHaveBeenCalledWith('patient_id', 'pat-3')
  })
})
