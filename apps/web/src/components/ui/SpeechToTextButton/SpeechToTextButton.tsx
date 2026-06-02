import { useRef, useState, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SpeechRecorder, type RecorderErrorCode } from '../../../services/speechRecorderService'
import type { RecordingState } from '../../../services/transcriptionService'
import './SpeechToTextButton.css'

export interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void
  onTextChunk?: (text: string) => void
  onRecordingChange?: (recording: boolean) => void
  disabled?: boolean
}

const ERROR_I18N: Record<RecorderErrorCode, string> = {
  NOT_SUPPORTED: 'notes.mic_error_not_supported',
  PERMISSION_DENIED: 'notes.mic_error_permission',
  RECORDER_ERROR: 'notes.mic_error_recorder',
  DISCONNECTED: 'notes.mic_error_disconnected',
  TOO_LARGE: 'notes.mic_error_too_large',
  NETWORK: 'notes.mic_error_network',
  SERVER_ERROR: 'notes.mic_error_server',
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

  const recorder = useRef(new SpeechRecorder())
  const onTranscriptionRef = useRef(onTranscription)
  const onTextChunkRef = useRef(onTextChunk)
  const onRecordingChangeRef = useRef(onRecordingChange)
  useEffect(() => { onTranscriptionRef.current = onTranscription }, [onTranscription])
  useEffect(() => { onTextChunkRef.current = onTextChunk }, [onTextChunk])
  useEffect(() => { onRecordingChangeRef.current = onRecordingChange }, [onRecordingChange])

  useEffect(() => () => { recorder.current.abort() }, [])

  const handleClick = useCallback(() => {
    if (state === 'recording') {
      recorder.current.stop()
    } else if (state === 'idle' || state === 'error') {
      setErrorMsg(null)
      recorder.current.start({
        onStateChange: (s) => {
          setState(s)
          if (s === 'recording') onRecordingChangeRef.current?.(true)
          if (s === 'idle' || s === 'error') onRecordingChangeRef.current?.(false)
        },
        onError: (code) => setErrorMsg(t(ERROR_I18N[code])),
        onTranscription: (text) => onTranscriptionRef.current(text),
        onTextChunk: (text) => onTextChunkRef.current?.(text),
      })
    }
  }, [state, t])

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
