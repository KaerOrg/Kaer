import { useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { transcribeAudio, type RecordingState, type TranscriptionResult } from '../../services/transcriptionService'
import './SpeechToTextButton.css'

export interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void
  onStreamStart?: () => void
  onTextChunk?: (delta: string) => void
  onRecordingChange?: (recording: boolean) => void
  disabled?: boolean
}

const PREFERRED_MIME_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg']

function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  return PREFERRED_MIME_TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? null
}

function errorKey(result: TranscriptionResult & { ok: false }): string {
  const map: Record<string, string> = {
    NOT_SUPPORTED: 'notes.mic_error_not_supported',
    PERMISSION_DENIED: 'notes.mic_error_permission',
    TOO_LARGE: 'notes.mic_error_too_large',
    NETWORK: 'notes.mic_error_network',
    SERVER_ERROR: 'notes.mic_error_server',
  }
  return map[result.error] ?? 'notes.mic_error_server'
}

export function SpeechToTextButton({
  onTranscription,
  onStreamStart,
  onTextChunk,
  onRecordingChange,
  disabled = false,
}: SpeechToTextButtonProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<RecordingState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setErrorMsg(null)

    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      setState('error')
      setErrorMsg(t('notes.mic_error_not_supported'))
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('error')
      setErrorMsg(t('notes.mic_error_permission'))
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      onRecordingChange?.(false)
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setState('processing')

      const result = await transcribeAudio(blob, { onStreamStart, onTextChunk })
      if (result.ok) {
        onTranscription(result.text)
        setState('idle')
        setErrorMsg(null)
      } else {
        setState('error')
        setErrorMsg(t(errorKey(result)))
      }
    }

    recorder.start()
    setState('recording')
    onRecordingChange?.(true)
  }, [t, onTranscription])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
  }, [])

  const handleClick = useCallback(() => {
    if (state === 'recording') stopRecording()
    else if (state === 'idle' || state === 'error') startRecording()
  }, [state, startRecording, stopRecording])

  const isProcessing = state === 'processing'
  const isRecording = state === 'recording'
  const ariaLabel = isRecording ? t('notes.mic_stop') : t('notes.mic_start')

  return (
    <div className="stt-wrapper">
      <button
        type="button"
        className={`stt-btn stt-btn--${state}`}
        onClick={handleClick}
        disabled={disabled || isProcessing}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {isProcessing
          ? <Loader size={16} className="stt-btn__icon stt-btn__icon--spin" />
          : isRecording
            ? <MicOff size={16} className="stt-btn__icon" />
            : <Mic size={16} className="stt-btn__icon" />}
        {isProcessing
          ? t('notes.mic_processing')
          : isRecording
            ? t('notes.mic_stop')
            : t('notes.mic_start')}
        {isRecording && <span className="stt-btn__dot" aria-hidden="true" />}
      </button>
      {errorMsg && <p className="stt-error">{errorMsg}</p>}
    </div>
  )
}
