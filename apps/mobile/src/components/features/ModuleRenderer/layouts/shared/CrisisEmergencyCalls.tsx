// ─── Boutons d'appel d'urgence colorés (composant partagé) ──────────────────
//
// Rangée de boutons d'appel `tel:` construits à partir des fields `exercise_safety`
// (props `phone`, `bgColor`, `label_code`). Chaque bouton est coloré par numéro et
// affiche deux lignes (numéro + intitulé) — un affichage que `ui/Button` ne couvre
// pas (label mono-ligne). On garde donc un contrôle dédié, centralisé ici pour être
// réutilisé par `SafetyPlanLayout` (vue consultation, en tête) et `EditableStepsLayout`
// (barre de config), au lieu d'être dupliqué dans chaque layout.
// Conformité MDR 2017/745 : raccourci d'appel, zéro interprétation des données.

import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { ContentField } from '@services/moduleService'

const DEFAULT_CALL_COLOR = '#DC2626'

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
        return (
          <Pressable
            key={f.id}
            style={[styles.btn, { backgroundColor: bgColor }]}
            onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
            testID={`emergency-${phone}`}
            accessibilityRole="button"
            accessibilityLabel={t(f.text_code ?? '')}
          >
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <View style={styles.btnTexts}>
              <Text style={styles.number}>{t(f.text_code ?? '')}</Text>
              {labelCode != null ? <Text style={styles.label}>{t(labelCode)}</Text> : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', gap: spacing.sm },
  btn:      { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  btnTexts: { flex: 1 },
  number:   { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 19 },
  label:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 14 },
})
