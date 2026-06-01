import type { SttProvider, TranscribeOptions } from './interface.ts'
import { mimeToExt, delay } from './utils.ts'

const GLADIA_BASE = 'https://api.gladia.io'
const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 50_000

type UploadResponse = { audio_url: string }
type InitResponse = { id: string; result_url: string }
type PollResponse = {
  status: 'queued' | 'processing' | 'done' | 'error'
  error_code?: number | null
  result?: {
    transcription?: { full_transcript?: string }
  } | null
}

export class GladiaProvider implements SttProvider {
  readonly name = 'gladia'

  constructor(
    private readonly apiKey: string,
    private readonly language?: string,
  ) {}

  async transcribe(audio: Uint8Array, mimeType: string, options?: TranscribeOptions): Promise<string> {
    const audioUrl = await this.upload(audio, mimeType)
    const lang = options?.language ?? this.language
    const jobId = await this.initJob(audioUrl, lang)
    return this.pollUntilDone(jobId)
  }

  private async upload(audio: Uint8Array, mimeType: string): Promise<string> {
    const ext = mimeToExt(mimeType)
    const form = new FormData()
    form.append('audio', new File([audio], `recording.${ext}`, { type: mimeType }))

    const res = await fetch(`${GLADIA_BASE}/v2/upload`, {
      method: 'POST',
      headers: { 'x-gladia-key': this.apiKey },
      body: form,
    })

    if (!res.ok) throw new Error(`Gladia upload ${res.status}: ${await res.text()}`)
    const { audio_url } = await res.json() as UploadResponse
    return audio_url
  }

  private async initJob(audioUrl: string, language?: string): Promise<string> {
    const body: Record<string, unknown> = { audio_url: audioUrl }
    if (language) body.language_config = { languages: [language] }

    const res = await fetch(`${GLADIA_BASE}/v2/pre-recorded`, {
      method: 'POST',
      headers: {
        'x-gladia-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Gladia init ${res.status}: ${await res.text()}`)
    const { id } = await res.json() as InitResponse
    return id
  }

  private async pollUntilDone(jobId: string): Promise<string> {
    const deadline = Date.now() + POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      await delay(POLL_INTERVAL_MS)

      const res = await fetch(`${GLADIA_BASE}/v2/pre-recorded/${jobId}`, {
        headers: { 'x-gladia-key': this.apiKey },
      })

      if (!res.ok) throw new Error(`Gladia poll ${res.status}: ${await res.text()}`)

      const poll = await res.json() as PollResponse

      if (poll.status === 'done') return poll.result?.transcription?.full_transcript ?? ''
      if (poll.status === 'error') throw new Error(`Gladia job error (code ${poll.error_code ?? 'unknown'})`)
    }

    throw new Error(`Gladia timeout after ${POLL_TIMEOUT_MS}ms for job ${jobId}`)
  }
}
