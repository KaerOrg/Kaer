import { Clock, Pencil, Plus, Save, Trash2, Zap } from 'lucide-react'
import { collectIndexed } from '@kaer/shared'
import { Button } from '../../../../ui/Button'
import { RatingSelector } from '../../../../ui/RatingSelector'
import type { ContentField } from '@services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Exemple d'horaire par repère — aperçu parlant, AUCUNE donnée patient réelle.
const EXAMPLE_TIME: Record<string, string> = {
  wake_time: '07:00',
  first_meal: '08:00',
  main_activity: '10:30',
  last_meal: '19:30',
  bedtime: '23:00',
  light: '12:30',
}

// Jours d'exemple (décalage en jours + variation d'horaire) pour montrer un
// historique « rempli » de plusieurs jours dans l'aperçu praticien.
const EXAMPLE_DAYS: readonly { dayOffset: number; shift: number }[] = [
  { dayOffset: 0, shift: 0 },
  { dayOffset: 1, shift: -12 },
  { dayOffset: 2, shift: 18 },
]

function exampleTimeFor(child: ContentField): string {
  const key = child.props['key']
  return (key && EXAMPLE_TIME[key]) || child.props['preview_value'] || '08:00'
}

function shiftTime(hhmm: string, deltaMin: number): string {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const total = (((h * 60 + m + deltaMin) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function dayLabel(offset: number): string {
  const d = new Date(Date.now() - offset * 86_400_000)
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

interface RecordRow { id: string; color: string; label: string; value: string }

// Aperçu praticien du layout 'column_form'. Reproduit fidèlement le mobile :
// un historique de saisies (cartes récap dérivées des champs réels du module,
// plusieurs jours d'exemple) + le formulaire de saisie colonne-par-colonne.
// Aucune donnée en dur propre à un module : tout dérive des `column_*_field`.
export function ColumnFormLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const newBtn = lbl('new_btn_label')
  const saveLabel = lbl('save_label')
  // Parité mobile : bouton « capture rapide » (formulaire réduit aux quick_key_*).
  const quickBtn = lbl('quick_btn_label')

  const headers = fields
    .filter(f => f.field_type === 'column_header')
    .sort((a, b) => a.sort_order - b.sort_order)

  // Les champs (texte/slider/horaire) sont IMBRIQUÉS sous leur column_header
  // (`h.children`), comme côté mobile — pas à plat dans `fields`.
  const headerChildren = (h: ContentField): ContentField[] =>
    (h.children ?? [])
      .filter(
        c =>
          c.field_type === 'column_text_field' ||
          c.field_type === 'column_slider_field' ||
          c.field_type === 'column_time_field',
      )
      .sort((a, b) => a.sort_order - b.sort_order)

  // Rangées d'une carte récap, pour un décalage horaire donné (jour d'exemple).
  const buildRows = (shift: number): RecordRow[] => {
    const rows: RecordRow[] = []
    for (const h of headers) {
      const color = h.props['color'] ?? 'var(--color-primary)'
      for (const child of headerChildren(h)) {
        const label = child.text_code ? t(child.text_code) : ''
        if (!label) continue
        let value = ''
        if (child.field_type === 'column_time_field') value = shiftTime(exampleTimeFor(child), shift)
        else if (child.field_type === 'column_slider_field') value = '70%'
        else value = child.props['preview_value'] ?? ''
        rows.push({ id: child.id, color, label, value })
      }
    }
    return rows
  }

  const hasExamples = headers.some(h => headerChildren(h).length > 0)

  return (
    <div className="cf">
      {/* Historique : plusieurs jours d'exemple, comme côté mobile */}
      {hasExamples &&
        EXAMPLE_DAYS.map(({ dayOffset, shift }) => (
          <article key={dayOffset} className="cf-record">
            <header className="cf-record__head">
              <span className="cf-record__date">{dayLabel(dayOffset)}</span>
              <div className="cf-record__icons">
                <Pencil size={14} />
                <Trash2 size={14} />
              </div>
            </header>
            <div className="cf-record__body">
              {buildRows(shift).map(r => (
                <div key={r.id} className="cf-record__row">
                  <span className="cf-record__dot" style={{ background: r.color }} />
                  <span className="cf-record__label">{r.label}</span>
                  {r.value ? <span className="cf-record__val">{r.value}</span> : null}
                </div>
              ))}
            </div>
          </article>
        ))}

      {(newBtn || quickBtn) && (
        <div className="cf-actions">
          {quickBtn && (
            <div className="cf-new-btn cf-new-btn--secondary">
              <Zap size={16} />
              <span>{quickBtn}</span>
            </div>
          )}
          {newBtn && (
            <div className="cf-new-btn">
              <Plus size={16} />
              <span>{newBtn}</span>
            </div>
          )}
        </div>
      )}

      {/* Formulaire de saisie — colonnes empilées */}
      <div className="cf-entry">
        {headers.map((h, idx) => {
          const color = h.props['color'] ?? 'var(--color-primary)'
          // Numérotation dynamique (parité mobile : position parmi les visibles).
          const stepNumber = String(idx + 1)
          const hintCode = h.props['hint_code']
          const isOptional = Boolean(h.props['optional_group'])
          const headerLabel = h.text_code ? t(h.text_code) : ''
          const children = headerChildren(h)

          return (
            <section key={h.id} className="cf-column">
              <div className="cf-column__head">
                <span className="cf-column__num" style={{ background: color }}>{stepNumber}</span>
                <div className="cf-column__titles">
                  <span className="cf-column__title" style={{ color }}>
                    {headerLabel}
                    {isOptional && <span className="cf-column__optional">{t('patient.optional_column_badge')}</span>}
                  </span>
                  {hintCode && <span className="cf-column__hint">{t(hintCode)}</span>}
                </div>
              </div>
              <div className="cf-column__body">
                {children.map(child => {
                  if (child.field_type === 'column_text_field') {
                    const placeholder = child.text_code ? t(child.text_code) : ''
                    // Parité mobile : chips d'aide au vocabulaire (suggestion_1..n).
                    const suggestionCodes = collectIndexed(child.props, 'suggestion')
                    return (
                      <div key={child.id} className="cf-field">
                        <div className="cf-text-input">
                          <span className="cf-text-input__placeholder">{placeholder}</span>
                        </div>
                        {suggestionCodes.length > 0 && (
                          <div className="cf-suggestions">
                            {suggestionCodes.map(code => (
                              <span key={code} className="cf-suggestion" style={{ borderColor: color, color }}>
                                {t(code)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                  if (child.field_type === 'column_slider_field') {
                    const sliderLabel = child.text_code ? t(child.text_code) : ''
                    const min = Number(child.props['min'] ?? 0)
                    const max = Number(child.props['max'] ?? 100)
                    const sliderColor = child.props['color'] ?? color
                    const value = Math.round((min + max) * 0.7)
                    return (
                      <RatingSelector
                        key={child.id}
                        variant="bar"
                        label={sliderLabel}
                        value={value}
                        min={min}
                        max={max}
                        valueSuffix="%"
                        color={sliderColor}
                      />
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
