import { AlertTriangle } from 'lucide-react'
import './FieldError.css'

interface Props {
  fieldId: string
  fieldType: string
  reason: 'unknown_type' | 'missing_text_code'
}

const REASON_MESSAGE: Record<Props['reason'], string> = {
  unknown_type: 'Aucun composant pour ce field_type',
  missing_text_code: 'text_code manquant',
}

export function FieldError({ fieldId, fieldType, reason }: Props) {
  return (
    <div className="field-error" role="alert">
      <AlertTriangle size={14} className="field-error__icon" />
      <div className="field-error__body">
        <div className="field-error__title">{REASON_MESSAGE[reason]}</div>
        <code className="field-error__meta">
          field_type=<strong>{fieldType || '(empty)'}</strong> · id={fieldId}
        </code>
      </div>
    </div>
  )
}
