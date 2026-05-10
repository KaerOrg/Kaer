import * as ImagePicker from 'expo-image-picker'
import { pickAvatarImage, uploadAvatar, saveAvatarUrl } from './avatarService'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('expo-image-picker')

const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockEq = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    from: () => ({
      update: () => ({ eq: mockEq }),
    }),
  },
}))

global.fetch = jest.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
}) as jest.Mock

// ─── pickAvatarImage ───────────────────────────────────────────────────────────

describe('pickAvatarImage', () => {
  beforeEach(() => jest.clearAllMocks())

  it("retourne l'URI quand l'utilisateur choisit une image depuis la galerie", async () => {
    jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED, granted: true, canAskAgain: true, expires: 'never',
    })
    jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' } as ImagePicker.ImagePickerAsset],
    })

    const result = await pickAvatarImage('library')
    expect(result).toBe('file://photo.jpg')
  })

  it('retourne null si la permission galerie est refusee', async () => {
    jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED, granted: false, canAskAgain: false, expires: 'never',
    })

    const result = await pickAvatarImage('library')
    expect(result).toBeNull()
  })

  it("retourne null si l'utilisateur annule la galerie", async () => {
    jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED, granted: true, canAskAgain: true, expires: 'never',
    })
    jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValue({
      canceled: true,
      assets: null,
    })

    const result = await pickAvatarImage('library')
    expect(result).toBeNull()
  })

  it("retourne l'URI depuis la camera", async () => {
    jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED, granted: true, canAskAgain: true, expires: 'never',
    })
    jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://camera.jpg' } as ImagePicker.ImagePickerAsset],
    })

    const result = await pickAvatarImage('camera')
    expect(result).toBe('file://camera.jpg')
  })

  it('retourne null si la permission camera est refusee', async () => {
    jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED, granted: false, canAskAgain: false, expires: 'never',
    })

    const result = await pickAvatarImage('camera')
    expect(result).toBeNull()
  })
})

// ─── uploadAvatar ──────────────────────────────────────────────────────────────

describe('uploadAvatar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne une URL publique apres upload reussi', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.supabase.co/avatars/user-1/avatar.jpg' },
    })

    const url = await uploadAvatar('user-1', 'file://photo.jpg')
    expect(url).toMatch(/^https:\/\/cdn\.supabase\.co\/avatars\/user-1\/avatar\.jpg\?t=\d+$/)
    expect(mockUpload).toHaveBeenCalledWith(
      'user-1/avatar.jpg',
      expect.any(ArrayBuffer),
      { contentType: 'image/jpeg', upsert: true }
    )
  })

  it('leve une erreur si Supabase Storage echoue', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage error' } })

    await expect(uploadAvatar('user-1', 'file://photo.jpg')).rejects.toThrow('Storage error')
  })
})

// ─── saveAvatarUrl ─────────────────────────────────────────────────────────────

describe('saveAvatarUrl', () => {
  beforeEach(() => jest.clearAllMocks())

  it('met a jour avatar_url sans erreur', async () => {
    mockEq.mockResolvedValue({ error: null })

    await expect(
      saveAvatarUrl('user-1', 'https://cdn.supabase.co/avatars/user-1/avatar.jpg?t=1')
    ).resolves.toBeUndefined()
  })

  it('leve une erreur si la mise a jour BDD echoue', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB error' } })

    await expect(
      saveAvatarUrl('user-1', 'https://cdn.supabase.co/avatars/user-1/avatar.jpg?t=1')
    ).rejects.toThrow('DB error')
  })
})
