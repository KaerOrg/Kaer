// ─── column_time_field — adaptateur du primitive ui/TimePicker ──────────
//
// Champ de saisie d'heure « HH:MM » utilisé dans le layout `column_form`.
// Stockage : "HH:MM" (string) dans form_entries.values[key], '' si non renseigné.
// Props field_props : `key` (clé form_entries, requis), `optional` ('0'|'1', défaut '1').
// La présentation et le picker natif sont délégués à ui/TimePicker.

import { memo } from 'react'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { TimePicker } from '../../../../ui/TimePicker'

export interface ColumnTimeFieldProps {
  fieldKey: string
  label: string
  value: string
  optional: boolean
  accent: string
  onChange: (next: string) => void
}

export const ColumnTimeField = memo(function ColumnTimeField({
  fieldKey,
  label,
  value,
  optional,
  accent,
  onChange,
}: ColumnTimeFieldProps) {
  const t = useModuleTranslation()
  return (
    <TimePicker
      value={value}
      onChange={onChange}
      label={label || undefined}
      accent={accent}
      clearable={optional}
      clearLabel={t('common.delete')}
      placeholder={t('common.time_picker.tap_to_set')}
      confirmLabel={t('common.confirm')}
      testID={`time-${fieldKey}`}
    />
  )
})
