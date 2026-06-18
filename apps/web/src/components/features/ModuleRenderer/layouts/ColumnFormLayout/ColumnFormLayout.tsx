import { Clock, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '../../../../ui/Button'
import type { ContentField } from '../../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Exemple d'horaire par ancre — aperçu parlant, AUCUNE donnée patient réelle.
const EXAMPLE_TIME: Record<string, string> = {
  wake_time: '07:00',
  first_meal: '08:00',
  main_activity: '10:30',
  last_meal: '19:30',
  bedtime: '23:00',
  light: '12:30',
}

function exampleTimeFor(child: ContentField): string {
  const key = child.props['key']
  return (key && EXAMPLE_TIME[key]) || child.props['preview_value'] || '08:00'
}

// Aperçu praticien du layout 'column_form'. Reproduit fidèlement le mobile :
// une saisie passée (carte récap dérivée des champs réels du module) + le
// formulaire de saisie colonne-par-colonne. Aucune donnée en dur propre à un
// module : la carte d'exemple est construite à partir des `column_*_field`.
export function ColumnFormLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const newBtn = lbl('new_btn_label')
  const saveLabel = lbl('save_label')

  const headers = fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)

  const childrenByHeader = new Map<string, ContentField[]>()
  for (const f of fields) {
    if (
      (f.field_type === 'column_text_field' ||
        f.field_type === 'column_slider_field' ||
        f.field_type === 'column_time_field') &&
      f.parent_field_id
    ) {
      const arr = childrenByHeader.get(f.parent_field_id) ?? []
      arr.push(f)
      childrenByHeader.set(f.parent_field_id, arr)
    }
  }

  // Carte « saisie passée » dérivée des champs : pastille (couleur de la colonne)
  // + libellé + valeur d'exemple. Reflète la liste d'historique du mobile.
  const recordRows: { id: string; color: string; label: string; value: string }[] = []
  for (const h of headers) {
    const color = h.props['color'] ?? '#6366F1'
    for (const child of childrenByHeader.get(h.id) ?? []) {
      const label = child.text_code ? t(child.text_code) : ''
      if (!label) continue
      let value = ''
      if (child.field_type === 'column_time_field') value = exampleTimeFor(child)
      else if (child.field_type === 'column_slider_field') value = '70%'
      else value = child.props['preview_value'] ?? ''
      recordRows.push({ id: child.id, color, label, value })
    }
  }

  return (
    <div className="cf">
      {recordRows.length > 0 && (
        <article className="cf-record">
          <header className="cf-record__head">
            <span className="cf-record__date">{lbl('today_label') || "aujourd'hui"}</span>
            <div className="cf-record__icons">
              <Pencil size={14} />
              <Trash2 size={14} />
            </div>
          </header>
          <div className="cf-record__body">
            {recordRows.map(r => (
              <div key={r.id} className="cf-record__row">
                <span className="cf-record__dot" style={{ background: r.color }} />
                <span className="cf-record__label">{r.label}</span>
                {r.value ? <span className="cf-record__val">{r.value}</span> : null}
              </div>
            ))}
          </div>
        </article>
      )}

      {newBtn && (
        <div className="cf-new-btn">
          <Plus size={16} />
          <span>{newBtn}</span>
        </div>
      )}

      {/* Formulaire de saisie — colonnes empilées */}
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
                    return (
                      <div key={child.id} className="cf-slider">
                        <div className="cf-slider__head">
                          <span className="cf-slider__label">{sliderLabel}</span>
                          <span className="cf-slider__value" style={{ color: sliderColor }}>{value}%</span>
                        </div>
                        <div className="cf-slider__track">
                          <div className="cf-slider__fill" style={{ width: `${ratio * 100}%`, background: sliderColor }} />
                        </div>
                      </div>
                    )
                  }
                  if (child.field_type === 'column_time_field') {
                    const timeLabel = child.text_code ? t(child.text_code) : ''
                    return (
                      <div key={child.id} className="cf-time">
                        {timeLabel ? <span className="cf-time__label">{timeLabel}</span> : null}
                        <div className="cf-time__chip" style={{ borderColor: color }}>
                          <Clock size={14} style={{ color }} />
                          <span className="cf-time__value">{exampleTimeFor(child)}</span>
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
          <Button type="button" variant="primary" fullWidth disabled icon={<Save size={16} />}>
            {saveLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
