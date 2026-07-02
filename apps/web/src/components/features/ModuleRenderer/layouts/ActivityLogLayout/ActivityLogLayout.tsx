import { Calendar, CalendarRange, Check, Circle, Clock, ListChecks, Plus } from 'lucide-react'
import { Button } from '@ui/Button'
import { ActivityLogPipScale } from './ActivityLogPipScale'
import type { ContentField } from '@services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : reproduit le mode entry du module behavioral_activation
// (cycle prédire/faire/constater) précédé d'un récap "week/list mode" : tabs
// Semaine/Liste, 2 cartes d'activités mock, FAB +. Les libellés sont lus depuis
// les props du field `activity_log_config` (même contrat que le mobile).
// Source mobile : ActivityLogLayout.tsx (mobile).
export function ActivityLogLayout({ fields, t }: Props) {
  const configField = fields.find(f => f.field_type === 'activity_log_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const tabWeek = lbl('tab_week_label')
  const tabList = lbl('tab_list_label')
  const addBtn = lbl('add_btn')
  const dateLabel = lbl('date_label')
  const plannedTimeLabel = lbl('planned_time_label')
  const sectionActivity = lbl('section_activity_title')
  const sectionExpected = lbl('section_expected_title')
  const sectionNotes = lbl('section_notes_title')
  const activityPlaceholder = lbl('activity_placeholder')
  const pleasureLabel = lbl('pleasure_label')
  const pleasureSub = lbl('pleasure_sublabel')
  const masteryLabel = lbl('mastery_label')
  const masterySub = lbl('mastery_sublabel')
  const expectedShort = lbl('expected_short_label')
  const feltShort = lbl('felt_short_label')
  const markDone = lbl('mark_done_label')
  const saveLabel = lbl('save_label')

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
      {/* Week/list mode header : tabs + FAB ─────────────────────────────── */}
      {(tabWeek || tabList) && (
        <div className="al-tabs">
          {tabWeek && (
            <span className="al-tab al-tab--active">
              <CalendarRange size={14} />
              {tabWeek}
            </span>
          )}
          {tabList && (
            <span className="al-tab">
              <ListChecks size={14} />
              {tabList}
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
              {expectedShort && <span className="al-list__pill">{expectedShort} P 4 · M 3</span>}
              {feltShort && <span className="al-list__pill">{feltShort} P 7 · M 5</span>}
            </span>
          </div>
        </li>
        <li className="al-list__row">
          <span className="al-list__check"><Circle size={14} /></span>
          <div className="al-list__info">
            <span className="al-list__title">Yoga matinal</span>
            <span className="al-list__pills">
              <span className="al-list__pill"><Clock size={10} /> 18:00</span>
              {expectedShort && <span className="al-list__pill">{expectedShort} P 6 · M 4</span>}
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

        {plannedTimeLabel && (
          <div className="al-entry__date">
            <Clock size={14} />
            <span className="al-entry__date-label">{plannedTimeLabel}</span>
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

        {markDone && (
          <div className="al-toggle-row">
            <Circle size={20} className="al-toggle-row__icon" />
            <span className="al-toggle-row__label">{markDone}</span>
          </div>
        )}

        {sectionExpected && (
          <section className="al-section">
            <span className="al-section__title">{sectionExpected}</span>
            <div className="al-section__card">
              <ActivityLogPipScale label={pleasureLabel} sublabel={pleasureSub} value={7} />
              <div className="al-divider" />
              <ActivityLogPipScale label={masteryLabel} sublabel={masterySub} value={5} />
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
