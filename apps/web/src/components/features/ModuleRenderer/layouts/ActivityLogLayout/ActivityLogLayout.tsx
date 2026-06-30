import { Calendar, Check, Circle, ListChecks, Plus } from 'lucide-react'
import { Button } from '../../../../ui/Button'
import { RatingSelector } from '../../../../ui/RatingSelector'
import type { ContentField } from '@services/moduleService'

const PIP_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le mode entry du module behavioral_activation
// (saisie d'une activité) précédé d'un récap "list mode" : tabs Liste/Mois, FAB +,
// 2 cartes d'activités mock. Source mobile : ActivityLogLayout.tsx.
export function ActivityLogLayout({ fields, t }: Props) {
  const ft = (type: string): string => {
    const f = fields.find(field => field.field_type === type)
    return f?.text_code ? t(f.text_code) : ''
  }

  const tabList = ft('activity_log_tab_list_label')
  const tabMonth = ft('activity_log_tab_month_label')
  const addBtn = ft('activity_log_add_btn')
  const dateLabel = ft('activity_log_date_label')
  const sectionActivity = ft('activity_log_section_activity_title')
  const sectionEvaluation = ft('activity_log_section_evaluation_title')
  const sectionNotes = ft('activity_log_section_notes_title')
  const activityPlaceholder = ft('activity_log_activity_placeholder')
  const pleasureLabel = ft('activity_log_pleasure_label')
  const pleasureSub = ft('activity_log_pleasure_sublabel')
  const masteryLabel = ft('activity_log_mastery_label')
  const masterySub = ft('activity_log_mastery_sublabel')
  const markDone = ft('activity_log_mark_done_label')
  const doneLabel = ft('activity_log_done_label')
  const saveLabel = ft('activity_log_save_label')

  const suggestions = fields
    .filter(f => f.field_type === 'activity_log_suggestion')
    .slice(0, 6)
    .map(f => (f.text_code ? t(f.text_code) : ''))
    .filter(Boolean)

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="al">
      {/* List mode header : tabs + FAB ────────────────────────────────── */}
      {(tabList || tabMonth) && (
        <div className="al-tabs">
          {tabList && (
            <span className="al-tab al-tab--active">
              <ListChecks size={14} />
              {tabList}
            </span>
          )}
          {tabMonth && (
            <span className="al-tab">
              <Calendar size={14} />
              {tabMonth}
            </span>
          )}
        </div>
      )}

      {/* Activités mock pour donner un aperçu de la liste ──────────────── */}
      <ul className="al-list">
        <li className="al-list__row al-list__row--done">
          <span className="al-list__check al-list__check--done">
            <Check size={14} />
          </span>
          <div className="al-list__info">
            <span className="al-list__title al-list__title--done">Marche en forêt</span>
            <span className="al-list__pills">
              <span className="al-list__pill">P 7</span>
              <span className="al-list__pill">M 5</span>
            </span>
          </div>
        </li>
        <li className="al-list__row">
          <span className="al-list__check"><Circle size={14} /></span>
          <div className="al-list__info">
            <span className="al-list__title">Yoga matinal</span>
            <span className="al-list__pills">
              <span className="al-list__pill">P 6</span>
              <span className="al-list__pill">M 4</span>
            </span>
          </div>
        </li>
      </ul>

      {addBtn && (
        <div className="al-fab">
          <Plus size={20} />
          <span>{addBtn}</span>
        </div>
      )}

      {/* Entry mode ───────────────────────────────────────────────────── */}
      <div className="al-entry">
        {dateLabel && (
          <div className="al-entry__date">
            <Calendar size={14} />
            <span className="al-entry__date-label">{dateLabel}</span>
            <span className="al-entry__date-value">{todayLabel}</span>
          </div>
        )}

        {sectionActivity && (
          <section className="al-section">
            <span className="al-section__title">{sectionActivity}</span>
            <div className="al-section__card">
              <div className="al-text-input" data-placeholder={activityPlaceholder} />
              {suggestions.length > 0 && (
                <div className="al-chips">
                  {suggestions.map(s => (
                    <span key={s} className="al-chip">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {(markDone || doneLabel) && (
          <div className="al-toggle-row">
            <Circle size={20} className="al-toggle-row__icon" />
            <span className="al-toggle-row__label">{markDone || doneLabel}</span>
          </div>
        )}

        {sectionEvaluation && (
          <section className="al-section">
            <span className="al-section__title">{sectionEvaluation}</span>
            <div className="al-section__card">
              <PipScale label={pleasureLabel} sublabel={pleasureSub} value={7} />
              <div className="al-divider" />
              <PipScale label={masteryLabel} sublabel={masterySub} value={5} />
            </div>
          </section>
        )}

        {sectionNotes && (
          <section className="al-section">
            <span className="al-section__title">{sectionNotes}</span>
            <div className="al-section__card">
              <div className="al-textarea" />
            </div>
          </section>
        )}

        {saveLabel && (
          <Button type="button" variant="primary" fullWidth disabled icon={<Check size={16} />}>
            {saveLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

interface PipScaleProps {
  label: string
  sublabel?: string
  value: number
}

function PipScale({ label, sublabel, value }: PipScaleProps) {
  if (!label) return null
  return (
    <RatingSelector
      variant="track"
      label={label}
      sublabel={sublabel}
      value={value}
      steps={PIP_STEPS}
      valueSuffix="/10"
    />
  )
}
