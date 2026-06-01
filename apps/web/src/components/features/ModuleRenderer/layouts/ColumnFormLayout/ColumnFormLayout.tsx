import { Clock, Info, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le module beck_columns (preview_kind
// 'column_form') — entête avec liste mock d'une entrée passée, puis aperçu
// du formulaire d'entrée colonne-par-colonne (texte + slider). Source
// mobile : ColumnFormLayout (FieldRenderer.tsx).
export function ColumnFormLayout({ fields, footer, t }: Props) {
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const newBtn = lbl('new_btn_label')
  const saveLabel = lbl('save_label')

  // Colonnes : header + ses enfants text/slider
  const headers = fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)

  const childrenByHeader = new Map<string, ContentField[]>()
  for (const f of fields) {
    if (
      f.field_type === 'column_text_field' ||
      f.field_type === 'column_slider_field' ||
      f.field_type === 'column_time_field'
    ) {
      if (!f.parent_field_id) continue
      if (!childrenByHeader.has(f.parent_field_id)) childrenByHeader.set(f.parent_field_id, [])
      childrenByHeader.get(f.parent_field_id)!.push(f)
    }
  }

  return (
    <div className="cf">
      {/* Entrée mock — format fidèle au rendu mobile (puce colorée par colonne) */}
      {headers.length > 0 && (
        <article className="cf-record">
          <header className="cf-record__head">
            <span className="cf-record__date">il y a 2 jours</span>
            <div className="cf-record__icons">
              <Pencil size={13} />
              <Trash2 size={13} />
            </div>
          </header>
          <div className="cf-record__body">
            {headers.map(h => {
              const accent = h.props['color'] ?? '#6366F1'
              const label = h.text_code ? t(h.text_code) : ''
              const children = childrenByHeader.get(h.id) ?? []
              const sliderChild = children.find(c => c.field_type === 'column_slider_field')
              const annotation = sliderChild
                ? (() => {
                    const max = Number(sliderChild.props['max'] ?? 100)
                    const min = Number(sliderChild.props['min'] ?? 0)
                    const val = Math.round((min + max) * 0.65)
                    return max <= 10 ? ` (${val} / ${max})` : ` (${val} %)`
                  })()
                : ''
              return (
                <div key={h.id} className="cf-record__row">
                  <div className="cf-record__dot" style={{ background: accent }} />
                  <span className="cf-record__label" style={{ color: accent }}>{label}</span>
                  <span className="cf-record__val">—{annotation}</span>
                </div>
              )
            })}
          </div>
        </article>
      )}

      {newBtn && (
        <div className="cf-new-btn">
          <Plus size={16} />
          <span>{newBtn}</span>
        </div>
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}

      {/* Mode entry — colonnes empilées ────────────────────────────────── */}
      <div className="cf-entry">
        {headers.map((h, idx) => {
          const color = h.props['color'] ?? '#6366F1'
          const stepNumber = h.props['step_number'] ?? String(idx + 1)
          const hintCode = h.props['hint_code']
          const headerLabel = h.text_code ? t(h.text_code) : ''
          const children = childrenByHeader.get(h.id) ?? []

          return (
            <section key={h.id} className="cf-column">
              <div className="cf-column__head">
                <span className="cf-column__num" style={{ background: color }}>{stepNumber}</span>
                <div className="cf-column__titles">
                  <span className="cf-column__title" style={{ color }}>{headerLabel}</span>
                  {hintCode && <span className="cf-column__hint">{t(hintCode)}</span>}
                </div>
              </div>
              <div className="cf-column__body">
                {children.map(child => {
                  if (child.field_type === 'column_text_field') {
                    const placeholder = child.text_code ? t(child.text_code) : ''
                    return (
                      <div key={child.id} className="cf-text-input">
                        <span className="cf-text-input__placeholder">{placeholder}</span>
                      </div>
                    )
                  }
                  if (child.field_type === 'column_slider_field') {
                    const sliderLabel = child.text_code ? t(child.text_code) : ''
                    const min = Number(child.props['min'] ?? 0)
                    const max = Number(child.props['max'] ?? 100)
                    const sliderColor = child.props['color'] ?? color
                    const value = Math.round((min + max) * 0.7)
                    const ratio = max > min ? (value - min) / (max - min) : 0.5
                    const displayValue = max <= 10 ? `${value} / ${max}` : `${value} %`
                    return (
                      <div key={child.id} className="cf-slider">
                        <div className="cf-slider__head">
                          <span className="cf-slider__label">{sliderLabel}</span>
                          <span className="cf-slider__value" style={{ color: sliderColor }}>{displayValue}</span>
                        </div>
                        <div className="cf-slider__track">
                          <div
                            className="cf-slider__fill"
                            style={{ width: `${ratio * 100}%`, background: sliderColor }}
                          />
                        </div>
                      </div>
                    )
                  }
                  if (child.field_type === 'column_time_field') {
                    const timeLabel = child.text_code ? t(child.text_code) : ''
                    const mockValue = child.props['preview_value'] ?? '07:30'
                    return (
                      <div key={child.id} className="cf-time">
                        {timeLabel ? <span className="cf-time__label">{timeLabel}</span> : null}
                        <div className="cf-time__chip" style={{ borderColor: color }}>
                          <Clock size={14} style={{ color }} />
                          <span className="cf-time__value">{mockValue}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </section>
          )
        })}

        {saveLabel && (
          <button type="button" className="cf-save-btn" disabled>
            <Save size={16} />
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  )
}
