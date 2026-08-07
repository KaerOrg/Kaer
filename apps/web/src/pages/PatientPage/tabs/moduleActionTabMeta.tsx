import { Eye, BookOpen, LineChart, Bell, Settings, CalendarClock, Stethoscope } from 'lucide-react'
import type { ModuleActionTab } from './ModuleActionsModal'

/**
 * Présentation des onglets d'actions d'un module (libellé i18n + icône), partagée par
 * la modale `ModuleActionsModal` et les raccourcis d'action au survol du tableau (K-3).
 * Fichier dédié : un fichier de composant ne doit exporter que des composants
 * (`react-refresh/only-export-components`).
 */
export const TAB_LABEL_KEY: Record<ModuleActionTab, string> = {
  preview: 'patient.patient_view_tab',
  sources: 'patient.sources_tab',
  data: 'patient.data_button',
  notifications: 'notifications.modal_title',
  config: 'patient.config_tab',
  schedule: 'scales.schedule.tab',
  passation: 'scales.passation.tab',
}

export function tabIcon(tab: ModuleActionTab) {
  if (tab === 'preview') return <Eye size={15} />
  if (tab === 'sources') return <BookOpen size={15} />
  if (tab === 'data') return <LineChart size={15} />
  if (tab === 'notifications') return <Bell size={15} />
  if (tab === 'schedule') return <CalendarClock size={15} />
  if (tab === 'passation') return <Stethoscope size={15} />
  return <Settings size={15} />
}
