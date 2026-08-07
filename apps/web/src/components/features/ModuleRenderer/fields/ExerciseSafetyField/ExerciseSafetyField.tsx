import { useTranslation } from 'react-i18next'
import { Phone, MessageSquare } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import './ExerciseSafetyField.css'

interface Props {
  field: ContentField
}

// La couleur n'est plus portée par la donnée (`bgColor` retiré du seed, P-3) : le
// field ne transmet qu'une `tone` sémantique, traduite ici en classe de teinte. Une
// tone inconnue retombe sur `primary` : une ressource ajoutée en configuration sans
// intention explicite ne doit pas s'annoncer comme un danger vital.
const TONE_CLASS: Record<string, string> = {
  primary: 'exercise-safety-field--primary',
  danger: 'exercise-safety-field--danger',
}

export function ExerciseSafetyField({ field }: Props) {
  const { t } = useTranslation()
  const phone = field.props['phone']
  const labelCode = field.props['label_code']
  const toneClass = TONE_CLASS[field.props['tone']] ?? TONE_CLASS.primary
  // `sms` pour le 114 : le canal change l'icône, pas seulement le lien.
  const isSms = field.props['action'] === 'sms'

  return (
    <div className={`exercise-safety-field ${toneClass}`}>
      {isSms ? <MessageSquare size={14} /> : <Phone size={14} />}
      <div className="exercise-safety-field__content">
        <span className="exercise-safety-field__number">{field.text_code ? t(field.text_code) : phone}</span>
        {labelCode ? <span className="exercise-safety-field__label">{t(labelCode)}</span> : null}
      </div>
    </div>
  )
}
