import { useRef, useState, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { transcribeAudio, type RecordingState, type TranscriptionResult } from '../../services/transcriptionService'
import './SpeechToTextButton.css'

export interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void
  onTextChunk?: (text: string) => void
  onRecordingChange?: (recording: boolean) => void
  disabled?: boolean
}

const CHUNK_MS = 8_000
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
  onTextChunk,
  onRecordingChange,
  disabled = false,
}: SpeechToTextButtonProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<RecordingState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Stable callback refs — let the chunk cycle always call the latest version
  const onTranscriptionRef = useRef(onTranscription)
  const onTextChunkRef = useRef(onTextChunk)
  const onRecordingChangeRef = useRef(onRecordingChange)
  useEffect(() => { onTranscriptionRef.current = onTranscription }, [onTranscription])
  useEffect(() => { onTextChunkRef.current = onTextChunk }, [onTextChunk])
  useEffect(() => { onRecordingChangeRef.current = onRecordingChange }, [onRecordingChange])

  const isRecordingRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    streamRef.current = stream
    isRecordingRef.current = true
    setState('recording')
    onRecordingChangeRef.current?.(true)

    const runChunk = () => {
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const isLast = !isRecordingRef.current
        const blob = new Blob(chunks, { type: mimeType })

        if (isLast) setState('processing')

        const result = await transcribeAudio(blob)

        if (!result.ok) {
          streamRef.current?.getTracks().forEach(tr => tr.stop())
          streamRef.current = null
          setState('error')
          setErrorMsg(t(errorKey(result)))
          onRecordingChangeRef.current?.(false)
          return
        }

        if (result.text.trim()) {
          onTextChunkRef.current?.(result.text)
        }

        if (isLast) {
          streamRef.current?.getTracks().forEach(tr => tr.stop())
          streamRef.current = null
          onTranscriptionRef.current(result.text)
          setState('idle')
          onRecordingChangeRef.current?.(false)
        } else {
          runChunk()
        }
      }

      recorder.start()
      chunkTimerRef.current = setTimeout(() => recorder.stop(), CHUNK_MS)
    }

    runChunk()
  }, [t])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
      chunkTimerRef.current = null
    }
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop()
    }
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
