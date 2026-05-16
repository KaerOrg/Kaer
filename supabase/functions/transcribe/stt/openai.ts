import type { SttProvider } from './interface.ts'
import { mimeToExt } from './utils.ts'

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const MODEL = 'gpt-4o-transcribe'

export class OpenAiProvider implements SttProvider {
  readonly name = 'openai'

  constructor(private readonly apiKey: string) {}

  async transcribe(audio: Uint8Array, mimeType: string): Promise<string> {
    const ext = mimeToExt(mimeType)
    const form = new FormData()
    form.append('file', new File([audio], `recording.${ext}`, { type: mimeType }))
    form.append('model', MODEL)
    form.append('response_format', 'json')

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`OpenAI error ${res.status}: ${detail}`)
    }

    const { text } = await res.json() as { text: string }
    return text
  }
}
