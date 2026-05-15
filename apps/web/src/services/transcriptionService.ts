import { supabase } from '../lib/supabase'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

export type TranscriptionResult =
  | { ok: true; text: string }
  | { ok: false; error: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'NETWORK' | 'TOO_LARGE' | 'SERVER_ERROR' }

export interface TranscribeCallbacks {
  onStreamStart?: () => void
  onTextChunk?: (delta: string) => void
}

const MAX_BYTES = 25 * 1024 * 1024

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function transcribeAudio(
  blob: Blob,
  callbacks?: TranscribeCallbacks,
): Promise<TranscriptionResult> {
  if (blob.size > MAX_BYTES) return { ok: false, error: 'TOO_LARGE' }

  try {
    const audio_base64 = await blobToBase64(blob)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'SERVER_ERROR' }

    const response = await fetch(`${FUNCTIONS_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_base64, mime_type: blob.type || 'audio/webm' }),
    })

    if (!response.ok || !response.body) return { ok: false, error: 'SERVER_ERROR' }

    callbacks?.onStreamStart?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break

        try {
          const event = JSON.parse(data) as { type?: string; delta?: string }
          if (event.type === 'transcript.text.delta' && event.delta) {
            fullText += event.delta
            callbacks?.onTextChunk?.(event.delta)
          }
        } catch {
          // ligne SSE malformée — ignorée
        }
      }
    }

    return { ok: true, text: fullText }
  } catch {
    return { ok: false, error: 'NETWORK' }
  }
}
