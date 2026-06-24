// ─── Widget `crisis_urgency_entry` (mobile) : bandeau d'accès au mode urgence ─
//
// Bandeau rouge en haut du plan de crise : ouvre le mini-écran plein `CrisisUrgency`
// (gros boutons d'appel + contacts de confiance). Le pendant web rend ce field_type
// en aperçu statique (le praticien n'a pas de mode urgence). Conformité MDR : simple
// raccourci de navigation, zéro interprétation des données.

import { useCallback } from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'

type Nav = NativeStackNavigationProp<AppStackParamList>

export function CrisisUrgencyEntry() {
  const t = useModuleTranslation()
  const navigation = useNavigation<Nav>()
  const openUrgency = useCallback(() => navigation.navigate('CrisisUrgency'), [navigation])

  return (
    <Pressable
      style={styles.banner}
      onPress={openUrgency}
      accessibilityRole="button"
      accessibilityLabel={t('modules.crisis_plan.urgency_title')}
    >
      <MaterialCommunityIcons name="alert-circle" size={20} color={colors.white} />
      <Text style={styles.text}>{t('modules.crisis_plan.urgency_title')}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.white} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  text: { flex: 1, color: colors.white, fontWeight: '700', fontSize: 15 },
})
