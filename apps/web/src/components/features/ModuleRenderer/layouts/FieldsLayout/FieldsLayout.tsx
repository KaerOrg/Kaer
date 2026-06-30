import { Info } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { FieldRow, FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

export function FieldsLayout({ fields, footer, t }: Props) {
  return (
    <>
      <ul className="preview-fields">
        {fields.map(f => <FieldRow key={f.id} field={f} t={t} />)}
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
