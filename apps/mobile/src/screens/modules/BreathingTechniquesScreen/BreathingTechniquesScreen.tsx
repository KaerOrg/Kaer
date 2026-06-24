import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  fetchBreathingTechniques,
  fetchBreathingSessions,
  type BreathingTechnique,
  type BreathingSession,
} from '../../../services/breathingService'
import { AppStackParamList } from '../../../navigation/AppStack'
import { colors, spacing, radius } from '@theme'
import { useTranslation } from 'react-i18next'
import { useTeen } from '../../../hooks/useTeen'
import { TeenAccent } from '../../../components/features/TeenAccent'
import { TechniqueCard } from './TechniqueCard'

type Nav = NativeStackNavigationProp<AppStackParamList>

export default function BreathingTechniquesScreen() {
  const { t } = useTranslation()
  const { tt, teenColor } = useTeen()
  const navigation = useNavigation<Nav>()
  const [sessions, setSessions] = useState<BreathingSession[]>([])
  const [techniques, setTechniques] = useState<BreathingTechnique[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchBreathingTechniques(), fetchBreathingSessions()])
        .then(([techs, data]) => {
          setTechniques(techs)
          setSessions(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, [])
  )

  // Callback stable : la carte reçoit la clé et le rappelle, pas de lambda par carte.
  const handleOpen = useCallback(
    (techniqueKey: string) => navigation.navigate('BreathingExercise', { techniqueKey }),
    [navigation]
  )

  // Nombre de sessions par technique (lookup O(1), recalculé quand les sessions changent).
  const sessionCountByKey = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) counts.set(s.technique_key, (counts.get(s.technique_key) ?? 0) + 1)
    return counts
  }, [sessions])

  // Lookup O(1) technique par clé pour l'historique
  const techniqueByKey = useMemo(
    () => new Map(techniques.map((tech) => [tech.key, tech])),
    [techniques]
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('breathing_techniques')} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          {tt('breathing_techniques', 'intro') || t('modules.breathing_techniques.intro_guide')}
        </Text>

        {techniques.map((technique) => (
          <TechniqueCard
            key={technique.key}
            technique={technique}
            sessionCount={sessionCountByKey.get(technique.key) ?? 0}
            onOpen={handleOpen}
          />
        ))}

        {/* Historique récent */}
        {sessions.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t('modules.breathing_techniques.recent_sessions')}</Text>
            {sessions.slice(0, 10).map((s) => {
              const tech = techniqueByKey.get(s.technique_key)
              const mins = Math.floor(s.duration_seconds / 60)
              const secs = s.duration_seconds % 60
              const dateLabel = new Date(s.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short',
              })
              return (
                <View key={s.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: tech?.color ?? colors.border }]} />
                  <Text style={styles.historyName}>{tech ? t(`modules.breathing_techniques.${tech.key}_name`) : s.technique_key}</Text>
                  <Text style={styles.historyDuration}>
                    {mins > 0 ? `${mins}min ` : ''}{secs > 0 ? `${secs}s` : ''}
                  </Text>
                  <Text style={styles.historyDate}>{dateLabel}</Text>
                </View>
              )
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  historySection: { gap: spacing.sm, marginTop: spacing.sm },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDot: { width: 8, height: 8, borderRadius: radius.full },
  historyName: { flex: 1, fontSize: 13, color: colors.text },
  historyDuration: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  historyDate: { fontSize: 12, color: colors.textMuted, width: 56, textAlign: 'right' },
})
