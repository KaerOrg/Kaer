// ─── Boutons d'appel d'urgence colorés (composant partagé) ──────────────────
//
// Rangée de boutons d'appel `tel:` construits à partir des fields `exercise_safety`
// (props `phone`, `bgColor`, `label_code`). Chaque bouton affiche deux lignes (numéro
// + intitulé) via `ui/Button` (variante `primary` → texte blanc, `sublabel` pour la
// 2ᵉ ligne, couleur de fond dynamique en `style`). Centralisé ici pour être réutilisé
// par `SafetyPlanLayout` (vue consultation, en tête) et `EditableStepsLayout` (barre
// de config), au lieu d'être dupliqué dans chaque layout.
// Conformité MDR 2017/745 : raccourci d'appel, zéro interprétation des données.

import { View, StyleSheet, Linking } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { ContentField } from '@services/moduleService'

const DEFAULT_CALL_COLOR = '#DC2626'
const PHONE_ICON = <MaterialCommunityIcons name="phone" size={20} color={colors.white} />

export interface CrisisEmergencyCallsProps {
  /** Fields du module — les `exercise_safety` (boutons d'appel) en sont extraits. */
  fields: ContentField[]
}

export function CrisisEmergencyCalls({ fields }: CrisisEmergencyCallsProps) {
  const t = useModuleTranslation()
  const callFields = [...fields]
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  if (callFields.length === 0) return null

  return (
    <View style={styles.row}>
      {callFields.map(f => {
        const phone = f.props['phone'] ?? ''
        const bgColor = (f.props['bgColor'] as string | undefined) ?? DEFAULT_CALL_COLOR
        const labelCode = f.props['label_code'] as string | undefined
        const label = t(f.text_code ?? '')
        return (
          <Button
            key={f.id}
            variant="primary"
            style={[styles.cell, { backgroundColor: bgColor }]}
            iconLeft={PHONE_ICON}
            label={label}
            sublabel={labelCode != null ? t(labelCode) : undefined}
            onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
            accessibilityLabel={label}
            testID={`emergency-${phone}`}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
})
