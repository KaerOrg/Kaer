import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { AppointmentModal } from '../../../components/features/AppointmentModal'
import {
  createAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment,
} from '@services/appointmentService'
import { patientQueries, agendaQueries } from '../../../hooks/queries'
import type { PatientOption } from '@services/patientService'
import type { AppointmentWithPatient, AppointmentStatus } from '../../../lib/calendar.types'

type Props = {
  patientId: string
  practitionerId: string
  practitionerName: string | undefined
  displayName: string
}

const EMPTY_APPTS: AppointmentWithPatient[] = []

export function PatientRdvTab({ patientId, practitionerId, practitionerName, displayName }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Réutilise la même query que le badge du parent (PatientPage) → déduplication.
  const appointmentsQuery = useQuery(patientQueries.appointments(practitionerId, patientId))
  const autoConfirmQuery = useQuery(agendaQueries.autoConfirm(practitionerId))
  const appointments = appointmentsQuery.data ?? EMPTY_APPTS
  const autoConfirm = autoConfirmQuery.data ?? true

  const [modal, setModal] = useState<{ type: 'create' | 'view'; appointment?: AppointmentWithPatient } | null>(null)

  const invalidateAppointments = useCallback(
    () => queryClient.invalidateQueries({ queryKey: patientQueries.appointments(practitionerId, patientId).queryKey }),
    [queryClient, practitionerId, patientId],
  )

  const patientOptions = useMemo<PatientOption[]>(
    () => [{ id: patientId, label: displayName }],
    [patientId, displayName],
  )

  const handleCreate = useCallback(
    async (pId: string, startsAt: string, endsAt: string, notes: string) => {
      const result = await createAppointment({
        practitioner_id: practitionerId,
        patient_id: pId,
        starts_at: startsAt,
        ends_at: endsAt,
        notes: notes || undefined,
        auto_confirm: autoConfirm,
      })
      if (result.ok) {
        await invalidateAppointments()
        setModal(null)
      }
      return result
    },
    [practitionerId, autoConfirm, invalidateAppointments],
  )

  const handleUpdateStatus = useCallback(
    async (apptId: string, status: AppointmentStatus) => {
      const result = await updateAppointmentStatus(apptId, status)
      if (result.ok) {
        await invalidateAppointments()
        setModal(null)
      }
      return result
    },
    [invalidateAppointments],
  )

  const handleUpdateNotes = useCallback(
    async (apptId: string, notes: string) => {
      const result = await updateAppointmentNotes(apptId, notes)
      if (result.ok) {
        await invalidateAppointments()
      }
      return result
    },
    [invalidateAppointments],
  )

  const handleReschedule = useCallback(
    async (apptId: string, newStartsAt: string, newEndsAt: string) => {
      const result = await rescheduleAppointment(apptId, newStartsAt, newEndsAt)
      if (result.ok) {
        await invalidateAppointments()
        setModal(null)
      }
      return result
    },
    [invalidateAppointments],
  )

  if (!appointmentsQuery.isSuccess) return null

  const now = new Date().toISOString()
  const upcoming = appointments.filter(
    a => a.starts_at > now &&
      a.status !== 'cancelled_by_patient' &&
      a.status !== 'cancelled_by_practitioner',
  )
  const past = appointments.filter(
    a => a.starts_at <= now ||
      a.status === 'cancelled_by_patient' ||
      a.status === 'cancelled_by_practitioner',
  )

  return (
    <div className="patient-rdv">
      <div className="patient-rdv__header">
        <Button variant="primary" size="sm" onClick={() => setModal({ type: 'create' })}>
          {t('patient.rdv_new')}
        </Button>
      </div>

      <section className="patient-rdv__section">
        <h3 className="patient-rdv__section-title">{t('patient.rdv_upcoming')}</h3>
        {upcoming.length === 0 ? (
          <p className="patient-rdv__empty">{t('patient.rdv_empty_upcoming')}</p>
        ) : (
          <ul className="patient-rdv__list">
            {upcoming.map(appt => (
              <li
                key={appt.id}
                className="patient-rdv__item"
                onClick={() => setModal({ type: 'view', appointment: appt })}
              >
                <span className="patient-rdv__item-date">
                  {new Date(appt.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </span>
                <StatusBadge
                  variant={appt.status === 'confirmed' ? 'success' : 'warning'}
                  label={t(`agenda.appointment.status_${appt.status.replace('cancelled_by_patient', 'cancelled').replace('cancelled_by_practitioner', 'cancelled')}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="patient-rdv__section">
        <h3 className="patient-rdv__section-title">{t('patient.rdv_past')}</h3>
        {past.length === 0 ? (
          <p className="patient-rdv__empty">{t('patient.rdv_empty_past')}</p>
        ) : (
          <ul className="patient-rdv__list">
            {past.map(appt => (
              <li
                key={appt.id}
                className="patient-rdv__item"
                onClick={() => setModal({ type: 'view', appointment: appt })}
              >
                <span className="patient-rdv__item-date">
                  {new Date(appt.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </span>
                <StatusBadge
                  variant={
                    appt.status === 'completed' ? 'neutral' :
                    appt.status === 'confirmed' ? 'success' :
                    appt.status === 'pending' ? 'warning' : 'danger'
                  }
                  label={t(`agenda.appointment.status_${appt.status.replace('cancelled_by_patient', 'cancelled').replace('cancelled_by_practitioner', 'cancelled')}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && (
        <AppointmentModal
          mode={modal.type}
          startsAt={null}
          endsAt={null}
          appointment={modal.appointment ?? null}
          patients={patientOptions}
          defaultPatientId={patientId}
          practitionerName={practitionerName}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNotes={handleUpdateNotes}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  )
}
