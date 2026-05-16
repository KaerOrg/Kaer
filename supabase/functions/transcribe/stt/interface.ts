export interface TranscribeOptions {
  language?: string
}

export interface SttProvider {
  readonly name: string
  transcribe(audio: Uint8Array, mimeType: string, options?: TranscribeOptions): Promise<string>
}
