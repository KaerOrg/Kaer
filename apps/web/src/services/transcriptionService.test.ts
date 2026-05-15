import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
  },
}))

import { supabase } from '../lib/supabase'
import { transcribeAudio } from './transcriptionService'

const mockGetSession = vi.mocked(supabase.auth.getSession)
const FAKE_SESSION = { data: { session: { access_token: 'tok' } }, error: null }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(FAKE_SESSION as never)
})

const makeBlob = (sizeBytes = 1000) =>
  new Blob([new Uint8Array(sizeBytes)], { type: 'audio/webm' })

function makeStreamResponse(deltas: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const delta of deltas) {
        const event = JSON.stringify({ type: 'transcript.text.delta', delta })
        controller.enqueue(encoder.encode(`data: ${event}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

describe('transcribeAudio', () => {
  it('retourne le texte accumulé depuis les deltas SSE', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse(['Séance ', 'productive.']))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: true, text: 'Séance productive.' })
  })

  it('appelle onStreamStart puis onTextChunk pour chaque delta', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse(['Bonjour', ' monde']))
    const onStreamStart = vi.fn()
    const onTextChunk = vi.fn()
    await transcribeAudio(makeBlob(), { onStreamStart, onTextChunk })
    expect(onStreamStart).toHaveBeenCalledOnce()
    expect(onTextChunk).toHaveBeenCalledTimes(2)
    expect(onTextChunk).toHaveBeenNthCalledWith(1, 'Bonjour')
    expect(onTextChunk).toHaveBeenNthCalledWith(2, ' monde')
  })

  it('passe Authorization + apikey dans les headers fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse(['ok']))
    await transcribeAudio(makeBlob())
    const [, opts] = mockFetch.mock.calls[0]
    const headers = opts?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer tok')
    expect(headers['apikey']).toBeDefined()
  })

  it('retourne TOO_LARGE si le blob dépasse 25 MB', async () => {
    const bigBlob = { size: 26 * 1024 * 1024, type: 'audio/webm' } as Blob
    const result = await transcribeAudio(bigBlob)
    expect(result).toEqual({ ok: false, error: 'TOO_LARGE' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retourne SERVER_ERROR si la session est absente', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null } as never)
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'SERVER_ERROR' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retourne SERVER_ERROR si fetch retourne un statut d\'erreur', async () => {
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 502 }))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne NETWORK en cas d\'exception réseau', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: false, error: 'NETWORK' })
  })
})
