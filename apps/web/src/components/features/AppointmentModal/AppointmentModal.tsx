import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, FileText, ExternalLink } from 'lucide-react'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button/Button'
import { StatusBadge } from '../../ui/StatusBadge'
import { useToast } from '../../../contexts/ToastContext'
import type { StatusBadgeVariant } from '../../ui/StatusBadge/StatusBadge.types'
import type { AppointmentWithPatient, AppointmentStatus } from '../../../lib/calendar.types'
import type { PatientOption } from '../../../services/patientService'
import './AppointmentModal.css'

type Mode = 'create' | 'view'

interface AppointmentModalProps {
  mode: Mode
  startsAt: string | null
  endsAt: string | null
  appointment: AppointmentWithPatient | null
  patients: PatientOption[]
  defaultPatientId?: string
  practitionerName?: string
  onClose: () => void
  onCreate: (patientId: string, startsAt: string, endsAt: string, notes: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<{ ok: boolean }>
  onUpdateNotes?: (id: string, notes: string) => Promise<{ ok: boolean }>
  onReschedule?: (id: string, newStartsAt: string, newEndsAt: string) => Promise<{ ok: boolean; error?: string }>
  onNavigateToPatient?: (patientId: string) => void
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nextFullHour(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function addMinutes(isoLocal: string, minutes: number): string {
  const d = new Date(isoLocal)
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTimeSlot(startsAt: string, endsAt: string): string {
  const d1 = new Date(startsAt)
  const d2 = new Date(endsAt)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const t1 = `${pad(d1.getHours())}:${pad(d1.getMinutes())}`
  const t2 = `${pad(d2.getHours())}:${pad(d2.getMinutes())}`
  const diffMin = Math.round((d2.getTime() - d1.getTime()) / 60000)
  return `${t1} – ${t2} · ${diffMin} min`
}

const STATUS_VARIANT: Record<AppointmentStatus, StatusBadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled_by_patient: 'neutral',
  cancelled_by_practitioner: 'neutral',
  completed: 'info',
}

function statusI18nKey(status: AppointmentStatus): string {
  if (status === 'cancelled_by_patient' || status === 'cancelled_by_practitioner') return 'cancelled'
  return status
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  return (
    <div
      className="appt-avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </div>
  )
}

export function AppointmentModal({
  mode,
  startsAt,
  endsAt,
  appointment,
  patients,
  defaultPatientId,
  practitionerName,
  onClose,
  onCreate,
  onUpdateStatus,
  onUpdateNotes,
  onReschedule,
  onNavigateToPatient,
}: AppointmentModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)

  // Note éditable en mode view
  const [noteText, setNoteText] = useState(appointment?.notes ?? '')
  const notesDirty = noteText !== (appointment?.notes ?? '')

  // Autocomplete patient (mode create)
  const [query, setQuery] = useState<string>(() => {
    if (defaultPatientId) return patients.find(p => p.id === defaultPatientId)?.label ?? ''
    return ''
  })
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId ?? '')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)
  const rescheduleStartRef = useRef<HTMLInputElement>(null)
  const rescheduleEndRef = useRef<HTMLInputElement>(null)

  const filteredPatients = query.length === 0
    ? patients
    : patients.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    setIsRescheduling(false)
  }, [appointment?.id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const defaultStart = startsAt ?? nextFullHour()
  const defaultEnd = endsAt ?? addMinutes(defaultStart, 50)

  function handleSelectPatient(p: PatientOption) {
    setSelectedPatientId(p.id)
    setQuery(p.label)
    setDropdownOpen(false)
    setFocusedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setDropdownOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min(i + 1, filteredPatients.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && filteredPatients[focusedIndex]) {
        handleSelectPatient(filteredPatients[focusedIndex])
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  async function handleCreate() {
    const patientId = selectedPatientId
    if (!patientId) { toast.error(t('agenda.appointment.error_no_patient')); return }
    const start = startsAt ?? startInputRef.current?.value
    const end = endsAt ?? endInputRef.current?.value
    if (!start || !end) { toast.error(t('agenda.appointment.error_no_date')); return }
    if (start >= end) { toast.error(t('agenda.appointment.error_date_order')); return }
    setSaving(true)
    const result = await onCreate(patientId, start, end, notesRef.current?.value ?? '')
    setSaving(false)
    if (!result.ok) toast.error(t('agenda.appointment.error_create'))
  }

  async function handleStatus(status: AppointmentStatus) {
    if (!appointment) return
    setSaving(true)
    const result = await onUpdateStatus(appointment.id, status)
    setSaving(false)
    if (!result.ok) toast.error(t('agenda.appointment.error_update_status'))
  }

  const rescheduleDefaults = useMemo(() => ({
    start: appointment ? toDatetimeLocal(appointment.starts_at) : nextFullHour(),
    end: appointment ? toDatetimeLocal(appointment.ends_at) : addMinutes(nextFullHour(), 50),
  }), [appointment])

  const handleRescheduleSave = useCallback(async () => {
    if (!appointment || !onReschedule) return
    const newStart = rescheduleStartRef.current?.value
    const newEnd = rescheduleEndRef.current?.value
    if (!newStart || !newEnd) { toast.error(t('agenda.appointment.error_no_date')); return }
    if (newStart >= newEnd) { toast.error(t('agenda.appointment.error_date_order')); return }
    setSaving(true)
    const result = await onReschedule(appointment.id, newStart, newEnd)
    setSaving(false)
    if (result.ok) {
      toast.success(t('agenda.appointment.reschedule_success'))
      onClose()
    } else {
      toast.error(t('agenda.appointment.error_reschedule'))
    }
  }, [appointment, onReschedule, t, toast, onClose])

  const handleSaveNotes = useCallback(async () => {
    if (!appointment || !onUpdateNotes) return
    setSavingNotes(true)
    const result = await onUpdateNotes(appointment.id, noteText)
    setSavingNotes(false)
    if (result.ok) {
      toast.success(t('agenda.appointment.notes_saved'))
    } else {
      toast.error(t('agenda.appointment.error_save_notes'))
    }
  }, [appointment, onUpdateNotes, noteText, t, toast])

  const statusKey = appointment?.status ?? 'pending'
  const isActive = statusKey === 'pending' || statusKey === 'confirmed'

  const footer = mode === 'create' ? (
    <>
      <Button variant="ghost" size="sm" onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button variant="primary" size="sm" loading={saving} onClick={() => void handleCreate()}>
        {t('agenda.appointment.create_btn')}
      </Button>
    </>
  ) : isRescheduling ? (
    <div className="appt-footer-layout">
      <div className="appt-footer-left">
        <Button variant="ghost" size="sm" onClick={() => setIsRescheduling(false)}>
          {t('agenda.appointment.reschedule_back')}
        </Button>
      </div>
      <div className="appt-footer-right">
        <Button variant="primary" size="sm" loading={saving} onClick={() => void handleRescheduleSave()}>
          {t('agenda.appointment.reschedule_save')}
        </Button>
      </div>
    </div>
  ) : (
    <div className="appt-footer-layout">
      <div className="appt-footer-left">
        {isActive && (
          <Button variant="danger" size="sm" loading={saving} onClick={() => void handleStatus('cancelled_by_practitioner')}>
            {t('agenda.appointment.cancel_btn')}
          </Button>
        )}
      </div>
      <div className="appt-footer-right">
        {notesDirty && onUpdateNotes && (
          <Button variant="secondary" size="sm" loading={savingNotes} onClick={() => void handleSaveNotes()}>
            {t('common.save')}
          </Button>
        )}
        {isActive && onReschedule && (
          <Button variant="secondary" size="sm" onClick={() => setIsRescheduling(true)}>
            {t('agenda.appointment.reschedule_btn')}
          </Button>
        )}
        {statusKey === 'pending' && (
          <Button variant="primary" size="sm" loading={saving} onClick={() => void handleStatus('confirmed')}>
            {t('agenda.appointment.confirm_btn')}
          </Button>
        )}
      </div>
    </div>
  )

  const modalTitle = mode === 'create'
    ? t('agenda.appointment.title_new')
    : isRescheduling
      ? t('agenda.appointment.reschedule_title')
      : t('agenda.appointment.title_view')

  return (
    <Modal
      title={modalTitle}
      onClose={onClose}
      footer={footer}
      maxWidth={isRescheduling ? 500 : undefined}
    >
      {/* ── Mode reprogrammation ───────────────────────────────── */}
      {mode === 'view' && isRescheduling && appointment && (
        <div className="appt-reschedule-form">
          <div className="appt-datetime-row">
            <div className="appt-field">
              <label className="appt-label" htmlFor="appt-reschedule-start">{t('agenda.appointment.date_start')}</label>
              <input
                id="appt-reschedule-start"
                ref={rescheduleStartRef}
                type="datetime-local"
                className="appt-input"
                defaultValue={rescheduleDefaults.start}
                autoComplete="off"
              />
            </div>
            <div className="appt-field">
              <label className="appt-label" htmlFor="appt-reschedule-end">{t('agenda.appointment.date_end')}</label>
              <input
                id="appt-reschedule-end"
                ref={rescheduleEndRef}
                type="datetime-local"
                className="appt-input"
                defaultValue={rescheduleDefaults.end}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Mode visualisation ─────────────────────────────────── */}
      {mode === 'view' && !isRescheduling && appointment && (
        <>
          {/* Date card */}
          <div className="appt-date-card">
            <Calendar size={18} className="appt-date-card__icon" aria-hidden="true" />
            <div className="appt-date-card__text">
              <div className="appt-date-card__day">{formatDateLabel(appointment.starts_at)}</div>
              <div className="appt-date-card__slot">{formatTimeSlot(appointment.starts_at, appointment.ends_at)}</div>
            </div>
          </div>

          {/* Participants */}
          <div className="appt-section">
            <p className="appt-section-label">{t('agenda.appointment.participants_label')}</p>
            <div className="appt-participants-row">
              {onNavigateToPatient ? (
                <button
                  type="button"
                  className="appt-participant appt-participant--link"
                  onClick={() => { onNavigateToPatient(appointment.patient_public_ref); onClose() }}
                  title={t('agenda.appointment.view_patient_file')}
                >
                  <Avatar name={appointment.patient_display_name} size={34} />
                  <div className="appt-participant__info">
                    <div className="appt-participant__name">{appointment.patient_display_name}</div>
                    <div className="appt-participant__role">{t('agenda.appointment.role_patient')}</div>
                  </div>
                  <StatusBadge
                    variant={STATUS_VARIANT[statusKey]}
                    label={t(`agenda.appointment.status_${statusI18nKey(statusKey)}`)}
                  />
                  <ExternalLink size={14} className="appt-participant__link-icon" aria-hidden="true" />
                </button>
              ) : (
                <div className="appt-participant">
                  <Avatar name={appointment.patient_display_name} size={34} />
                  <div className="appt-participant__info">
                    <div className="appt-participant__name">{appointment.patient_display_name}</div>
                    <div className="appt-participant__role">{t('agenda.appointment.role_patient')}</div>
                  </div>
                  <StatusBadge
                    variant={STATUS_VARIANT[statusKey]}
                    label={t(`agenda.appointment.status_${statusI18nKey(statusKey)}`)}
                  />
                </div>
              )}
              {practitionerName && (
                <div className="appt-participant appt-participant--practitioner">
                  <Avatar name={practitionerName} size={34} />
                  <div className="appt-participant__info">
                    <div className="appt-participant__name">{practitionerName}</div>
                    <div className="appt-participant__role">{t('agenda.appointment.role_practitioner')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes éditables */}
          <div className="appt-section">
            <label className="appt-section-label" htmlFor="appt-view-notes">
              <FileText size={11} aria-hidden="true" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {t('agenda.appointment.notes_label')}
            </label>
            <textarea
              id="appt-view-notes"
              className="appt-textarea appt-textarea--view"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={t('agenda.appointment.notes_placeholder')}
              rows={3}
            />
          </div>
        </>
      )}

      {/* ── Mode création ──────────────────────────────────────── */}
      {mode === 'create' && (
        <>
          {startsAt && endsAt && (
            <div className="appt-date-card">
              <Calendar size={18} className="appt-date-card__icon" aria-hidden="true" />
              <div className="appt-date-card__text">
                <div className="appt-date-card__day">{formatDateLabel(startsAt)}</div>
                <div className="appt-date-card__slot">{formatTimeSlot(startsAt, endsAt)}</div>
              </div>
            </div>
          )}

          {!startsAt && (
            <div className="appt-datetime-row">
              <div className="appt-field">
                <label className="appt-label" htmlFor="appt-start">{t('agenda.appointment.date_start')}</label>
                <input
                  id="appt-start"
                  ref={startInputRef}
                  type="datetime-local"
                  className="appt-input"
                  defaultValue={defaultStart}
                  autoComplete="off"
                />
              </div>
              <div className="appt-field">
                <label className="appt-label" htmlFor="appt-end">{t('agenda.appointment.date_end')}</label>
                <input
                  id="appt-end"
                  ref={endInputRef}
                  type="datetime-local"
                  className="appt-input"
                  defaultValue={defaultEnd}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className="appt-field">
            <label className="appt-label" htmlFor="appt-patient">{t('agenda.appointment.patient_label')}</label>
            <div className="appt-autocomplete" ref={autocompleteRef}>
              <input
                id="appt-patient"
                type="text"
                className="appt-input appt-autocomplete__input"
                placeholder={t('agenda.appointment.patient_placeholder')}
                value={query}
                autoComplete="off"
                onChange={e => {
                  setQuery(e.target.value)
                  setSelectedPatientId('')
                  setDropdownOpen(true)
                  setFocusedIndex(-1)
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleKeyDown}
              />
              {dropdownOpen && filteredPatients.length > 0 && (
                <ul className="appt-autocomplete__dropdown" role="listbox">
                  {filteredPatients.map((p, i) => (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={p.id === selectedPatientId}
                      className={`appt-autocomplete__option${i === focusedIndex ? ' appt-autocomplete__option--focused' : ''}${p.id === selectedPatientId ? ' appt-autocomplete__option--selected' : ''}`}
                      onMouseDown={() => handleSelectPatient(p)}
                      onMouseEnter={() => setFocusedIndex(i)}
                    >
                      <Avatar name={p.label} size={26} />
                      <span>{p.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {dropdownOpen && query.length > 0 && filteredPatients.length === 0 && (
                <div className="appt-autocomplete__empty">{t('agenda.appointment.no_patients_found')}</div>
              )}
            </div>
          </div>

          <div className="appt-field">
            <label className="appt-label" htmlFor="appt-notes">{t('agenda.appointment.notes_label')}</label>
            <textarea
              id="appt-notes"
              ref={notesRef}
              className="appt-textarea"
              placeholder={t('agenda.appointment.notes_placeholder')}
            />
          </div>

          <p className="appt-hint">{t('agenda.appointment.practitioner_creates_hint')}</p>
        </>
      )}

    </Modal>
  )
}
