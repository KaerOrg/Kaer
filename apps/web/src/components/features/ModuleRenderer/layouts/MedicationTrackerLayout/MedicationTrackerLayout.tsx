import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type { ContentField } from '@services/moduleService'
import { FieldText } from '../../fields'
import { Tabs } from '../../../../ui/Tabs'
import type { TabItem } from '../../../../ui/Tabs/Tabs.types'
import { PreviewTodayPanel } from './PreviewTodayPanel'
import { PreviewCalendarPanel } from './PreviewCalendarPanel'
import { PreviewMedsPanel } from './PreviewMedsPanel'
import type { PreviewStatus, PreviewReason } from './types'

interface Props {
  fields: ContentField[]
  footer: ContentField | undefined
  t: (key: string, opts?: Record<string, unknown>) => string
}

// Aperçu praticien du module mobile « suivi d'observance ». Reproduit fidèlement
// les 3 volets que vit le patient (Aujourd'hui / Calendrier / Mes médicaments),
// avec onglets cliquables pour explorer. Tout le contenu vient de la config + i18n.
// Rendu passif, aucune saisie, aucune logique conditionnelle (MDR 2017/745) :
// ni taux, ni alerte, ni tendance — pastilles neutres uniquement.
export function MedicationTrackerLayout({ fields, footer, t }: Props) {
  const [tab, setTab] = useState('today')

  const moduleId = useMemo(() => fields[0]?.module_id ?? 'medication_adherence', [fields])
  const configField = useMemo(() => fields.find(f => f.field_type === 'medication_tracker_config'), [fields])

  const lbl = useMemo(() => (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }, [configField, t])

  const statuses = useMemo<PreviewStatus[]>(() => fields
    .filter(f => f.field_type === 'daily_status_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({
      value: f.props['value'] ?? '',
      label: f.text_code ? t(f.text_code) : (f.props['value'] ?? ''),
      color: f.props['color'] ?? 'var(--color-text-muted)',
      bgColor: f.props['bg_color'] ?? 'var(--color-bg)',
    })), [fields, t])

  const reasons = useMemo<PreviewReason[]>(() => fields
    .filter(f => f.field_type === 'medication_reason_option')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(f => ({
      value: f.props['value'] ?? '',
      label: f.text_code ? t(f.text_code) : (f.props['value'] ?? ''),
    })), [fields, t])

  const tabs: TabItem[] = []
  const tabToday = lbl('tab_today_label')
  const tabCalendar = lbl('tab_calendar_label')
  const tabMeds = lbl('tab_meds_label')
  if (tabToday) tabs.push({ id: 'today', label: tabToday })
  if (tabCalendar) tabs.push({ id: 'calendar', label: tabCalendar })
  if (tabMeds) tabs.push({ id: 'meds', label: tabMeds })

  return (
    <div className="mt-prev-root">
      {tabs.length > 0 && (
        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} variant="compact" />
      )}

      {tab === 'today' && (
        <PreviewTodayPanel moduleId={moduleId} t={t} lbl={lbl} statuses={statuses} reasons={reasons} />
      )}
      {tab === 'calendar' && (
        <PreviewCalendarPanel moduleId={moduleId} t={t} lbl={lbl} statuses={statuses} />
      )}
      {tab === 'meds' && (
        <PreviewMedsPanel moduleId={moduleId} t={t} lbl={lbl} />
      )}

      {footer && (
        <div className="preview-panel__info">
          <Info size={13} className="preview-panel__info-icon" />
          <FieldText field={footer} t={t} />
        </div>
      )}
    </div>
  )
}
