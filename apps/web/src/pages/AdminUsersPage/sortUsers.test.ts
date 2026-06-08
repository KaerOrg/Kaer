import { describe, it, expect } from 'vitest'
import { byPractitionerThenName, practitionerKey } from './sortUsers'
import type { AdminUser } from '../../services/adminService'

function user(partial: Partial<AdminUser> & Pick<AdminUser, 'display_name'>): AdminUser {
  return {
    user_id: partial.display_name,
    kind: 'patient',
    email: `${partial.display_name}@x.fr`,
    created_at: '2026-01-01T00:00:00Z',
    practitioner_names: [],
    is_admin: false,
    ...partial,
  }
}

describe('practitionerKey', () => {
  it('prend le premier médecin par ordre alphabétique, en minuscules', () => {
    expect(practitionerKey(user({ display_name: 'p', practitioner_names: ['Zoe', 'Alice'] }))).toBe('alice')
  })

  it('renvoie une chaîne vide sans médecin lié', () => {
    expect(practitionerKey(user({ display_name: 'p', practitioner_names: [] }))).toBe('')
  })
})

describe('byPractitionerThenName', () => {
  it('trie par praticien puis par nom, les lignes sans praticien en fin', () => {
    const rows = [
      user({ display_name: 'Zoe', practitioner_names: ['Dr Alpha'] }),
      user({ display_name: 'Médecin', kind: 'practitioner', practitioner_names: [] }),
      user({ display_name: 'Ada', practitioner_names: ['Dr Alpha'] }),
      user({ display_name: 'Bob', practitioner_names: ['Dr Beta'] }),
    ]

    const sorted = [...rows].sort(byPractitionerThenName).map(u => u.display_name)

    // Dr Alpha (Ada, Zoe) → Dr Beta (Bob) → sans praticien (Médecin)
    expect(sorted).toEqual(['Ada', 'Zoe', 'Bob', 'Médecin'])
  })
})
