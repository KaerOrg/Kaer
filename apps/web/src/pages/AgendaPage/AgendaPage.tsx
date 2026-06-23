import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings2, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Layout } from '../../components/features/Layout'
import { Button } from '../../components/ui/Button/Button'
import { Tooltip } from '../../components/ui/Tooltip'
import { WeekGrid } from '../../components/features/WeekGrid'
import { AvailabilityEditor } from '../../components/features/AvailabilityEditor'
import { AppointmentModal } from '../../components/features/AppointmentModal'
import { SearchInput } from '../../components/ui/SearchInput'
import { useAuthStore } from '../../store/authStore'
import {
  saveAvailabilityRule,
  deleteAvailabilityRule,
  createAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment,
  saveAutoConfirmSetting,
} from '../../services/appointmentService'
import { agendaQueries } from '../../hooks/queries'
import type {
  AvailabilityRule,
  AvailabilityException,
  AppointmentWithPatient,
  AppointmentStatus,
} from '../../lib/calendar.types'
import type { PatientOption } from '../../services/patientService'
import './AgendaPage.css'

const EMPTY_RULES: AvailabilityRule[] = []
const EMPTY_EXCEPTIONS: AvailabilityException[] = []
const EMPTY_APPTS: AppointmentWithPatient[] = []
const EMPTY_PATIENTS: PatientOption[] = []

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
  const queryClient = useQueryClient()

  const practitionerId = practitioner?.id
  const { from, to } = useMemo(
    () => ({ from: toDateString(weekStart), to: toDateString(addDays(weekStart, 6)) }),
    [weekStart],
  )

  const rulesQuery = useQuery(agendaQueries.rules(practitionerId))
  const exceptionsQuery = useQuery(agendaQueries.exceptions(practitionerId, from, to))
  const appointmentsQuery = useQuery(agendaQueries.appointmentsForWeek(practitionerId, from, to))
  const patientsQuery = useQuery(agendaQueries.patientOptions(practitionerId))
  const autoConfirmQuery = useQuery(agendaQueries.autoConfirm(practitionerId))

  const rules = rulesQuery.data ?? EMPTY_RULES
  const exceptions = exceptionsQuery.data ?? EMPTY_EXCEPTIONS
  const appointments = appointmentsQuery.data ?? EMPTY_APPTS
  const patients = patientsQuery.data ?? EMPTY_PATIENTS
  const autoConfirm = autoConfirmQuery.data ?? true
  const loading =
    rulesQuery.isLoading || exceptionsQuery.isLoading || appointmentsQuery.isLoading ||
    patientsQuery.isLoading || autoConfirmQuery.isLoading

  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [filterQuery, setFilterQuery] = useState<string>('')

  const filteredAppointments = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return appointments
    return appointments.filter(a =>
      a.patient_display_name.toLowerCase().includes(q),
    )
  }, [appointments, filterQuery])

  // Recharge les RDV (et exceptions) de la semaine courante après une mutation.
  const invalidateWeek = useCallback(() => {
    if (!practitionerId) return Promise.resolve()
    return queryClient.invalidateQueries({
      queryKey: agendaQueries.appointmentsForWeek(practitionerId, from, to).queryKey,
    })
  }, [queryClient, practitionerId, from, to])

  const goToToday = useCallback(() => setWeekStart(getMondayOfWeek(new Date())), [])
  const prevWeek = useCallback(() => setWeekStart(d => addDays(d, -7)), [])
  const nextWeek = useCallback(() => setWeekStart(d => addDays(d, 7)), [])

  const handleAddRule = useCallback(
    async (rule: Omit<AvailabilityRule, 'id' | 'created_at'>) => {
      const result = await saveAvailabilityRule(rule)
      if (result.ok && practitionerId) {
        await queryClient.invalidateQueries({ queryKey: agendaQueries.rules(practitionerId).queryKey })
      }
    },
    [practitionerId, queryClient],
  )

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    await deleteAvailabilityRule(ruleId)
    if (practitionerId) {
      await queryClient.invalidateQueries({ queryKey: agendaQueries.rules(practitionerId).queryKey })
    }
  }, [practitionerId, queryClient])

  const handleToggleAutoConfirm = useCallback(
    async (value: boolean) => {
      if (!practitionerId) return
      await saveAutoConfirmSetting(practitionerId, value)
      queryClient.setQueryData(agendaQueries.autoConfirm(practitionerId).queryKey, value)
    },
    [practitionerId, queryClient],
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
        await invalidateWeek()
        setModal({ type: 'none' })
      }
      return result
    },
    [practitioner, invalidateWeek],
  )

  const handleUpdateStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      const result = await updateAppointmentStatus(id, status)
      if (result.ok) {
        await invalidateWeek()
        setModal({ type: 'none' })
      }
      return result
    },
    [invalidateWeek],
  )

  const handleUpdateNotes = useCallback(
    async (id: string, notes: string) => {
      const result = await updateAppointmentNotes(id, notes)
      if (result.ok) {
        await invalidateWeek()
      }
      return result
    },
    [invalidateWeek],
  )

  const handleReschedule = useCallback(
    async (id: string, newStartsAt: string, newEndsAt: string) => {
      const result = await rescheduleAppointment(id, newStartsAt, newEndsAt)
      if (result.ok) {
        await invalidateWeek()
        setModal({ type: 'none' })
      }
      return result
    },
    [invalidateWeek],
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
          <Tooltip label={t('agenda.prev_week')}>
            <Button variant="ghost" size="sm" onClick={prevWeek} aria-label={t('agenda.prev_week')} icon={<ChevronLeft size={18} />} />
          </Tooltip>
          <span className="agenda-page__week-label">
            {formatWeekLabel(weekStart, t)}
          </span>
          <Tooltip label={t('agenda.next_week')}>
            <Button variant="ghost" size="sm" onClick={nextWeek} aria-label={t('agenda.next_week')} icon={<ChevronRight size={18} />} />
          </Tooltip>
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
          onReschedule={handleReschedule}
          onNavigateToPatient={publicRef => navigate(`/patient/${publicRef}`)}
        />
      )}
    </Layout>
  )
}
