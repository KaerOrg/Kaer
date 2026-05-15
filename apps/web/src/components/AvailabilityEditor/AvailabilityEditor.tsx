import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Toggle } from '../Toggle/Toggle'
import { Button } from '../Button/Button'
import type { AvailabilityRule, DayOfWeek } from '../../lib/calendar.types'
import './AvailabilityEditor.css'

const DAY_OPTIONS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

interface AvailabilityEditorProps {
  rules: AvailabilityRule[]
  autoConfirm: boolean
  onAddRule: (rule: Omit<AvailabilityRule, 'id' | 'created_at'>) => Promise<void>
  onDeleteRule: (ruleId: string) => Promise<void>
  onToggleAutoConfirm: (value: boolean) => Promise<void>
  practitionerId: string
}

export function AvailabilityEditor({
  rules,
  autoConfirm,
  onAddRule,
  onDeleteRule,
  onToggleAutoConfirm,
  practitionerId,
}: AvailabilityEditorProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const dayRef = useRef<HTMLSelectElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLInputElement>(null)
  const durationRef = useRef<HTMLInputElement>(null)

  async function handleAddRule() {
    const day = Number(dayRef.current?.value ?? 0) as DayOfWeek
    const start = startRef.current?.value ?? ''
    const end = endRef.current?.value ?? ''
    const duration = Number(durationRef.current?.value ?? 50)

    if (!start || !end) {
      setFormError('Renseignez les heures de début et de fin.')
      return
    }
    if (start >= end) {
      setFormError("L'heure de fin doit être après l'heure de début.")
      return
    }
    if (duration < 5 || duration > 480) {
      setFormError('La durée doit être entre 5 et 480 minutes.')
      return
    }

    setFormError(null)
    setSaving(true)
    await onAddRule({
      practitioner_id: practitionerId,
      day_of_week: day,
      start_time: start,
      end_time: end,
      slot_duration_minutes: duration,
    })
    if (startRef.current) startRef.current.value = ''
    if (endRef.current) endRef.current.value = ''
    setSaving(false)
  }

  return (
    <aside className="availability-editor">
      {/* Auto-confirm toggle */}
      <div className="availability-editor__section">
        <div className="availability-editor__auto-confirm">
          <div>
            <div className="availability-editor__auto-confirm-label">
              {t('agenda.editor.auto_confirm')}
            </div>
            <div className="availability-editor__auto-confirm-hint">
              {t('agenda.editor.auto_confirm_hint')}
            </div>
          </div>
          <Toggle
            checked={autoConfirm}
            onChange={onToggleAutoConfirm}
          />
        </div>
      </div>

      {/* Rules */}
      <div className="availability-editor__section">
        <div className="availability-editor__section-title">
          {t('agenda.editor.title')}
        </div>

        <div className="availability-editor__rules">
          {rules.length === 0 && (
            <p className="availability-editor__no-rules">{t('agenda.editor.no_rules')}</p>
          )}
          {rules.map(rule => (
            <div key={rule.id} className="availability-editor__rule">
              <span className="availability-editor__rule-day">
                {t(`agenda.days.${rule.day_of_week}`)}
              </span>
              <span className="availability-editor__rule-time">
                {rule.start_time.slice(0, 5)} – {rule.end_time.slice(0, 5)}
              </span>
              <span className="availability-editor__rule-duration">
                {rule.slot_duration_minutes} {t('agenda.editor.minutes')}
              </span>
              <button
                className="availability-editor__rule-delete"
                onClick={() => onDeleteRule(rule.id)}
                title={t('agenda.editor.delete_rule')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="availability-editor__add-form">
          <div className="availability-editor__form-row">
            <label>{t('agenda.days_short.0')[0]}</label>
            <select ref={dayRef} defaultValue={0}>
              {DAY_OPTIONS.map(d => (
                <option key={d} value={d}>{t(`agenda.days.${d}`)}</option>
              ))}
            </select>
          </div>

          <div className="availability-editor__form-row">
            <label>{t('agenda.editor.from')}</label>
            <input ref={startRef} type="time" step={300} />
            <label>{t('agenda.editor.to')}</label>
            <input ref={endRef} type="time" step={300} />
          </div>

          <div className="availability-editor__form-row">
            <label>{t('agenda.editor.slot_duration')}</label>
            <input
              ref={durationRef}
              type="number"
              defaultValue={50}
              min={5}
              max={480}
              step={5}
            />
            <label>{t('agenda.editor.minutes')}</label>
          </div>

          {formError && (
            <p className="availability-editor__error">{formError}</p>
          )}

          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={handleAddRule}
          >
            {t('agenda.editor.add_rule')}
          </Button>
        </div>
      </div>
    </aside>
  )
}
