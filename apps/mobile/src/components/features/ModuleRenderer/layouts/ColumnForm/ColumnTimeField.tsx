// ─── column_time_field — adaptateur du primitive ui/TimePicker ──────────
//
// Champ de saisie d'heure « HH:MM » utilisé dans le layout `column_form`.
// Stockage : "HH:MM" (string) dans form_entries.values[key], '' si non renseigné.
// Props field_props : `key` (clé form_entries, requis), `optional` ('0'|'1', défaut '1').
// La présentation et le picker natif sont délégués à ui/TimePicker.
//
// Quand la clé correspond à un repère chronobiologique (`CHRONO_ANCHORS`), une
// tuile d'icône à la COULEUR + ICÔNE du repère (source unique @kaer/shared) précède
// le champ, en écho à la frise du Journal. Aucune autre config `column_form`
// n'utilise de champ horaire → comportement propre à la saisie chrono.

import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { CHRONO_ANCHORS, type ChronoAnchorSpec } from '@kaer/shared'
import { spacing, radius } from '@theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { resolveChronoIcon } from '../ChronoMonth/chronoIcons'
import { TimePicker } from '@ui/TimePicker'

const ANCHOR_BY_KEY: ReadonlyMap<string, ChronoAnchorSpec> = new Map(
  CHRONO_ANCHORS.map(a => [a.key, a]),
)

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
  const anchor = ANCHOR_BY_KEY.get(fieldKey)
  const fieldAccent = anchor?.color ?? accent
  const Icon = useMemo(() => (anchor ? resolveChronoIcon(anchor.iconName) : null), [anchor])

  const picker = (
    <TimePicker
      value={value}
      onChange={onChange}
      label={label || undefined}
      accent={fieldAccent}
      clearable={optional}
      clearLabel={t('common.delete')}
      placeholder={t('common.time_picker.tap_to_set')}
      confirmLabel={t('common.confirm')}
      testID={`time-${fieldKey}`}
    />
  )

  if (!Icon || !anchor) return picker

  return (
    <View style={styles.row}>
      <View style={[styles.iconTile, { backgroundColor: anchor.color + '1A' }]} testID={`time-tile-${fieldKey}`}>
        <Icon size={18} color={anchor.color} />
      </View>
      <View style={styles.pickerWrap}>{picker}</View>
    </View>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconTile: { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  pickerWrap: { flex: 1 },
})
