import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '../Button/Button'
import type { AppointmentWithPatient, AppointmentStatus } from '../../lib/calendar.types'
import type { PatientOption } from '../../services/patientService'
import './AppointmentModal.css'

type Mode = 'create' | 'view'

interface AppointmentModalProps {
  mode: Mode
  startsAt: string | null
  endsAt: string | null
  appointment: AppointmentWithPatient | null
  patients: PatientOption[]
  autoConfirm: boolean
  onClose: () => void
  onCreate: (patientId: string, startsAt: string, endsAt: string, notes: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<{ ok: boolean }>
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const d1 = new Date(startsAt)
  const d2 = new Date(endsAt)
  const dateStr = d1.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const t1 = `${d1.getHours().toString().padStart(2, '0')}:${d1.getMinutes().toString().padStart(2, '0')}`
  const t2 = `${d2.getHours().toString().padStart(2, '0')}:${d2.getMinutes().toString().padStart(2, '0')}`
  return `${dateStr} · ${t1} – ${t2}`
}

export function AppointmentModal({
  mode,
  startsAt,
  endsAt,
  appointment,
  patients,
  autoConfirm,
  onClose,
  onCreate,
  onUpdateStatus,
}: AppointmentModalProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patientRef = useRef<HTMLSelectElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  async function handleCreate() {
    const patientId = patientRef.current?.value
    if (!patientId) {
      setError(t('agenda.appointment.error_no_patient'))
      return
    }
    setSaving(true)
    setError(null)
    const result = await onCreate(patientId, startsAt!, endsAt!, notesRef.current?.value ?? '')
    setSaving(false)
    if (!result.ok) {
      setError(t('agenda.appointment.error_create'))
    }
  }

  async function handleStatus(status: AppointmentStatus) {
    if (!appointment) return
    setSaving(true)
    await onUpdateStatus(appointment.id, status)
    setSaving(false)
  }

  const statusKey = appointment?.status ?? 'pending'
  const isActive = statusKey === 'pending' || statusKey === 'confirmed'

  return (
    <div className="appointment-modal-overlay" onClick={onClose}>
      <div className="appointment-modal" onClick={e => e.stopPropagation()}>
        <div className="appointment-modal__header">
          <h2 className="appointment-modal__title">
            {mode === 'create' ? t('agenda.appointment.title_new') : t('agenda.appointment.title_view')}
          </h2>
          <button className="appointment-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="appointment-modal__body">
          {/* Time info */}
          {(startsAt && endsAt) && (
            <div className="appointment-modal__field">
              <div className="appointment-modal__time-info">
                {formatTimeRange(startsAt, endsAt)}
              </div>
            </div>
          )}
          {appointment && !startsAt && (
            <div className="appointment-modal__field">
              <div className="appointment-modal__time-info">
                {formatTimeRange(appointment.starts_at, appointment.ends_at)}
              </div>
            </div>
          )}

          {/* View mode — patient name + status */}
          {mode === 'view' && appointment && (
            <>
              <div className="appointment-modal__field">
                <span className="appointment-modal__label">{t('agenda.appointment.patient_label')}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{appointment.patient_display_name}</span>
              </div>
              <div className="appointment-modal__field">
                <span
                  className={`appointment-modal__status appointment-modal__status--${statusKey}`}
                >
                  {t(`agenda.appointment.status_${statusKey.replace('cancelled_by_patient', 'cancelled').replace('cancelled_by_practitioner', 'cancelled')}`)}
                </span>
              </div>
              {appointment.notes && (
                <div className="appointment-modal__field">
                  <span className="appointment-modal__label">{t('agenda.appointment.notes_label')}</span>
                  <span style={{ fontSize: 14 }}>{appointment.notes}</span>
                </div>
              )}
            </>
          )}

          {/* Create mode — patient selector + notes */}
          {mode === 'create' && (
            <>
              <div className="appointment-modal__field">
                <label className="appointment-modal__label" htmlFor="appt-patient">
                  {t('agenda.appointment.patient_label')}
                </label>
                <select
                  id="appt-patient"
                  ref={patientRef}
                  className="appointment-modal__select"
                  defaultValue=""
                >
                  <option value="" disabled>{t('agenda.appointment.patient_placeholder')}</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="appointment-modal__field">
                <label className="appointment-modal__label" htmlFor="appt-notes">
                  {t('agenda.appointment.notes_label')}
                </label>
                <textarea
                  id="appt-notes"
                  ref={notesRef}
                  className="appointment-modal__textarea"
                  placeholder={t('agenda.appointment.notes_placeholder')}
                />
              </div>
              {!autoConfirm && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {t('agenda.editor.auto_confirm_hint')} — désactivé, le RDV sera en attente de confirmation.
                </p>
              )}
            </>
          )}
        </div>

        {error && <p className="appointment-modal__error">{error}</p>}

        <div className="appointment-modal__footer">
          {mode === 'create' ? (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleCreate}>
                {t('agenda.appointment.create_btn')}
              </Button>
            </>
          ) : (
            <>
              {isActive && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={saving}
                  onClick={() => handleStatus('cancelled_by_practitioner')}
                >
                  {t('agenda.appointment.cancel_btn')}
                </Button>
              )}
              {statusKey === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onClick={() => handleStatus('confirmed')}
                >
                  {t('agenda.appointment.confirm_btn')}
                </Button>
              )}
              {statusKey === 'confirmed' && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={saving}
                  onClick={() => handleStatus('completed')}
                >
                  {t('agenda.appointment.complete_btn')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.close')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
