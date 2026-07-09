// ─── contactsService : import d'un contact du répertoire téléphone ───────────
//
// Enveloppe expo-contacts pour le plan de crise : le patient importe un proche ou
// un professionnel (étapes 4 & 5) afin de pouvoir l'appeler d'un geste. On expose
// une seule opération, `pickContact`, qui présente le picker natif du système et
// renvoie le nom + le premier numéro du contact choisi.
//
// Permissions (via le permissionsService générique) :
//   - Android : le picker natif exige READ_CONTACTS → on passe par ensurePermission.
//   - iOS : le picker (`CNContactPickerViewController`) s'exécute hors-process et ne
//     requiert AUCUNE permission (recommandation Apple : ne demander que le minimum).
//     On ne déclenche donc pas de prompt sur iOS.
//
// Conformité MDR 2017/745 : on importe un contact choisi par le patient, zéro
// lecture en masse du carnet d'adresses, zéro interprétation.

import { Platform } from 'react-native'
import * as Contacts from 'expo-contacts'
import { ensurePermission } from './permissionsService'

export interface PickedContact {
  /** Nom affiché du contact (peut être vide si le contact n'en a pas). */
  name: string
  /** Premier numéro de téléphone du contact ('' si aucun). */
  phone: string
}

/**
 * Présente le picker natif de contacts et renvoie le contact choisi (nom + premier
 * numéro), ou `null` si l'utilisateur annule ou refuse l'accès.
 */
export async function pickContact(): Promise<PickedContact | null> {
  // Sur Android uniquement, le picker natif exige la permission READ_CONTACTS.
  if (Platform.OS === 'android' && !(await ensurePermission('contacts'))) {
    return null
  }

  const contact = await Contacts.presentContactPickerAsync()
  if (contact == null) return null

  const phone = contact.phoneNumbers?.find(p => p.number != null && p.number !== '')?.number ?? ''
  return { name: contact.name ?? '', phone }
}
