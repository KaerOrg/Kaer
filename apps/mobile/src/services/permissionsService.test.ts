import * as Notifications from 'expo-notifications'
import * as ImagePicker from 'expo-image-picker'
import * as Contacts from 'expo-contacts'
import { checkPermission, requestPermission, ensurePermission } from './permissionsService'

// Les modules Expo sont mappés vers leurs mocks (jest.config moduleNameMapper).
const mockNotif = jest.mocked(Notifications)
const mockPicker = jest.mocked(ImagePicker)
const mockContacts = jest.mocked(Contacts)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('checkPermission', () => {
  it('lit le statut sans déclencher de prompt', async () => {
    mockNotif.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never)
    const state = await checkPermission('notifications')
    expect(state).toBe('granted')
    expect(mockNotif.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('normalise un statut inconnu vers denied', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValueOnce({ status: 'restricted' } as never)
    expect(await checkPermission('contacts')).toBe('denied')
  })

  it('route chaque kind vers le bon module Expo', async () => {
    mockPicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never)
    mockPicker.getCameraPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never)
    expect(await checkPermission('mediaLibrary')).toBe('granted')
    expect(await checkPermission('camera')).toBe('undetermined')
    expect(mockPicker.getMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1)
    expect(mockPicker.getCameraPermissionsAsync).toHaveBeenCalledTimes(1)
  })
})

describe('requestPermission', () => {
  it('déclenche le prompt et renvoie le nouveau statut', async () => {
    mockContacts.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never)
    expect(await requestPermission('contacts')).toBe('granted')
    expect(mockContacts.requestPermissionsAsync).toHaveBeenCalledTimes(1)
  })
})

describe('ensurePermission', () => {
  it('renvoie true sans re-demander si déjà accordée', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never)
    expect(await ensurePermission('contacts')).toBe(true)
    expect(mockContacts.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('renvoie false sans re-demander si déjà refusée', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as never)
    expect(await ensurePermission('contacts')).toBe(false)
    expect(mockContacts.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('demande quand le statut est indéterminé, puis renvoie le résultat', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never)
    mockContacts.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as never)
    expect(await ensurePermission('contacts')).toBe(true)
    expect(mockContacts.requestPermissionsAsync).toHaveBeenCalledTimes(1)
  })

  it('renvoie false si la demande est refusée', async () => {
    mockContacts.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never)
    mockContacts.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as never)
    expect(await ensurePermission('contacts')).toBe(false)
  })
})
