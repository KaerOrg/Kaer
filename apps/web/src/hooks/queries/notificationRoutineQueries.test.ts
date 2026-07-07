import { describe, it, expect } from 'vitest'

vi.mock('@services/notificationRoutineService', () => ({ getRoutinesForPatientModule: vi.fn() }))

import { notificationRoutineQueries } from './notificationRoutineQueries'

describe('notificationRoutineQueries.byPatientModule', () => {
  it('produit une clé canonique par patient_module_id', () => {
    expect(notificationRoutineQueries.byPatientModule('pm1').queryKey).toEqual([
      'notificationRoutine', 'byPatientModule', 'pm1',
    ])
  })

  it('désactive la query sans id', () => {
    expect(notificationRoutineQueries.byPatientModule('').enabled).toBe(false)
    expect(notificationRoutineQueries.byPatientModule('pm1').enabled).toBe(true)
  })

  it('n\'est pas en cache infini (donnée volatile)', () => {
    expect(notificationRoutineQueries.byPatientModule('pm1').staleTime).not.toBe(Infinity)
  })
})
