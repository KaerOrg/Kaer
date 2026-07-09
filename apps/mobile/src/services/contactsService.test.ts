// Platform mocké (objet mutable) pour tester les deux systèmes :
// iOS sans permission, Android avec permission.
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

const mockEnsurePermission = jest.fn()
jest.mock('./permissionsService', () => ({
  ensurePermission: (...a: unknown[]) => mockEnsurePermission(...a),
}))

import { Platform } from 'react-native'
import * as Contacts from 'expo-contacts'
import { pickContact } from './contactsService'

const mockContacts = jest.mocked(Contacts)

beforeEach(() => {
  jest.clearAllMocks()
  Platform.OS = 'ios'
})

describe('pickContact', () => {
  it('renvoie nom + premier numéro du contact choisi', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce({
      id: 'c1',
      name: 'Marie Dupont',
      phoneNumbers: [{ number: '01 02 03 04 05' }, { number: '06 07 08 09 10' }],
    } as never)

    const result = await pickContact()
    expect(result).toEqual({ name: 'Marie Dupont', phone: '01 02 03 04 05' })
  })

  it('renvoie un numéro vide si le contact n\'en a pas', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce({
      id: 'c2',
      name: 'Sans Numéro',
      phoneNumbers: [],
    } as never)

    expect(await pickContact()).toEqual({ name: 'Sans Numéro', phone: '' })
  })

  it('ignore un numéro vide et prend le premier renseigné', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce({
      id: 'c3',
      name: 'Contact',
      phoneNumbers: [{ number: '' }, { number: '0123456789' }],
    } as never)

    expect((await pickContact())?.phone).toBe('0123456789')
  })

  it('renvoie null si l\'utilisateur annule le picker', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce(null)
    expect(await pickContact()).toBeNull()
  })

  it('iOS : ne demande aucune permission avant de présenter le picker', async () => {
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce(null)
    await pickContact()
    expect(mockEnsurePermission).not.toHaveBeenCalled()
    expect(mockContacts.presentContactPickerAsync).toHaveBeenCalledTimes(1)
  })

  it('Android : demande la permission contacts avant le picker', async () => {
    Platform.OS = 'android'
    mockEnsurePermission.mockResolvedValueOnce(true)
    mockContacts.presentContactPickerAsync.mockResolvedValueOnce({
      id: 'c4', name: 'Ami', phoneNumbers: [{ number: '0600000000' }],
    } as never)

    const result = await pickContact()
    expect(mockEnsurePermission).toHaveBeenCalledWith('contacts')
    expect(result?.phone).toBe('0600000000')
  })

  it('Android : renvoie null sans présenter le picker si la permission est refusée', async () => {
    Platform.OS = 'android'
    mockEnsurePermission.mockResolvedValueOnce(false)

    expect(await pickContact()).toBeNull()
    expect(mockContacts.presentContactPickerAsync).not.toHaveBeenCalled()
  })
})
