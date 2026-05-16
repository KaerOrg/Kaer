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

function makeStream(lines: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(lines.join('\n') + '\n'))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

// Format inline : {"type":"transcript.text.delta","delta":"…"}
function makeInlineStream(deltas: string[]): Response {
  const lines = deltas.flatMap(d => [
    `data: ${JSON.stringify({ type: 'transcript.text.delta', delta: d })}`,
    '',
  ])
  lines.push('data: [DONE]')
  return makeStream(lines)
}

// Format SSE standard OpenAI : event: + data:{"delta":"…"}
function makeSseStream(deltas: string[]): Response {
  const lines = deltas.flatMap(d => [
    'event: transcript.text.delta',
    `data: ${JSON.stringify({ delta: d })}`,
    '',
  ])
  lines.push('data: [DONE]')
  return makeStream(lines)
}

// Format fallback : un seul événement done avec le texte complet
function makeDoneOnlyStream(text: string): Response {
  return makeStream([
    'event: transcript.text.done',
    `data: ${JSON.stringify({ text })}`,
    '',
    'data: [DONE]',
  ])
}

describe('transcribeAudio — format inline', () => {
  it('retourne le texte accumulé', async () => {
    mockFetch.mockResolvedValueOnce(makeInlineStream(['Séance ', 'productive.']))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: true, text: 'Séance productive.' })
  })

  it('appelle onStreamStart puis onTextChunk pour chaque delta', async () => {
    mockFetch.mockResolvedValueOnce(makeInlineStream(['Bonjour', ' monde']))
    const onStreamStart = vi.fn()
    const onTextChunk = vi.fn()
    await transcribeAudio(makeBlob(), { onStreamStart, onTextChunk })
    expect(onStreamStart).toHaveBeenCalledOnce()
    expect(onTextChunk).toHaveBeenNthCalledWith(1, 'Bonjour')
    expect(onTextChunk).toHaveBeenNthCalledWith(2, ' monde')
  })
})

describe('transcribeAudio — format SSE standard (event: + data:)', () => {
  it('retourne le texte accumulé depuis les lignes event:', async () => {
    mockFetch.mockResolvedValueOnce(makeSseStream(['Le ', 'patient ', 'va bien.']))
    const result = await transcribeAudio(makeBlob())
    expect(result).toEqual({ ok: true, text: 'Le patient va bien.' })
  })

  it('appelle onTextChunk pour chaque delta SSE', async () => {
    mockFetch.mockResolvedValueOnce(makeSseStream(['Hello', ' world']))
    const onTextChunk = vi.fn()
    await transcribeAudio(makeBlob(), { onTextChunk })
    expect(onTextChunk).toHaveBeenCalledTimes(2)
  })
})

describe('transcribeAudio — fallback événement done', () => {
  it('utilise le texte de transcript.text.done si aucun delta reçu', async () => {
    mockFetch.mockResolvedValueOnce(makeDoneOnlyStream('Texte complet.'))
    const onTextChunk = vi.fn()
    const result = await transcribeAudio(makeBlob(), { onTextChunk })
    expect(result).toEqual({ ok: true, text: 'Texte complet.' })
    expect(onTextChunk).toHaveBeenCalledWith('Texte complet.')
  })
})

describe('transcribeAudio — erreurs', () => {
  it('passe Authorization + apikey dans les headers fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeInlineStream(['ok']))
    await transcribeAudio(makeBlob())
    const [, opts] = mockFetch.mock.calls[0]
    const headers = opts?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer tok')
    expect(headers['apikey']).toBeDefined()
  })

  it('retourne TOO_LARGE si le blob dépasse 25 MB', async () => {
    const bigBlob = { size: 26 * 1024 * 1024, type: 'audio/webm' } as Blob
    expect(await transcribeAudio(bigBlob)).toEqual({ ok: false, error: 'TOO_LARGE' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retourne SERVER_ERROR si la session est absente', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null } as never)
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'SERVER_ERROR' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retourne SERVER_ERROR si fetch retourne un statut d\'erreur', async () => {
    mockFetch.mockResolvedValueOnce(new Response('error', { status: 502 }))
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'SERVER_ERROR' })
  })

  it('retourne NETWORK en cas d\'exception réseau', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'))
    expect(await transcribeAudio(makeBlob())).toEqual({ ok: false, error: 'NETWORK' })
  })
})
