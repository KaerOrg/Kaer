// ─── CrisisUrgencyScreen : mode urgence plein écran du plan de crise ─────────
//
// Surface de sécurité dédiée (gros boutons d'appel + contacts de confiance),
// atteignable 1-tap depuis l'accueil et depuis le bandeau du plan de crise.
// Rend le contenu via le moteur générique (`FieldRenderer preview_kind='crisis_urgency'`).
// Conformité MDR 2017/745 : raccourcis d'appel, zéro interprétation des données.

import { useEffect, useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing } from '@theme'
import { useTeen } from '../../../hooks/useTeen'
import { FieldRenderer } from '../../../components/features/ModuleRenderer/FieldRenderer'
import { fetchModuleFields, type ContentField } from '../../../services/moduleService'

const MODULE_ID = 'crisis_plan'

export default function CrisisUrgencyScreen() {
  const { tt } = useTeen()
  const navigation = useNavigation()
  const [fields, setFields] = useState<ContentField[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchModuleFields(MODULE_ID)
      .then(result => { if (active) setFields(result.fields) })
      .catch(() => { /* l'écran reste sur les boutons d'urgence statiques */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const close = useCallback(() => navigation.goBack(), [navigation])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.danger} />
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="alert-circle" size={28} color={colors.white} />
            <View style={styles.headerTexts}>
              <Text style={styles.title}>{tt(MODULE_ID, 'urgency_title')}</Text>
              <Text style={styles.subtitle}>{tt(MODULE_ID, 'urgency_subtitle')}</Text>
            </View>
          </View>
          <Pressable style={styles.close} onPress={close} accessibilityRole="button" accessibilityLabel={tt(MODULE_ID, 'urgency_title')}>
            <MaterialCommunityIcons name="close" size={24} color={colors.white} />
          </Pressable>
        </View>
      </SafeAreaView>
      <SafeAreaView style={styles.content} edges={['bottom']}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : (
          <FieldRenderer preview_kind="crisis_urgency" fields={fields} moduleId={MODULE_ID} />
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.background },
  header:      { backgroundColor: colors.danger },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerTexts: { flex: 1 },
  title:       { color: colors.white, fontSize: 18, fontWeight: '700' },
  subtitle:    { color: colors.white, fontSize: 12, marginTop: 1, opacity: 0.85 },
  close:       { padding: 4 },
  content:     { flex: 1 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
