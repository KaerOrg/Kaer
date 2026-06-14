import { useTranslation } from 'react-i18next'
import { Package2, FileText, CalendarDays, Clock } from 'lucide-react'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { Button } from '../../../components/ui/Button'
import { InputField } from '../../../components/ui/InputField'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleCategory } from '../../../services/moduleCatalogService'
import type { PractitionerNote } from '../../../services/noteService'

type Props = {
  modules: PatientModule[]
  categories: ModuleCategory[]
  notes: PractitionerNote[]
  appointmentsDoneCount: number
  patientEnrolledAt: string | null
  generalNote: string
  generalNoteSaving: boolean
  onGeneralNoteChange: (value: string) => void
  onSaveGeneralNote: () => void
  onNavigateToNotes: () => void
  onNavigateToModules: () => void
}

export function PatientOverviewTab({
  modules,
  categories,
  notes,
  appointmentsDoneCount,
  patientEnrolledAt,
  generalNote,
  generalNoteSaving,
  onGeneralNoteChange,
  onSaveGeneralNote,
  onNavigateToNotes,
  onNavigateToModules,
}: Props) {
  const { t, i18n } = useTranslation()

  return (
    <section className="patient-overview">
      <div className="patient-overview__stats">
        <div className="patient-overview__stat">
          <div className="patient-overview__stat-main">
            <span className="patient-overview__stat-value">{modules.length}</span>
            <Package2 size={20} className="patient-overview__stat-icon" />
          </div>
          <span className="patient-overview__stat-label">{t('patient.overview_active_modules')}</span>
        </div>
        <button className="patient-overview__stat patient-overview__stat--link" onClick={onNavigateToNotes}>
          <div className="patient-overview__stat-main">
            <span className="patient-overview__stat-value">{notes.length}</span>
            <FileText size={20} className="patient-overview__stat-icon" />
          </div>
          <span className="patient-overview__stat-label">{t('patient.tab_notes')}</span>
        </button>
        <div className="patient-overview__stat">
          <div className="patient-overview__stat-main">
            <span className="patient-overview__stat-value">{appointmentsDoneCount}</span>
            <CalendarDays size={20} className="patient-overview__stat-icon" />
          </div>
          <span className="patient-overview__stat-label">{t('patient.overview_rdv_done')}</span>
        </div>
        {patientEnrolledAt && (
          <div className="patient-overview__stat">
            <div className="patient-overview__stat-main">
              <span className="patient-overview__stat-value patient-overview__stat-value--date">
                {new Date(patientEnrolledAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <Clock size={20} className="patient-overview__stat-icon" />
            </div>
            <span className="patient-overview__stat-label">{t('patient.overview_enrolled_since')}</span>
          </div>
        )}
      </div>

      <div className="patient-overview__block">
        <div className="patient-overview__block-header">
          <h3 className="patient-overview__block-title">{t('patient.overview_add_note')}</h3>
        </div>
        <InputField
          multiline
          aria-label={t('patient.overview_add_note')}
          placeholder={t('notes.placeholder')}
          rows={4}
          value={generalNote}
          onChange={e => onGeneralNoteChange(e.target.value)}
        />
        <div className="patient-overview__note-form-actions">
          <Button size="sm" loading={generalNoteSaving} onClick={onSaveGeneralNote}>
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="patient-overview__row">
        <div className="patient-overview__block">
          <div className="patient-overview__block-header">
            <h3 className="patient-overview__block-title">{t('patient.overview_active_modules')}</h3>
            <button className="patient-overview__block-link" onClick={onNavigateToModules}>
              + {t('patient.tab_modules')}
            </button>
          </div>
          {modules.length === 0 ? (
            <p className="patient-overview__empty">{t('patient.overview_no_modules')}</p>
          ) : (
            <ul className="patient-overview__module-list">
              {modules.map(mod => {
                const catModule = categories.flatMap(c => c.modules).find(m => m.id === mod.module_type)
                const ModIcon = catModule ? LUCIDE_ICONS[catModule.icon] : undefined
                return (
                  <li key={mod.id} className="patient-overview__module-item">
                    <span className="patient-overview__module-icon">
                      {ModIcon ? <ModIcon size={14} /> : null}
                    </span>
                    <span className="patient-overview__module-name">
                      {t(`modules.${mod.module_type}.label`)}
                    </span>
                    <span className="patient-overview__module-date">
                      {t('patient.overview_unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="patient-overview__block">
          <div className="patient-overview__block-header">
            <h3 className="patient-overview__block-title">{t('patient.overview_recent_notes')}</h3>
            {notes.length > 3 && (
              <button className="patient-overview__block-link" onClick={onNavigateToNotes}>
                {t('patient.overview_see_all_notes')}
              </button>
            )}
          </div>
          {notes.length === 0 ? (
            <p className="patient-overview__empty">{t('patient.overview_no_notes')}</p>
          ) : (
            <ul className="patient-overview__notes-list">
              {notes.slice(0, 3).map(note => (
                <li key={note.id} className="patient-overview__note-item">
                  <p className="patient-overview__note-content">{note.content}</p>
                  <div className="patient-overview__note-meta">
                    {note.tags.length > 0 && (
                      <div className="patient-overview__note-tags">
                        {note.tags.map(tag => (
                          <span key={tag} className="patient-notes__tag patient-notes__tag--readonly">{tag}</span>
                        ))}
                      </div>
                    )}
                    <span className="patient-overview__note-date">
                      {new Date(note.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
