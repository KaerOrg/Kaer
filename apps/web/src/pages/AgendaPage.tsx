import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings2, CalendarPlus } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button/Button'
import { WeekGrid } from '../components/WeekGrid'
import { AvailabilityEditor } from '../components/AvailabilityEditor'
import { AppointmentModal } from '../components/AppointmentModal'
import { SearchInput } from '../components/SearchInput'
import { useAuthStore } from '../store/authStore'
import {
  fetchAvailabilityRules,
  saveAvailabilityRule,
  deleteAvailabilityRule,
  fetchExceptions,
  fetchAppointmentsForWeek,
  createAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  fetchAutoConfirmSetting,
  saveAutoConfirmSetting,
} from '../services/appointmentService'
import { fetchPatientOptions } from '../services/patientService'
import type {
  AvailabilityRule,
  AvailabilityException,
  AppointmentWithPatient,
  AppointmentStatus,
} from '../lib/calendar.types'
import type { PatientOption } from '../services/patientService'
import './AgendaPage.css'

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatWeekLabel(monday: Date, t: (key: string) => string): string {
  const sunday = addDays(monday, 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return t('agenda.week_of')
    .replace('{{start}}', fmt(monday))
    .replace('{{end}}', fmt(sunday))
}

type ModalState =
  | { type: 'none' }
  | { type: 'create'; startsAt: string | null; endsAt: string | null; slotDuration: number }
  | { type: 'view'; appointment: AppointmentWithPatient }

export function AgendaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { practitioner } = useAuthStore()

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()))
  const [showEditor, setShowEditor] = useState(false)

  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [filterQuery, setFilterQuery] = useState<string>('')

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])

  const filteredAppointments = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return appointments
    return appointments.filter(a =>
      a.patient_display_name.toLowerCase().includes(q),
    )
  }, [appointments, filterQuery])

  const loadWeek = useCallback(async (pId: string, monday: Date) => {
    const from = toDateString(monday)
    const to = toDateString(addDays(monday, 6))
    const [r, exc, appts] = await Promise.all([
      fetchAvailabilityRules(pId),
      fetchExceptions(pId, from, to),
      fetchAppointmentsForWeek(pId, from, to),
    ])
    setRules(r)
    setExceptions(exc)
    setAppointments(appts)
  }, [])

  useEffect(() => {
    if (!practitioner) return
    setLoading(true)
    Promise.all([
      loadWeek(practitioner.id, weekStart),
      fetchPatientOptions(practitioner.id),
      fetchAutoConfirmSetting(practitioner.id),
    ]).then(([, opts, autoC]) => {
      setPatients(opts)
      setAutoConfirm(autoC)
      setLoading(false)
    })
  }, [practitioner, weekStart, loadWeek])

  const goToToday = useCallback(() => setWeekStart(getMondayOfWeek(new Date())), [])
  const prevWeek = useCallback(() => setWeekStart(d => addDays(d, -7)), [])
  const nextWeek = useCallback(() => setWeekStart(d => addDays(d, 7)), [])

  const handleAddRule = useCallback(
    async (rule: Omit<AvailabilityRule, 'id' | 'created_at'>) => {
      const result = await saveAvailabilityRule(rule)
      if (result.ok && practitioner) {
        setRules(prev => [...prev, result.data!])
      }
    },
    [practitioner],
  )

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    await deleteAvailabilityRule(ruleId)
    setRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  const handleToggleAutoConfirm = useCallback(
    async (value: boolean) => {
      if (!practitioner) return
      await saveAutoConfirmSetting(practitioner.id, value)
      setAutoConfirm(value)
    },
    [practitioner],
  )

  const handleSlotClick = useCallback(
    (startsAt: string, endsAt: string, slotDuration: number) => {
      setModal({ type: 'create', startsAt, endsAt, slotDuration })
    },
    [],
  )

  const handleAppointmentClick = useCallback((appointment: AppointmentWithPatient) => {
    setModal({ type: 'view', appointment })
  }, [])

  const handleCreate = useCallback(
    async (patientId: string, startsAt: string, endsAt: string, notes: string) => {
      if (!practitioner) return { ok: false }
      const result = await createAppointment({
        practitioner_id: practitioner.id,
        patient_id: patientId,
        starts_at: startsAt,
        ends_at: endsAt,
        notes: notes || undefined,
      })
      if (result.ok) {
        await loadWeek(practitioner.id, weekStart)
        setModal({ type: 'none' })
      }
      return result
    },
    [practitioner, weekStart, loadWeek],
  )

  const handleUpdateStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const result = await updateAppointmentStatus(id, status)
      if (result.ok && practitioner) {
        await loadWeek(practitioner.id, weekStart)
        setModal({ type: 'none' })
      }
      return result
    },
    [practitioner, weekStart, loadWeek],
  )

  const handleUpdateNotes = useCallback(
    async (id: string, notes: string) => {
      const result = await updateAppointmentNotes(id, notes)
      if (result.ok && practitioner) {
        await loadWeek(practitioner.id, weekStart)
      }
      return result
    },
    [practitioner, weekStart, loadWeek],
  )

  const modalStartsAt = modal.type === 'create' ? modal.startsAt : null
  const modalEndsAt = modal.type === 'create' ? modal.endsAt : null
  const modalAppointment = modal.type === 'view' ? modal.appointment : null

  return (
    <Layout>
      <div className="agenda-page">
        <div className="agenda-page__header">
          <div className="agenda-page__header-left">
            <h1>{t('agenda.title')}</h1>
            <p>{t('agenda.subtitle')}</p>
          </div>
          <div className="agenda-page__header-right">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal({ type: 'create', startsAt: null, endsAt: null, slotDuration: 50 })}
            >
              <CalendarPlus size={15} style={{ marginRight: 6 }} />
              {t('agenda.appointment.new')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditor(v => !v)}
            >
              <Settings2 size={15} style={{ marginRight: 6 }} />
              {t('agenda.configure')}
            </Button>
          </div>
        </div>

        {/* Week navigation */}
        <div className="agenda-page__week-nav">
          <button className="agenda-page__nav-btn" onClick={prevWeek} title={t('agenda.prev_week')}>
            ←
          </button>
          <span className="agenda-page__week-label">
            {formatWeekLabel(weekStart, t)}
          </span>
          <button className="agenda-page__nav-btn" onClick={nextWeek} title={t('agenda.next_week')}>
            →
          </button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            {t('agenda.today')}
          </Button>

          <div className="agenda-page__patient-filter">
            <SearchInput
              value={filterQuery}
              onChange={setFilterQuery}
              placeholder={t('agenda.filter_patient_label')}
            />
          </div>
        </div>

        {loading ? (
          <div className="agenda-page__loading">{t('common.loading')}</div>
        ) : (
          <div className="agenda-page__layout">
            <div className="agenda-page__grid-area">
              <WeekGrid
                weekStart={weekStart}
                rules={rules}
                exceptions={exceptions}
                appointments={filteredAppointments}
                onSlotClick={handleSlotClick}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>

            {showEditor && practitioner && (
              <AvailabilityEditor
                rules={rules}
                autoConfirm={autoConfirm}
                onAddRule={handleAddRule}
                onDeleteRule={handleDeleteRule}
                onToggleAutoConfirm={handleToggleAutoConfirm}
                practitionerId={practitioner.id}
              />
            )}
          </div>
        )}
      </div>

      {modal.type !== 'none' && (
        <AppointmentModal
          mode={modal.type}
          startsAt={modalStartsAt}
          endsAt={modalEndsAt}
          appointment={modalAppointment}
          patients={patients}
          practitionerName={practitioner?.name ?? undefined}
          onClose={() => setModal({ type: 'none' })}
          onCreate={handleCreate}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNotes={handleUpdateNotes}
          onNavigateToPatient={patientId => navigate(`/patient/${patientId}`)}
        />
      )}
    </Layout>
  )
}
