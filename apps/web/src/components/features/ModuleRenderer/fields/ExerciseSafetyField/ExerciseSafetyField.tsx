import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import './ExerciseSafetyField.css'

interface Props {
  field: ContentField
}

export function ExerciseSafetyField({ field }: Props) {
  const { t } = useTranslation()
  const bgColor = field.props['bgColor'] as string | undefined
  const phone = field.props['phone'] as string | undefined
  const labelCode = field.props['label_code'] as string | undefined
  const label = labelCode ? t(labelCode) : ''

  return (
    <div className="exercise-safety-field" style={{ backgroundColor: bgColor }}>
      <Phone size={14} />
      <div className="exercise-safety-field__content">
        <span className="exercise-safety-field__number">{phone}</span>
        {label && <span className="exercise-safety-field__label">{label}</span>}
      </div>
    </div>
  )
}
