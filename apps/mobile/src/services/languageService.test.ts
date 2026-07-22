import AsyncStorage from '@react-native-async-storage/async-storage'

import { isSupportedLanguage, loadStoredLanguage, persistLanguage } from './languageService'

beforeEach(async () => {
  jest.restoreAllMocks()
  await AsyncStorage.clear()
})

describe('isSupportedLanguage', () => {
  it('accepte une langue embarquée', () => {
    expect(isSupportedLanguage('en')).toBe(true)
  })

  it('rejette une langue inconnue', () => {
    expect(isSupportedLanguage('zz')).toBe(false)
  })
})

describe('persistLanguage / loadStoredLanguage', () => {
  it('relit la langue mémorisée', async () => {
    await persistLanguage('es')
    expect(await loadStoredLanguage()).toBe('es')
  })

  it('renvoie null quand aucun choix n\'a été mémorisé', async () => {
    expect(await loadStoredLanguage()).toBeNull()
  })

  it('ignore une valeur stockée non supportée', async () => {
    await AsyncStorage.setItem('kaer.language', 'zz')
    expect(await loadStoredLanguage()).toBeNull()
  })

  it('renvoie null si la lecture échoue', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('storage down'))
    expect(await loadStoredLanguage()).toBeNull()
  })

  it('n\'échoue pas si l\'écriture échoue', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('storage down'))
    await expect(persistLanguage('en')).resolves.toBeUndefined()
  })
})
