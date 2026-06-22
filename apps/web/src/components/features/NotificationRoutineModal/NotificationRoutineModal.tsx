import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Bell, BellOff, Loader, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { InputField } from '../../ui/InputField'
import { TimePicker } from '../../ui/TimePicker'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import {
  getRoutinesForPatientModule,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from '../../../services/notificationRoutineService'
import type { NotificationRoutine } from '../../../lib/database.types'
import './NotificationRoutineModal.css'

interface Props {
  patientModuleId: string
  practitionerId: string
  patientId: string
  moduleLabel: string
  moduleIconName: string
  onClose: () => void
}

const DAY_KEYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const
const DAY_ISO = [1, 2, 3, 4, 5, 6, 7] as const
const DEFAULT_TIME = '09:00'

export function NotificationRoutineModal({
  patientModuleId,
  practitionerId,
  patientId,
  moduleLabel,
  moduleIconName,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const ModuleIcon = LUCIDE_ICONS[moduleIconName]

  const [routines, setRoutines] = useState<NotificationRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5])
  const [showForm, setShowForm] = useState(false)

  const timeRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRoutinesForPatientModule(patientModuleId)
      setRoutines(data)
      if (data.length === 0) setShowForm(true)
    } finally {
      setLoading(false)
    }
  }, [patientModuleId])

  useEffect(() => { void load() }, [load])

  const toggleDay = useCallback((iso: number) => {
    setSelectedDays(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort((a, b) => a - b)
    )
  }, [])

  const handleCreate = useCallback(async () => {
    if (selectedDays.length === 0) return
    setSaving(true)
    try {
      await createRoutine({
        patient_module_id: patientModuleId,
        practitioner_id: practitionerId,
        patient_id: patientId,
        days_of_week: selectedDays,
        time_of_day: timeRef.current?.value ?? DEFAULT_TIME,
        practitioner_note: noteRef.current?.value.trim() || null,
      })
      setSelectedDays([1, 3, 5])
      if (timeRef.current) timeRef.current.value = DEFAULT_TIME
      if (noteRef.current) noteRef.current.value = ''
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }, [selectedDays, patientModuleId, practitionerId, patientId, load])

  const handleToggleActive = useCallback(async (routine: NotificationRoutine) => {
    await updateRoutine(routine.id, { is_active: !routine.is_active })
    await load()
  }, [load])

  const handleDelete = useCallback(async (routineId: string) => {
    await deleteRoutine(routineId)
    await load()
  }, [load])

  const dayLabels = useMemo(() => DAY_KEYS, [])

  return (
    <Modal
      title={t('notifications.modal_title')}
      icon={<Bell size={18} />}
      onClose={onClose}
    >
      <p className="nr-module-label">
        {ModuleIcon && <ModuleIcon size={14} className="nr-module-icon" />}
        {moduleLabel}
      </p>

      {loading ? (
        <div className="nr-loading"><Loader size={20} className="nr-spinner" /></div>
      ) : (
        <>
          {routines.map(routine => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              onToggle={() => void handleToggleActive(routine)}
              onDelete={() => void handleDelete(routine.id)}
              t={t}
            />
          ))}

          {showForm ? (
            <div className="nr-form">
              <div className="nr-form__label">{t('notifications.days_label')}</div>
              <div className="nr-form__days">
                {dayLabels.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    className={`nr-form__day ${selectedDays.includes(DAY_ISO[i]) ? 'nr-form__day--on' : ''}`}
                    onClick={() => toggleDay(DAY_ISO[i])}
                  >
                    {t(`notifications.day_${key}`)}
                  </button>
                ))}
              </div>

              <div className="nr-form__label">{t('notifications.time_label')}</div>
              <TimePicker ref={timeRef} defaultValue={DEFAULT_TIME} className="nr-form__time" />

              <div className="nr-form__label">{t('notifications.note_label')}</div>
              <InputField
                multiline
                ref={noteRef}
                aria-label={t('notifications.note_label')}
                placeholder={t('notifications.note_placeholder')}
                rows={2}
              />

              <div className="nr-form__actions">
                {routines.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={selectedDays.length === 0}
                  onClick={() => void handleCreate()}
                >
                  {t('notifications.save_routine')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowForm(true)}
              icon={<Plus size={15} />}
            >
              {t('notifications.add_routine')}
            </Button>
          )}
        </>
      )}
    </Modal>
  )
}

interface RoutineRowProps {
  routine: NotificationRoutine
  onToggle: () => void
  onDelete: () => void
  t: (key: string) => string
}

const DAY_ISO_TO_KEY: Record<number, string> = {
  1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 7: 'dim',
}

function RoutineRow({ routine, onToggle, onDelete, t }: RoutineRowProps) {
  const effectiveTime = routine.patient_time_override ?? routine.time_of_day
  const dayLabels = routine.days_of_week
    .map(d => t(`notifications.day_${DAY_ISO_TO_KEY[d] ?? ''}`))
    .join(', ')

  return (
    <div className={`nr-row ${routine.is_active ? '' : 'nr-row--inactive'}`}>
      <div className="nr-row__info">
        <span className="nr-row__days">{dayLabels}</span>
        <span className="nr-row__time">{effectiveTime}</span>
        {routine.practitioner_note ? (
          <span className="nr-row__note">{routine.practitioner_note}</span>
        ) : null}
        {routine.patient_paused ? (
          <span className="nr-row__paused">{t('notifications.patient_paused')}</span>
        ) : null}
      </div>
      <div className="nr-row__actions">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          icon={routine.is_active ? <Bell size={15} /> : <BellOff size={15} />}
          onClick={onToggle}
          aria-pressed={routine.is_active}
          title={routine.is_active ? t('notifications.deactivate') : t('notifications.activate')}
        />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          category="danger"
          icon={<X size={15} />}
          onClick={onDelete}
          title={t('common.delete')}
        />
      </div>
    </div>
  )
}
