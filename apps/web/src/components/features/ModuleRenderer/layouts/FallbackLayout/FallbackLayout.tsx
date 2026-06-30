import { Info } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { FieldError, FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Les `field_type` se terminant par `_config` sont des marqueurs sans
// `text_code` (ex. `daily_checkin_config`, `sleep_journal_config`). Ils
// portent uniquement des `field_props` consommés par le moteur mobile —
// rien à afficher au praticien.
function isConfigMarker(f: ContentField): boolean {
  return f.field_type.endsWith('_config')
}

export function FallbackLayout({ fields, footer, t }: Props) {
  const visible = fields.filter(f => !isConfigMarker(f))
  if (visible.length === 0 && !footer) return null
  return (
    <>
      <ul className="preview-fallback">
        {visible.map(f =>
          f.text_code ? (
            <li key={f.id} className="preview-fallback__item">{t(f.text_code)}</li>
          ) : (
            <li key={f.id} className="preview-fallback__item preview-fallback__item--error">
              <FieldError fieldId={f.id} fieldType={f.field_type} reason="missing_text_code" />
            </li>
          ),
        )}
      </ul>
      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </>
  )
}
