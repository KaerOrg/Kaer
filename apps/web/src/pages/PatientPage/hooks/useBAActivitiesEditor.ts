import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '../../../contexts/ToastContext'
import { fetchBAActivities, updateBAActivities } from '@services/moduleAssignmentService'
import { moduleQueries } from '../../../hooks/queries'
import type { PatientModule } from '../../../lib/database.types'
import type { BAConfiguredActivity } from '@kaer/shared'

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

// Longueurs maximales des saisies praticien (validées avant écriture en base).
const LABEL_MAX = 80
const VALUE_TEXT_MAX = 200

// Domaine de vie proposé dans l'éditeur : id du field `activity_log_domain`
// + clé i18n de son libellé (config-first : catalogue lu depuis la base).
export interface BADomainOption {
  id: string
  textCode: string
}

export interface BAActivityDraft {
  label: string
  domainId: string
  valueText: string
}

// Éditeur praticien des activités co-construites en consultation (activation
// comportementale) : domaine de vie + phrase « valeur » avec les mots du patient.
// Persistées dans patient_modules.config.ba_activities, lues par l'app mobile.
// Les domaines (config quasi-statique) passent par moduleQueries.fields (#101) ;
// fetchBAActivities est un amorçage de formulaire one-shot (allowlist du garde-fou).
export function useBAActivitiesEditor(
  modules: PatientModule[],
  onReloadModules: () => Promise<void>,
) {
  const { t } = useTranslation()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<BAConfiguredActivity[]>([])
  const [saving, setSaving] = useState(false)

  const module = modules.find(m => m.module_type === 'behavioral_activation')

  // Catalogue des domaines de vie : cache config partagé, chargé à l'ouverture.
  const fieldsQuery = useQuery({
    ...moduleQueries.fields('behavioral_activation'),
    enabled: open,
  })
  const domains = useMemo<BADomainOption[]>(
    () =>
      (fieldsQuery.data?.fields ?? [])
        .filter(f => f.field_type === 'activity_log_domain' && f.text_code != null)
        .map(f => ({ id: f.id, textCode: f.text_code as string })),
    [fieldsQuery.data],
  )

  const openEditor = async () => {
    if (!module) return
    const list = await fetchBAActivities(module.id)
    setActivities(list)
    setOpen(true)
  }

  const close = () => setOpen(false)

  const persist = async (next: BAConfiguredActivity[]) => {
    if (!module) return
    setActivities(next)
    setSaving(true)
    const { ok } = await updateBAActivities(module.id, next)
    setSaving(false)
    if (!ok) {
      toast.error(t('common.error_generic'))
      return
    }
    await onReloadModules()
  }

  const addActivity = (draft: BAActivityDraft) => {
    const label = draft.label.trim().slice(0, LABEL_MAX)
    if (label.length === 0 || draft.domainId.length === 0) return
    const valueText = draft.valueText.trim().slice(0, VALUE_TEXT_MAX)
    void persist([
      ...activities,
      { id: genId(), label, domain_id: draft.domainId, value_text: valueText.length > 0 ? valueText : null },
    ])
  }

  const removeActivity = (id: string) => {
    void persist(activities.filter(a => a.id !== id))
  }

  return { module, open, activities, domains, saving, openEditor, close, addActivity, removeActivity }
}
