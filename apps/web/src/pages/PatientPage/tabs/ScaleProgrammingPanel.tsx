import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Send, CalendarCheck, Home, Stethoscope } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { Chip } from '../../../components/ui/Chip'
import { Banner } from '../../../components/ui/Banner'
import { Dropdown } from '../../../components/ui/Dropdown'
import { SegmentedControl, type SegmentOption } from '../../../components/ui/SegmentedControl'
import { useToast } from '../../../contexts/ToastContext'
import { scaleScheduleQueries, useSaveScaleSchedule } from '../../../hooks/queries'
import type { ScheduleFrequency, ScheduleMode } from '@services/scaleScheduleService'
import './ScaleProgrammingPanel.css'

type Props = {
  patientId: string
  practitionerId: string
  moduleId: string
  /** « Faire passer maintenant » : câblage minimal en K-6 (mécanique d'envoi en follow-up). */
  onRunNow: () => void
  /** Date de déblocage déjà formatée (K-7 : « Débloqué le » descend de la colonne à la fiche). */
  unlockedAtLabel: string | null
}

type ScheduleForm = {
  mode: ScheduleMode
  frequency: ScheduleFrequency
  dayOfWeek: number
  timeOfDay: string
  endsOn: string | null
  patientReminder: boolean
}

const FREQUENCIES: readonly ScheduleFrequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'on_demand']
const DAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7]
// Heures d'envoi proposées (créneaux pleins), 06:00 → 21:00.
const HOURS: readonly string[] = Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`)

const DEFAULT_FORM: ScheduleForm = {
  mode: 'home', frequency: 'biweekly', dayOfWeek: 1, timeOfDay: '09:00', endsOn: null, patientReminder: true,
}

/**
 * Onglet **Programmation** d'une échelle **auto** (K-6). Le praticien choisit la cadence :
 * l'app ne suggère jamais de fréquence et ne déclenche jamais de relance à partir d'un score
 * (MDR 2017/745). Persistance via `scaleScheduleService` (aucun Supabase dans le composant).
 */
export function ScaleProgrammingPanel({ patientId, practitionerId, moduleId, onRunNow, unlockedAtLabel }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const scheduleQuery = useQuery(scaleScheduleQueries.byScale(patientId, moduleId))
  const saveMutation = useSaveScaleSchedule()

  const [form, setForm] = useState<ScheduleForm>(DEFAULT_FORM)
  // Amorçage unique depuis la programmation existante (ou les défauts si aucune).
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current || scheduleQuery.isLoading) return
    const s = scheduleQuery.data
    if (s) {
      setForm({
        mode: s.mode,
        frequency: s.frequency,
        dayOfWeek: s.day_of_week ?? 1,
        timeOfDay: s.time_of_day ?? '09:00',
        endsOn: s.ends_on,
        patientReminder: s.patient_reminder,
      })
    }
    seededRef.current = true
  }, [scheduleQuery.data, scheduleQuery.isLoading])

  const modeOptions = useMemo<readonly SegmentOption<ScheduleMode>[]>(() => [
    { value: 'home', label: t('scales.schedule.mode_home'), icon: <Home size={15} /> },
    { value: 'in_session', label: t('scales.schedule.mode_in_session'), icon: <Stethoscope size={15} /> },
  ], [t])

  const dayOptions = useMemo(() => DAYS.map(d => ({ value: String(d), label: t(`scales.schedule.day_${d}`) })), [t])
  const hourOptions = useMemo(() => HOURS.map(h => ({ value: h, label: h })), [])
  // Fin : sans limite + préréglages calendaires. Une programmation chargée dont la date
  // ne correspond à aucun préréglage ajoute une option dynamique (round-trip préservé).
  const endOptions = useMemo(() => {
    const opts = [{ value: '', label: t('scales.schedule.end_none') }]
    const now = new Date()
    for (const [months, key] of [[1, 'end_1m'], [3, 'end_3m'], [6, 'end_6m']] as const) {
      const d = new Date(now.getFullYear(), now.getMonth() + months, now.getDate())
      opts.push({ value: toIso(d), label: t(`scales.schedule.${key}`) })
    }
    if (form.endsOn && !opts.some(o => o.value === form.endsOn)) {
      opts.push({ value: form.endsOn, label: new Date(form.endsOn).toLocaleDateString() })
    }
    return opts
  }, [t, form.endsOn])

  const showCadence = form.mode === 'home'
  const showDayTime = showCadence && form.frequency !== 'on_demand'

  const handleSave = () => {
    saveMutation.mutate(
      {
        patientId, practitionerId, moduleId,
        mode: form.mode,
        frequency: form.frequency,
        dayOfWeek: showDayTime ? form.dayOfWeek : null,
        timeOfDay: showDayTime ? form.timeOfDay : null,
        endsOn: showCadence ? form.endsOn : null,
        patientReminder: showCadence ? form.patientReminder : false,
      },
      {
        onSuccess: () => toast.success(t('scales.schedule.saved')),
        onError: () => toast.error(t('scales.schedule.save_error')),
      },
    )
  }

  return (
    <div className="scale-prog">
      <div className="scale-prog__field">
        <span className="scale-prog__label">{t('scales.schedule.mode_label')}</span>
        <SegmentedControl
          options={modeOptions}
          value={form.mode}
          onChange={mode => setForm(f => ({ ...f, mode }))}
          ariaLabel={t('scales.schedule.mode_label')}
        />
      </div>

      {showCadence && (
        <>
          <div className="scale-prog__field">
            <span className="scale-prog__label">{t('scales.schedule.frequency_label')}</span>
            <div className="scale-prog__chips">
              {FREQUENCIES.map(freq => (
                <Chip
                  key={freq}
                  selectable
                  selected={form.frequency === freq}
                  label={t(`scales.schedule.freq_${freq}`)}
                  onClick={() => setForm(f => ({ ...f, frequency: freq }))}
                />
              ))}
            </div>
          </div>

          {showDayTime && (
            <div className="scale-prog__row">
              <Dropdown
                label={t('scales.schedule.day_label')}
                options={dayOptions}
                value={String(form.dayOfWeek)}
                onChange={v => setForm(f => ({ ...f, dayOfWeek: Number(v) }))}
              />
              <Dropdown
                label={t('scales.schedule.time_label')}
                options={hourOptions}
                value={form.timeOfDay}
                onChange={v => setForm(f => ({ ...f, timeOfDay: v }))}
              />
              <Dropdown
                label={t('scales.schedule.end_label')}
                options={endOptions}
                value={form.endsOn ?? ''}
                onChange={v => setForm(f => ({ ...f, endsOn: v === '' ? null : v }))}
              />
            </div>
          )}

          <div className="scale-prog__reminder">
            <Toggle
              checked={form.patientReminder}
              onChange={patientReminder => setForm(f => ({ ...f, patientReminder }))}
              label={t('scales.schedule.reminder_label')}
            />
            <p className="scale-prog__reminder-desc">{t('scales.schedule.reminder_desc')}</p>
          </div>
        </>
      )}

      {form.mode === 'in_session' && (
        <p className="scale-prog__note">{t('scales.schedule.in_session_note')}</p>
      )}

      <Banner variant="info" icon={<ShieldCheck size={16} />}>
        {t('scales.schedule.mdr_note')}
      </Banner>

      <div className="scale-prog__actions">
        <Button variant="secondary" icon={<Send size={15} />} onClick={onRunNow}>
          {t('scales.schedule.run_now')}
        </Button>
        <Button icon={<CalendarCheck size={15} />} onClick={handleSave} loading={saveMutation.isPending}>
          {t('scales.schedule.save')}
        </Button>
      </div>

      {unlockedAtLabel ? (
        <p className="scale-prog__unlocked">{t('scales.programmed.unlocked_on', { date: unlockedAtLabel })}</p>
      ) : null}
    </div>
  )
}

// Date locale → « YYYY-MM-DD » (jamais toISOString : décalage de fuseau).
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
