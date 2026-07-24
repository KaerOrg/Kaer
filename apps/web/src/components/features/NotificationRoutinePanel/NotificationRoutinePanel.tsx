import { useState, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Loader, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { Tooltip } from '@ui/Tooltip'
import { InputField } from '@ui/InputField'
import { TimeDial, minutesToHHMM } from '@ui/TimeDial'
import { WeekRhythmLine } from '@ui/WeekRhythmLine'
import { LUCIDE_ICONS } from '../../../lib/lucideIcons'
import { notificationRoutineQueries } from '../../../hooks/queries'
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from '@services/notificationRoutineService'
import type { NotificationRoutine } from '../../../lib/database.types'
import './NotificationRoutinePanel.css'

interface Props {
  patientModuleId: string
  practitionerId: string
  patientId: string
  /**
   * Libellé + icône du module, affichés en tête du panneau. Optionnels : quand le
   * panneau est monté dans une modale qui porte déjà le nom du module (onglets), on
   * les omet pour éviter un doublon de titre.
   */
  moduleLabel?: string
  moduleIconName?: string
}

const DAY_KEYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const
const DEFAULT_MINUTES = 9 * 60 // 09:00
const DEFAULT_DAYS = [1, 3, 5]

/** Tranche de journée dérivée de l'heure, pour la légende du cadran (affichage neutre). */
function periodKey(minutes: number): 'period_morning' | 'period_afternoon' | 'period_evening' {
  const h = Math.floor(minutes / 60)
  if (h < 12) return 'period_morning'
  if (h < 18) return 'period_afternoon'
  return 'period_evening'
}

/**
 * Panneau « Rappels » d'un module patient : liste les routines de notification,
 * permet d'en créer, activer/désactiver et supprimer. Rendu au choix dans la modale
 * d'actions du module (onglet Notifications) ou seul. Ne porte PAS son propre cadre
 * de modale — l'appelant fournit le chrome (titre, fermeture).
 *
 * Le formulaire de création est bâti autour du cadran radial `TimeDial` (heure) et
 * de la ligne de la semaine `WeekRhythmLine` (jours) ; une barre de résumé récapitule
 * en clair ce que recevra le patient.
 */
export function NotificationRoutinePanel({
  patientModuleId,
  practitionerId,
  patientId,
  moduleLabel,
  moduleIconName,
}: Props) {
  const { t } = useTranslation()
  const ModuleIcon = moduleIconName ? LUCIDE_ICONS[moduleIconName] : undefined
  const queryClient = useQueryClient()

  const routinesQuery = useQuery(notificationRoutineQueries.byPatientModule(patientModuleId))
  const routines = useMemo(() => routinesQuery.data ?? [], [routinesQuery.data])
  const loading = routinesQuery.isLoading

  const [selectedDays, setSelectedDays] = useState<number[]>(DEFAULT_DAYS)
  // Source de vérité de l'heure : minutes depuis minuit. Le cadran, le résumé et
  // l'enregistrement en dérivent.
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_MINUTES)

  const noteRef = useRef<HTMLTextAreaElement>(null)

  // Toute écriture invalide la liste du module → refetch et fraîcheur immédiate.
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: notificationRoutineQueries.byPatientModule(patientModuleId).queryKey }),
    [queryClient, patientModuleId],
  )

  const createMutation = useMutation({ mutationFn: createRoutine, onSuccess: invalidate })
  const toggleMutation = useMutation({
    mutationFn: (routine: NotificationRoutine) => updateRoutine(routine.id, { is_active: !routine.is_active }),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteRoutine, onSuccess: invalidate })
  const saving = createMutation.isPending

  const toggleDay = useCallback((iso: number) => {
    setSelectedDays(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort((a, b) => a - b)
    )
  }, [])

  // Libellés courts des 7 jours (lundi → dimanche) pour la ligne de la semaine.
  const dayLabels = useMemo(
    () => DAY_KEYS.map(key => t(`notifications.day_${key}`)),
    [t],
  )

  // Récap lisible des jours sélectionnés pour la barre de résumé (abréviations 3 lettres,
  // distinctes des libellés d'une lettre du cadran de jours).
  const previewDays = useMemo(
    () => selectedDays.map(iso => t(`notifications.day_abbr_${DAY_KEYS[iso - 1]}`)).join(', '),
    [selectedDays, t],
  )

  const handleCreate = useCallback(async () => {
    if (selectedDays.length === 0) return
    await createMutation.mutateAsync({
      patient_module_id: patientModuleId,
      practitioner_id: practitionerId,
      patient_id: patientId,
      days_of_week: selectedDays,
      time_of_day: minutesToHHMM(reminderMinutes),
      practitioner_note: noteRef.current?.value.trim() || null,
    })
    setSelectedDays(DEFAULT_DAYS)
    setReminderMinutes(DEFAULT_MINUTES)
    if (noteRef.current) noteRef.current.value = ''
  }, [selectedDays, reminderMinutes, patientModuleId, practitionerId, patientId, createMutation])

  const handleToggleActive = useCallback(
    (routine: NotificationRoutine) => { void toggleMutation.mutate(routine) },
    [toggleMutation],
  )

  const handleDelete = useCallback(
    (routineId: string) => { void deleteMutation.mutate(routineId) },
    [deleteMutation],
  )

  return (
    <>
      {moduleLabel && (
        <p className="nr-module-label">
          {ModuleIcon && <ModuleIcon size={14} className="nr-module-icon" />}
          {moduleLabel}
        </p>
      )}

      {loading ? (
        <div className="nr-loading"><Loader size={20} className="nr-spinner" /></div>
      ) : (
        <div className="nr-panel">
          <div className="nr-form">
            <div className="nr-form__cols">
                <TimeDial
                  minutes={reminderMinutes}
                  onChange={setReminderMinutes}
                  title={t('notifications.reminder_at')}
                  caption={t(`notifications.${periodKey(reminderMinutes)}`)}
                  hoursLabel={t('notifications.hours_label')}
                  minutesLabel={t('notifications.minutes_label')}
                  markerLabel={t('notifications.marker_label')}
                />

                <div className="nr-form__right">
                  <div className="nr-form__label">{t('notifications.days_label')}</div>
                  <WeekRhythmLine
                    selectedDays={selectedDays}
                    onToggle={toggleDay}
                    dayLabels={dayLabels}
                  />

                  <div className="nr-form__label">
                    {t('notifications.note_label')}
                    <span className="nr-form__optional"> · {t('notifications.note_optional')}</span>
                  </div>
                  <InputField
                    multiline
                    ref={noteRef}
                    aria-label={t('notifications.note_label')}
                    placeholder={t('notifications.note_placeholder')}
                    rows={3}
                  />
                </div>
              </div>

              {/* Barre de résumé : ce que recevra le patient, mis à jour en direct. */}
              <div className="nr-form__summary">
                <p className="nr-form__summary-text">
                  {selectedDays.length > 0
                    ? t('notifications.summary', {
                        count: selectedDays.length,
                        days: previewDays,
                        time: minutesToHHMM(reminderMinutes),
                      })
                    : t('notifications.preview_empty')}
                </p>
                <div className="nr-form__actions">
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
            </div>

          {/* Liste des rappels déjà programmés, sous le formulaire de saisie. */}
          {routines.map(routine => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              onToggle={() => void handleToggleActive(routine)}
              onDelete={() => void handleDelete(routine.id)}
              t={t}
            />
          ))}
        </div>
      )}
    </>
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
    .map(d => t(`notifications.day_abbr_${DAY_ISO_TO_KEY[d] ?? ''}`))
    .join(', ')

  const actions = (
    <div className="nr-row__actions">
      <Tooltip label={routine.is_active ? t('notifications.deactivate') : t('notifications.activate')}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          icon={routine.is_active ? <Bell size={15} /> : <BellOff size={15} />}
          onClick={onToggle}
          aria-pressed={routine.is_active}
          aria-label={routine.is_active ? t('notifications.deactivate') : t('notifications.activate')}
        />
      </Tooltip>
      <Tooltip label={t('common.delete')}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          category="danger"
          icon={<X size={15} />}
          onClick={onDelete}
          aria-label={t('common.delete')}
        />
      </Tooltip>
    </div>
  )

  return (
    <Card
      variant="default"
      className={`nr-card ${routine.is_active ? '' : 'nr-card--inactive'}`}
      header={{ title: effectiveTime, subtitle: dayLabels, right: actions }}
    >
      {routine.practitioner_note || routine.patient_paused ? (
        <div className="nr-card__meta">
          {routine.practitioner_note ? (
            <span className="nr-row__note">{routine.practitioner_note}</span>
          ) : null}
          {routine.patient_paused ? (
            <span className="nr-row__paused">{t('notifications.patient_paused')}</span>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
