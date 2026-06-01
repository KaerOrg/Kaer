// ─── Bloc sécurité — boutons d'appel d'urgence (composant partagé) ───────────
//
// Affiche un encart rouge listant des numéros d'urgence cliquables (tel:).
// Construit à partir des fields `exercise_safety_title` + `exercise_safety`.
// Réutilisé par les layouts `guided_exercise` et `patient_scenario` — c'est
// pourquoi il vit dans `layouts/shared/` plutôt que dans un layout précis.

import type { ComponentProps } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { spacing, radius } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'

export interface ExerciseSafetySectionProps {
  /** Fields du module — les `exercise_safety*` en sont extraits. */
  fields: ContentField[]
}

export function ExerciseSafetySection({ fields }: ExerciseSafetySectionProps) {
  const t = useModuleT()
  const titleField = fields.find(f => f.field_type === 'exercise_safety_title')
  const phoneFields = [...fields]
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  if (titleField == null && phoneFields.length === 0) return null
  return (
    <View style={styles.section}>
      {titleField != null && (
        <Text style={styles.title}>{t(titleField.text_code ?? '')}</Text>
      )}
      {phoneFields.map(f => {
        const phone = f.props['phone'] ?? ''
        const icon = (f.props['icon'] ?? 'phone') as ComponentProps<typeof MaterialCommunityIcons>['name']
        return (
          <Pressable
            key={f.id}
            style={styles.btn}
            onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name={icon} size={18} color="#DC2626" />
            <Text style={styles.btnText}>{t(f.text_code ?? '')}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: '#FECACA',
  },
  title:   { fontSize: 12, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.8 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  btnText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
})
