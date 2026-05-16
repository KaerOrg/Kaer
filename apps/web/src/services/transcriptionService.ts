import { supabase } from '../lib/supabase'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

export type TranscriptionResult =
  | { ok: true; text: string }
  | { ok: false; error: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'NETWORK' | 'TOO_LARGE' | 'SERVER_ERROR' }

const MAX_BYTES = 25 * 1024 * 1024

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

export async function transcribeAudio(blob: Blob): Promise<TranscriptionResult> {
  if (blob.size > MAX_BYTES) return { ok: false, error: 'TOO_LARGE' }

  try {
    const audio_base64 = await blobToBase64(blob)

    const language = navigator.language.split('-')[0]
    const { data, error } = await supabase.functions.invoke<{ text: string }>('transcribe', {
      body: { audio_base64, mime_type: blob.type || 'audio/webm', language },
    })

    if (error || !data?.text) return { ok: false, error: 'SERVER_ERROR' }

    return { ok: true, text: data.text }
  } catch {
    return { ok: false, error: 'NETWORK' }
  }
}
