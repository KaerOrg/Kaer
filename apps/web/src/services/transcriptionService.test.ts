import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}))

import { supabase } from '../lib/supabase'
import { transcribeAudio } from './transcriptionService'

const mockInvoke = vi.mocked(supabase.functions.invoke)

beforeEach(() => vi.clearAllMocks())

const makeBlob = (sizeBytes = 1000) =>
  new Blob([new Uint8Array(sizeBytes)], { type: 'audio/webm' })

describe('transcribeAudio', () => {
  it('retourne le texte transcrit', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { text: 'Bonjour monde' }, error: null })
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: true, text: 'Bonjour monde' })
  })

  it('retourne TOO_LARGE si le blob dépasse 25 MB', async () => {
    const bigBlob = { size: 26 * 1024 * 1024, type: 'audio/webm' } as Blob
    expect(await transcribeAudio(bigBlob)).toEqual({ ok: false, error: 'TOO_LARGE' })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('retourne SERVER_ERROR si invoke retourne une erreur', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('invoke failed') })
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne SERVER_ERROR si data.text est absent', async () => {
    mockInvoke.mockResolvedValueOnce({ data: {}, error: null })
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne NETWORK en cas d\'exception réseau', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network error'))
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'NETWORK' })
  })

  it('passe le mime_type du blob à l\'edge function', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { text: 'ok' }, error: null })
    await transcribeAudio(new Blob([new Uint8Array(100)], { type: 'audio/mp4' }))
    expect(mockInvoke).toHaveBeenCalledWith('transcribe', expect.objectContaining({
      body: expect.objectContaining({ mime_type: 'audio/mp4' }),
    }))
  })
})
