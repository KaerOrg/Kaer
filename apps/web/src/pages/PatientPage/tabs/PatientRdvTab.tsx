import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { AppointmentModal } from '../../../components/features/AppointmentModal'
import {
  fetchAppointmentsForPatient,
  createAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  fetchAutoConfirmSetting,
} from '../../../services/appointmentService'
import type { PatientOption } from '../../../services/patientService'
import type { AppointmentWithPatient, AppointmentStatus } from '../../../lib/calendar.types'

type Props = {
  patientId: string
  practitionerId: string
  practitionerName: string | undefined
  displayName: string
}

export function PatientRdvTab({ patientId, practitionerId, practitionerName, displayName }: Props) {
  const { t } = useTranslation()

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loaded, setLoaded] = useState(false)
  const [modal, setModal] = useState<{ type: 'create' | 'view'; appointment?: AppointmentWithPatient } | null>(null)
  const [autoConfirm, setAutoConfirm] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAppointmentsForPatient(practitionerId, patientId),
      fetchAutoConfirmSetting(practitionerId),
    ]).then(([appts, autoC]) => {
      setAppointments(appts)
      setAutoConfirm(autoC)
      setLoaded(true)
    })
  }, [practitionerId, patientId])

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
        const updated = await fetchAppointmentsForPatient(practitionerId, patientId)
        setAppointments(updated)
        setModal(null)
      }
      return result
    },
    [practitionerId, patientId, autoConfirm],
  )

  const handleUpdateStatus = useCallback(
    async (apptId: string, status: AppointmentStatus) => {
      const result = await updateAppointmentStatus(apptId, status)
      if (result.ok) {
        const updated = await fetchAppointmentsForPatient(practitionerId, patientId)
        setAppointments(updated)
        setModal(null)
      }
      return result
    },
    [practitionerId, patientId],
  )

  const handleUpdateNotes = useCallback(
    async (apptId: string, notes: string) => {
      const result = await updateAppointmentNotes(apptId, notes)
      if (result.ok) {
        const updated = await fetchAppointmentsForPatient(practitionerId, patientId)
        setAppointments(updated)
      }
      return result
    },
    [practitionerId, patientId],
  )

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

  if (!loaded) return null

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
        />
      )}
    </div>
  )
}
