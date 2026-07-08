import { Clock, Plus, Save } from 'lucide-react'
import { collectIndexed, buildColumnSpecs, readSliderParams } from '@kaer/shared'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { RatingSelector } from '@ui/RatingSelector'
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

function exampleTimeFor(child: ContentField): string {
  // Config-first : la valeur d'aperçu de la config (`preview_value`) prime sur
  // l'exemple générique par clé connue, lui-même devant le défaut.
  const key = child.props['key']
  return child.props['preview_value'] || (key && EXAMPLE_TIME[key]) || '08:00'
}

// Aperçu praticien du layout 'column_form' : uniquement le formulaire de saisie
// colonne-par-colonne (+ boutons d'action). Aucun historique de données factices.
// Aucune donnée en dur propre à un module : tout dérive des `column_*_field`.
export function ColumnFormLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'column_form_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const newBtn = lbl('new_btn_label')
  const saveLabel = lbl('save_label')

  // Colonnes + enfants dérivés une seule fois (source partagée web ≡ mobile),
  // comme côté mobile — pas à plat dans `fields`.
  const columns = buildColumnSpecs(fields)

  return (
    <div className="cf">
      {newBtn && (
        <div className="cf-actions">
          <Button variant="primary" size="sm" disabled icon={<Plus size={16} />}>
            {newBtn}
          </Button>
        </div>
      )}

      {/* Formulaire de saisie — colonnes empilées */}
      <div className="cf-entry">
        {columns.map(({ header: h, children }, idx) => {
          const color = h.props['color'] ?? 'var(--color-primary)'
          // Numérotation dynamique (parité mobile : position parmi les visibles).
          const stepNumber = String(idx + 1)
          const hintCode = h.props['hint_code']
          const isOptional = Boolean(h.props['optional_group'])
          const headerLabel = h.text_code ? t(h.text_code) : ''

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
                              <Chip key={code} label={t(code)} size="sm" />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                  if (child.field_type === 'column_slider_field') {
                    const sliderLabel = child.text_code ? t(child.text_code) : ''
                    const { min, max } = readSliderParams(child)
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
