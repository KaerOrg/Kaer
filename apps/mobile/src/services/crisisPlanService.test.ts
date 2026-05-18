// Mocks en premier — avant tout import
const mockFrom = jest.fn()
jest.mock('../lib/supabase', () => ({ supabase: { from: (...a: unknown[]) => mockFrom(...a) } }))

const mockGetCrisisAnchors = jest.fn()
const mockSaveCrisisAnchor = jest.fn()
const mockDeleteCrisisAnchor = jest.fn()
const mockGetModuleSetting = jest.fn()
const mockSetModuleSetting = jest.fn()
const mockGetAllPlanItemsForModule = jest.fn()
jest.mock('../lib/database', () => ({
  getCrisisAnchors: (...a: unknown[]) => mockGetCrisisAnchors(...a),
  saveCrisisAnchor: (...a: unknown[]) => mockSaveCrisisAnchor(...a),
  deleteCrisisAnchor: (...a: unknown[]) => mockDeleteCrisisAnchor(...a),
  getModuleSetting: (...a: unknown[]) => mockGetModuleSetting(...a),
  setModuleSetting: (...a: unknown[]) => mockSetModuleSetting(...a),
  getAllPlanItemsForModule: (...a: unknown[]) => mockGetAllPlanItemsForModule(...a),
}))

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///app/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

import {
  fetchPractitionerConfig,
  getAnchors,
  getAnchorPhrase,
  saveAnchorPhrase,
  getCommitment,
  saveCommitment,
  getUrgencyItems,
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
  it('retourne la config praticien si présente', async () => {
    mockFrom.mockReturnValueOnce(makeChain({
      data: { config: { crisisPlan: { practitionerMessage: 'Tu es courageux', copingCards: [], commitmentPhrase: 'Je m\'engage' } } },
    }))
    const cfg = await fetchPractitionerConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('Tu es courageux')
    expect(cfg.commitmentPhrase).toBe('Je m\'engage')
  })

  it('retourne des valeurs vides si aucun module', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null }))
    const cfg = await fetchPractitionerConfig('patient-1')
    expect(cfg.practitionerMessage).toBe('')
    expect(cfg.copingCards).toEqual([])
    expect(cfg.commitmentPhrase).toBe('')
  })

  it('retourne des valeurs vides si crisisPlan absent du config', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: { config: {} } }))
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
      { granted: false } as ImagePicker.MediaLibraryPermissionResponse
    )
    const result = await pickAndSaveAnchorPhoto(0)
    expect(result).toBeNull()
  })

  it('retourne null si picker annulé', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(
      { granted: true } as ImagePicker.MediaLibraryPermissionResponse
    )
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce(
      { canceled: true, assets: null } as unknown as ImagePicker.ImagePickerResult
    )
    const result = await pickAndSaveAnchorPhoto(0)
    expect(result).toBeNull()
  })

  it('sauvegarde et retourne l\'anchor si photo sélectionnée', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(
      { granted: true } as ImagePicker.MediaLibraryPermissionResponse
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

// ─── Engagement thérapeutique ─────────────────────────────────────────────────

describe('getCommitment / saveCommitment', () => {
  it('retourne null si aucun engagement', async () => {
    mockGetModuleSetting.mockResolvedValueOnce(null)
    expect(await getCommitment()).toBeNull()
  })

  it('retourne l\'engagement parsé', async () => {
    mockGetModuleSetting.mockResolvedValueOnce(JSON.stringify({ name: 'Jean', date: '2026-05-17T10:00:00.000Z' }))
    const result = await getCommitment()
    expect(result?.name).toBe('Jean')
  })

  it('sauvegarde l\'engagement avec la date courante', async () => {
    mockSetModuleSetting.mockResolvedValueOnce(undefined)
    await saveCommitment('Marie')
    const call = mockSetModuleSetting.mock.calls[0]
    expect(call[0]).toBe('crisis_plan')
    expect(call[1]).toBe('commitment')
    const parsed = JSON.parse(call[2])
    expect(parsed.name).toBe('Marie')
    expect(parsed.date).toBeDefined()
  })
})

// ─── getUrgencyItems ──────────────────────────────────────────────────────────

describe('getUrgencyItems', () => {
  it('filtre correctement les étapes 4 et 5', async () => {
    mockGetAllPlanItemsForModule.mockResolvedValueOnce([
      { id: '1', section_id: 'step_4', text: 'Appeler Sophie', module_id: 'crisis_plan', sort_order: 0, weight: null, created_at: '' },
      { id: '2', section_id: 'step_5', text: '3114', module_id: 'crisis_plan', sort_order: 0, weight: null, created_at: '' },
      { id: '3', section_id: 'step_1', text: 'Signe avant-coureur', module_id: 'crisis_plan', sort_order: 0, weight: null, created_at: '' },
    ])
    const result = await getUrgencyItems()
    expect(result.step4).toHaveLength(1)
    expect(result.step4[0].text).toBe('Appeler Sophie')
    expect(result.step5).toHaveLength(1)
    expect(result.step5[0].text).toBe('3114')
  })

  it('retourne des tableaux vides si aucun item', async () => {
    mockGetAllPlanItemsForModule.mockResolvedValueOnce([])
    const result = await getUrgencyItems()
    expect(result.step4).toEqual([])
    expect(result.step5).toEqual([])
  })
})
