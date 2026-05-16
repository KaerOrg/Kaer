export interface SttProvider {
  readonly name: string
  transcribe(audio: Uint8Array, mimeType: string): Promise<string>
}
