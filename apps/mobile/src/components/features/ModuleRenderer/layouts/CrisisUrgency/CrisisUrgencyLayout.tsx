// ─── Layout `crisis_urgency` — mode urgence 1-tap (plan de crise) ────────────
//
// Écran d'urgence : gros boutons d'appel direct (tel:) construits à partir des
// fields `exercise_safety`, suivis du widget de contacts de confiance du patient.
// Conformité MDR 2017/745 : raccourcis d'appel, zéro interprétation des données.

import { useTranslation } from 'react-i18next'
import { View, Text, Pressable, ScrollView, Linking } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { ContentField } from '../../../../../services/moduleService'
import { CrisisUrgencyContactsWidget } from '../../fields/CrisisUrgencyContactsWidget'
import { styles } from './styles'

export interface CrisisUrgencyLayoutProps {
  /** Fields du module — les `exercise_safety` (boutons d'appel) en sont extraits. */
  fields: ContentField[]
}

export function CrisisUrgencyLayout({ fields }: CrisisUrgencyLayoutProps) {
  const { t } = useTranslation()
  const callFields = fields
    .filter(f => f.field_type === 'exercise_safety')
    .sort((a, b) => a.sort_order - b.sort_order)
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.callSection}>
        {callFields.map(f => {
          const phone = f.props['phone'] ?? ''
          const bgColor = (f.props['bgColor'] as string | undefined) ?? '#DC2626'
          const labelCode = f.props['label_code'] as string | undefined
          return (
            <Pressable
              key={f.id}
              style={[styles.callBtn, { backgroundColor: bgColor }]}
              onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
              accessibilityRole="button"
              accessibilityLabel={t(f.text_code ?? '')}
            >
              <MaterialCommunityIcons name="phone" size={24} color="#fff" />
              <View>
                <Text style={styles.callLabel}>{t(f.text_code ?? '')}</Text>
                {labelCode != null && <Text style={styles.callSub}>{t(labelCode)}</Text>}
              </View>
            </Pressable>
          )
        })}
      </View>
      <CrisisUrgencyContactsWidget />
    </ScrollView>
  )
}
