import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadPractitionerAvatar, savePractitionerAvatarUrl } from './avatarService'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockEq = vi.fn()

vi.mock('../lib/supabase', () => ({
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

const mockArrayBuffer = new ArrayBuffer(8)

function makeFile(): File {
  const file = new File([], 'avatar.jpg', { type: 'image/jpeg' })
  // arrayBuffer n'est pas implémenté dans jsdom — on le mocke directement.
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(mockArrayBuffer),
  })
  return file
}

// ─── uploadPractitionerAvatar ──────────────────────────────────────────────────

describe('uploadPractitionerAvatar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne une URL publique après upload réussi', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.supabase.co/avatars/user-1/avatar.jpg' },
    })

    const url = await uploadPractitionerAvatar('user-1', makeFile())

    expect(url).toMatch(/^https:\/\/cdn\.supabase\.co\/avatars\/user-1\/avatar\.jpg\?t=\d+$/)
    expect(mockUpload).toHaveBeenCalledWith(
      'user-1/avatar.jpg',
      mockArrayBuffer,
      { contentType: 'image/jpeg', upsert: true }
    )
  })

  it('lève une erreur si Supabase Storage échoue', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage error' } })

    await expect(uploadPractitionerAvatar('user-1', makeFile())).rejects.toThrow('Storage error')
  })
})

// ─── savePractitionerAvatarUrl ─────────────────────────────────────────────────

describe('savePractitionerAvatarUrl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('met à jour avatar_url sans erreur', async () => {
    mockEq.mockResolvedValue({ error: null })

    await expect(
      savePractitionerAvatarUrl('user-1', 'https://cdn.supabase.co/avatars/user-1/avatar.jpg?t=1')
    ).resolves.toBeUndefined()
  })

  it('lève une erreur si la mise à jour BDD échoue', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB error' } })

    await expect(
      savePractitionerAvatarUrl('user-1', 'https://cdn.supabase.co/avatars/user-1/avatar.jpg?t=1')
    ).rejects.toThrow('DB error')
  })
})
