// Mocks en premier — avant tout import
const mockFrom = jest.fn()
jest.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

const mockGetCrisisAnchors = jest.fn()
const mockSaveCrisisAnchor = jest.fn()
const mockDeleteCrisisAnchor = jest.fn()
const mockGetModuleSetting = jest.fn()
const mockSetModuleSetting = jest.fn()
jest.mock('../lib/database', () => ({
  getCrisisAnchors: (...a: unknown[]) => mockGetCrisisAnchors(...a),
  saveCrisisAnchor: (...a: unknown[]) => mockSaveCrisisAnchor(...a),
  deleteCrisisAnchor: (...a: unknown[]) => mockDeleteCrisisAnchor(...a),
  getModuleSetting: (...a: unknown[]) => mockGetModuleSetting(...a),
  setModuleSetting: (...a: unknown[]) => mockSetModuleSetting(...a),
}))

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///app/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-image-picker', () => ({
  // getMediaLibraryPermissionsAsync : lu par le permissionsService générique avant
  // de demander (undetermined par défaut → déclenche la demande).
  getMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

import {
  fetchPractitionerConfig,
  getAnchors,
  getAnchorPhrase,
  saveAnchorPhrase,
  pickAndSaveAnchorPhoto,
  removeAnchorPhoto,
} from './crisisPlanService'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'

function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') return (r: (v: unknown) => unknown) => Promise.resolve(result).then(r)
      if (!target[prop]) target[prop] = jest.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

beforeEach(() => jest.clearAllMocks())

// ─── fetchPractitionerConfig ──────────────────────────────────────────────────

describe('fetchPractitionerConfig', () => {
  it('retourne le message praticien si présent', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { practitioner_message: 'Tu es courageux' } }))
    const cfg = await fetchPractitionerConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('Tu es courageux')
  })

  it('retourne une valeur vide si aucune ligne en base', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    const cfg = await fetchPractitionerConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('')
  })
})

// ─── getAnchors ───────────────────────────────────────────────────────────────

describe('getAnchors', () => {
  it('délègue à getCrisisAnchors', async () => {
    const anchors = [{ id: 'a1', uri: 'file:///app/a1.jpg', sort_order: 0, created_at: '' }]
    mockGetCrisisAnchors.mockResolvedValueOnce(anchors)
    const result = await getAnchors()
    expect(result).toEqual(anchors)
  })
})

// ─── pickAndSaveAnchorPhoto ───────────────────────────────────────────────────

describe('pickAndSaveAnchorPhoto', () => {
  it('retourne null si max anchors atteint', async () => {
    const result = await pickAndSaveAnchorPhoto(3)
    expect(result).toBeNull()
  })

  it('retourne null si permission refusée', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(
      { status: 'denied' } as ImagePicker.MediaLibraryPermissionResponse
    )
    const result = await pickAndSaveAnchorPhoto(0)
    expect(result).toBeNull()
  })

  it('retourne null si picker annulé', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(
      { status: 'granted' } as ImagePicker.MediaLibraryPermissionResponse
    )
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce(
      { canceled: true, assets: null } as unknown as ImagePicker.ImagePickerResult
    )
    const result = await pickAndSaveAnchorPhoto(0)
    expect(result).toBeNull()
  })

  it('sauvegarde et retourne l\'anchor si photo sélectionnée', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(
      { status: 'granted' } as ImagePicker.MediaLibraryPermissionResponse
    )
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg' }],
    } as ImagePicker.ImagePickerResult)
    mockSaveCrisisAnchor.mockResolvedValueOnce(undefined)

    const result = await pickAndSaveAnchorPhoto(1)

    expect(result).not.toBeNull()
    expect(result?.sort_order).toBe(1)
    expect(mockSaveCrisisAnchor).toHaveBeenCalledTimes(1)
  })
})

// ─── removeAnchorPhoto ────────────────────────────────────────────────────────

describe('removeAnchorPhoto', () => {
  it('supprime le fichier et l\'entrée SQLite', async () => {
    jest.mocked(FileSystem.getInfoAsync).mockResolvedValueOnce({ exists: true, isDirectory: false, uri: 'file:///app/a1.jpg', size: 0, modificationTime: 0 })
    mockDeleteCrisisAnchor.mockResolvedValueOnce(undefined)
    const anchor = { id: 'a1', uri: 'file:///app/a1.jpg', sort_order: 0, created_at: '' }
    await removeAnchorPhoto(anchor)
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///app/a1.jpg', { idempotent: true })
    expect(mockDeleteCrisisAnchor).toHaveBeenCalledWith('a1')
  })
})

// ─── Phrase d'ancrage ─────────────────────────────────────────────────────────

describe('getAnchorPhrase / saveAnchorPhrase', () => {
  it('retourne chaîne vide si rien en base', async () => {
    mockGetModuleSetting.mockResolvedValueOnce(null)
    expect(await getAnchorPhrase()).toBe('')
  })

  it('retourne la phrase si présente', async () => {
    mockGetModuleSetting.mockResolvedValueOnce('La vie vaut la peine')
    expect(await getAnchorPhrase()).toBe('La vie vaut la peine')
  })

  it('sauvegarde la phrase', async () => {
    mockSetModuleSetting.mockResolvedValueOnce(undefined)
    await saveAnchorPhrase('Je tiens à mes enfants')
    expect(mockSetModuleSetting).toHaveBeenCalledWith('crisis_plan', 'anchor_phrase', 'Je tiens à mes enfants')
  })
})
