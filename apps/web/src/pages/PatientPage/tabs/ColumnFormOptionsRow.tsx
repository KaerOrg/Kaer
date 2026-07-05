import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { readEnabledGroups } from '@kaer/shared'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { useToast } from '../../../contexts/ToastContext'
import { updateEnabledGroups } from '@services/moduleAssignmentService'
import type { PatientModule } from '../../../lib/database.types'

interface Props {
  mod: PatientModule
  /** Groupe de colonnes optionnelles à basculer (ex. 'evidence'). */
  group: string
  /** Libellé du toggle (déjà traduit). */
  label: string
  onReload: () => Promise<void>
}

/**
 * Bascule praticien d'un groupe de colonnes optionnelles d'un module
 * `column_form` (patient_modules.config.enabled_groups) — ex. « Examen des
 * preuves » sur les colonnes de Beck. Le mobile lit le même contrat via
 * readEnabledGroups (@kaer/shared).
 */
export function ColumnFormOptionsRow({ mod, group, label, onReload }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const config = mod.config as Record<string, unknown> | null
  const enabled = readEnabledGroups(config).includes(group)

  const handleToggle = useCallback(async () => {
    setSaving(true)
    const current = readEnabledGroups(config)
    const next = enabled ? current.filter(g => g !== group) : [...current, group]
    const result = await updateEnabledGroups(mod.id, next)
    if (result.ok) await onReload()
    else toast.error(t('common.error'))
    setSaving(false)
  }, [config, enabled, group, mod.id, onReload, toast, t])

  return (
    <Toggle checked={enabled} onChange={handleToggle} label={label} disabled={saving} />
  )
}
