import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { BREATHING_TECHNIQUES, getTechnique, type BreathingTechnique } from '../../constants/breathingTechniques'
import { getAllBreathingSessions, type BreathingSession } from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Carte d'une technique ────────────────────────────────────────────────────

interface TechniqueCardProps {
  technique: BreathingTechnique
  sessionCount: number
  onPress: () => void
}

function TechniqueCard({ technique, sessionCount, onPress }: TechniqueCardProps) {
  const cycleDuration = technique.phases.reduce((acc, p) => acc + p.seconds, 0)

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: technique.color }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Commencer ${technique.name}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          <Text style={styles.cardName}>{technique.name}</Text>
          <Text style={styles.cardSubtitle}>{technique.subtitle}</Text>
        </View>
        <View style={[styles.durationBadge, { backgroundColor: technique.color + '1A' }]}>
          <Text style={[styles.durationText, { color: technique.color }]}>
            {cycleDuration}s / cycle
          </Text>
        </View>
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>{technique.description}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.evidenceText}>{technique.evidence}</Text>
        {sessionCount > 0 && (
          <View style={styles.sessionBadge}>
            <MaterialCommunityIcons name="history" size={12} color={colors.textMuted} />
            <Text style={styles.sessionCount}>
              {sessionCount} session{sessionCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Visualisation des phases */}
      <View style={styles.phases}>
        {technique.phases.map((phase, i) => (
          <View key={i} style={styles.phaseItem}>
            <View style={[styles.phaseBar, { backgroundColor: technique.color, flex: phase.seconds }]} />
            <Text style={styles.phaseLabel}>{phase.seconds}s</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BreathingTechniquesScreen() {
  const { isTeenMode, tt, teenColor } = useTeen()
  const navigation = useNavigation<Nav>()
  const [sessions, setSessions] = useState<BreathingSession[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      getAllBreathingSessions(200).then((data) => {
        setSessions(data)
        setLoading(false)
      })
    }, [])
  )

  // Compte le nombre de sessions par technique
  const countForTechnique = (key: string) =>
    sessions.filter((s) => s.technique_key === key).length

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
          {isTeenMode
            ? tt('breathing_techniques', 'intro')
            : 'Choisissez une technique. Un guide animé vous accompagne, cycle par cycle.'}
        </Text>

        {BREATHING_TECHNIQUES.map((technique) => (
          <TechniqueCard
            key={technique.key}
            technique={technique}
            sessionCount={countForTechnique(technique.key)}
            onPress={() =>
              navigation.navigate('BreathingExercise', { techniqueKey: technique.key })
            }
          />
        ))}

        {/* Historique récent */}
        {sessions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Sessions récentes</Text>
            {sessions.slice(0, 10).map((s) => {
              const tech = getTechnique(s.technique_key)
              const mins = Math.floor(s.duration_seconds / 60)
              const secs = s.duration_seconds % 60
              const dateLabel = new Date(s.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short',
              })
              return (
                <View key={s.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: tech?.color ?? colors.border }]} />
                  <Text style={styles.historyName}>{tech?.name ?? s.technique_key}</Text>
                  <Text style={styles.historyDuration}>
                    {mins > 0 ? `${mins}min ` : ''}{secs > 0 ? `${secs}s` : ''}
                  </Text>
                  <Text style={styles.historyDate}>{dateLabel}</Text>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardText: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  durationText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evidenceText: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', flex: 1 },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sessionCount: { fontSize: 11, color: colors.textMuted },

  phases: { flexDirection: 'row', gap: 3, height: 6, marginTop: spacing.xs },
  phaseItem: { flex: 1, gap: 2 },
  phaseBar: { height: 6, borderRadius: radius.full },
  phaseLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },

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
