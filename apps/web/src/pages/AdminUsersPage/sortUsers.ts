import type { AdminUser } from '../../services/adminService'

/** Clé de tri « praticien » : premier médecin lié (alpha), vide pour un médecin. */
export function practitionerKey(u: AdminUser): string {
  if (u.practitioner_names.length === 0) return ''
  return [...u.practitioner_names].sort((a, b) => a.localeCompare(b))[0].toLowerCase()
}

/**
 * Comparateur de tri de la table admin : par praticien rattaché, puis par nom.
 * Les lignes sans praticien (médecins, patients non liés) sont reléguées en fin.
 */
export function byPractitionerThenName(a: AdminUser, b: AdminUser): number {
  const ka = practitionerKey(a)
  const kb = practitionerKey(b)
  if ((ka === '') !== (kb === '')) return ka === '' ? 1 : -1
  const byPractitioner = ka.localeCompare(kb)
  if (byPractitioner !== 0) return byPractitioner
  return a.display_name.localeCompare(b.display_name)
}
