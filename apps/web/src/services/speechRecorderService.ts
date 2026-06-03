import { transcribeAudio, type RecordingState } from './transcriptionService'

export type RecorderErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'RECORDER_ERROR'
  | 'DISCONNECTED'
  | 'TOO_LARGE'
  | 'NETWORK'
  | 'SERVER_ERROR'

export interface SpeechRecorderCallbacks {
  onStateChange: (state: RecordingState) => void
  onError: (code: RecorderErrorCode) => void
  onTranscription: (text: string) => void
  onTextChunk?: (text: string) => void
}

const PREFERRED_MIME_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg']

export class SpeechRecorder {
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private callbacks: SpeechRecorderCallbacks | null = null
  private cancelled = false

  static getSupportedMimeType(): string | null {
    if (typeof MediaRecorder === 'undefined') return null
    return PREFERRED_MIME_TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? null
  }

  async start(callbacks: SpeechRecorderCallbacks): Promise<void> {
    this.callbacks = callbacks
    this.cancelled = false

    const mimeType = SpeechRecorder.getSupportedMimeType()
    if (!mimeType) {
      callbacks.onError('NOT_SUPPORTED')
      callbacks.onStateChange('error')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      callbacks.onError('PERMISSION_DENIED')
      callbacks.onStateChange('error')
      return
    }

    stream.getTracks().forEach(track => {
      track.onended = () => this.abort('DISCONNECTED')
    })

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType })
    } catch {
      stream.getTracks().forEach(tr => tr.stop())
      callbacks.onError('RECORDER_ERROR')
      callbacks.onStateChange('error')
      return
    }

    this.recorder = recorder
    this.stream = stream

    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onerror = () => this.abort('RECORDER_ERROR')

    recorder.onstop = async () => {
      if (this.cancelled) return
      this.stream?.getTracks().forEach(tr => tr.stop())
      this.stream = null
      callbacks.onStateChange('processing')

      const blob = new Blob(chunks, { type: mimeType })
      const result = await transcribeAudio(blob)

      if (this.cancelled) return

      if (!result.ok) {
        callbacks.onError(result.error)
        callbacks.onStateChange('error')
        return
      }

      if (result.text.trim()) callbacks.onTextChunk?.(result.text)
      callbacks.onTranscription(result.text)
      callbacks.onStateChange('idle')
    }

    try {
      recorder.start()
    } catch {
      stream.getTracks().forEach(tr => tr.stop())
      callbacks.onError('RECORDER_ERROR')
      callbacks.onStateChange('error')
      return
    }

    callbacks.onStateChange('recording')
  }

  stop(): void {
    if (this.recorder?.state !== 'inactive') {
      try { this.recorder?.stop() } catch { /* ignore */ }
    }
    this.recorder = null
  }

  abort(errorCode?: RecorderErrorCode): void {
    this.cancelled = true
    if (this.recorder?.state !== 'inactive') {
      try { this.recorder?.stop() } catch { /* ignore */ }
    }
    this.recorder = null
    this.stream?.getTracks().forEach(tr => tr.stop())
    this.stream = null
    if (errorCode && this.callbacks) {
      this.callbacks.onError(errorCode)
      this.callbacks.onStateChange('error')
    }
  }
}
