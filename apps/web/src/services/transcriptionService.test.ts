import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}))

import { supabase } from '../lib/supabase'
import { transcribeAudio } from './transcriptionService'

const invokeAudio = vi.mocked(supabase.functions.invoke)

beforeEach(() => vi.clearAllMocks())

const makeBlob = (sizeBytes = 1000) =>
  new Blob([new Uint8Array(sizeBytes)], { type: 'audio/webm' })

describe('transcribeAudio', () => {
  it('retourne le texte transcrit quand l\'edge function répond', async () => {
    invokeAudio.mockResolvedValueOnce({ data: { text: 'Séance productive.' }, error: null })
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: true, text: 'Séance productive.' })
  })

  it('passe le bon payload (audio_base64 + mime_type) à l\'edge function', async () => {
    invokeAudio.mockResolvedValueOnce({ data: { text: 'test' }, error: null })
    await transcribeAudio(new Blob([new Uint8Array(10)], { type: 'audio/mp4' }))
    const [fnName, opts] = invokeAudio.mock.calls[0]
    expect(fnName).toBe('transcribe')
    expect(opts?.body).toMatchObject({ mime_type: 'audio/mp4' })
    expect(typeof (opts?.body as Record<string, unknown>)?.audio_base64).toBe('string')
  })

  it('retourne SERVER_ERROR si l\'edge function renvoie une erreur Supabase', async () => {
    invokeAudio.mockResolvedValueOnce({ data: null, error: { message: 'function error' } })
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne SERVER_ERROR si la réponse ne contient pas de texte', async () => {
    invokeAudio.mockResolvedValueOnce({ data: {}, error: null })
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne TOO_LARGE si le blob dépasse 25 MB', async () => {
    const bigBlob = { size: 26 * 1024 * 1024, type: 'audio/webm' } as Blob
    const result = await transcribeAudio(bigBlob)
    expect(result).toEqual({ ok: false, error: 'TOO_LARGE' })
    expect(invokeAudio).not.toHaveBeenCalled()
  })

  it('retourne NETWORK en cas d\'exception réseau', async () => {
    invokeAudio.mockRejectedValueOnce(new Error('fetch failed'))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'NETWORK' })
  })
})
