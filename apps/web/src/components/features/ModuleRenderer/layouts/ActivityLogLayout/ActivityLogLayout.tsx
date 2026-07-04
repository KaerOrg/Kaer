import { Calendar, CalendarRange, Check, Circle, Clock, Lightbulb, ListChecks, Plus } from 'lucide-react'
import { Button } from '@ui/Button'
import { ActivityLogPipScale } from './ActivityLogPipScale'
import type { ContentField } from '@services/moduleService'

interface Props {
  fields: ContentField[]
  t: (key: string) => string
}

// Aperçu fidèle au mobile : tabs Semaine/Liste + cartes mock, puis le formulaire
// de planification (statut explicite « Je la prévois / Je l'ai déjà faite »,
// prédiction optionnelle repliée) et la feuille d'évaluation ouverte au moment
// de cocher réalisée (« C'était comment ? »). Les libellés sont lus depuis les
// props du field `activity_log_config` (même contrat que le mobile).
// Source mobile : ActivityLog/{EntryForm,CompletionSheet}.tsx.
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
  const sectionNotes = lbl('section_notes_title')
  const activityPlaceholder = lbl('activity_placeholder')
  const pleasureLabel = lbl('pleasure_label')
  const pleasureSub = lbl('pleasure_sublabel')
  const masteryLabel = lbl('mastery_label')
  const masterySub = lbl('mastery_sublabel')
  const expectedShort = lbl('expected_short_label')
  const feltShort = lbl('felt_short_label')
  const statusPlanned = lbl('status_planned_label')
  const statusDone = lbl('status_done_label')
  const predictionToggle = lbl('prediction_toggle_label')
  const completionTitle = lbl('completion_title')
  const completionSkip = lbl('completion_skip_label')
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

      {/* Formulaire de planification ────────────────────────────────────── */}
      <div className="al-entry">
        {(statusPlanned || statusDone) && (
          <div className="al-tabs">
            {statusPlanned && (
              <span className="al-tab al-tab--active">
                <Circle size={14} />
                {statusPlanned}
              </span>
            )}
            {statusDone && (
              <span className="al-tab">
                <Check size={14} />
                {statusDone}
              </span>
            )}
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

        {/* Prédiction optionnelle : repliée par défaut, jamais imposée */}
        {predictionToggle && (
          <div className="al-entry__date">
            <Lightbulb size={14} />
            <span className="al-entry__date-label">{predictionToggle}</span>
          </div>
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

      {/* Feuille d'évaluation à la complétion (« C'était comment ? ») ───── */}
      {completionTitle && (
        <div className="al-entry">
          <section className="al-section">
            <span className="al-section__title">{completionTitle}</span>
            <div className="al-section__card">
              {expectedShort && (
                <span className="al-completion__recap">{expectedShort} · P 6 · A 4</span>
              )}
              <ActivityLogPipScale label={pleasureLabel} sublabel={pleasureSub} value={7} />
              <div className="al-divider" />
              <ActivityLogPipScale label={masteryLabel} sublabel={masterySub} value={5} />
              {saveLabel && (
                <Button type="button" variant="primary" fullWidth disabled icon={<Check size={16} />}>
                  {saveLabel}
                </Button>
              )}
              {completionSkip && (
                <Button type="button" variant="ghost" size="sm" fullWidth disabled>
                  {completionSkip}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
