import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  listSessionsForItem,
  deleteExposureSession,
  type ExposureSession,
} from '../../lib/database'
import { DesensitizationChart, ChartLegend } from '../../components/DesensitizationChart'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, 'ExposureItemHistory'>

// ─── Ligne séance ─────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: ExposureSession
  index: number
  onDelete: (session: ExposureSession) => void
}

function SessionRow({ session, index, onDelete }: SessionRowProps) {
  const date = new Date(session.session_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.badge}>
        <Text style={rowStyles.badgeText}>S{index}</Text>
      </View>
      <View style={rowStyles.body}>
        <Text style={rowStyles.date}>{date}</Text>
      </View>
      <Text style={rowStyles.score}>{session.suds_score}</Text>
      <Pressable onPress={() => onDelete(session)} hitSlop={8} accessibilityRole="button">
        <Trash2 size={15} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minWidth: 38,
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  body: { flex: 1 },
  date: { fontSize: 13, color: colors.textMuted },
  score: { fontSize: 20, fontWeight: '800', color: colors.primary, minWidth: 36, textAlign: 'right' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ExposureItemHistoryScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { itemId, hierarchyId, description, initialSuds } = route.params
  const { teenColor } = useTeen()
  const { width } = useWindowDimensions()

  const [sessions, setSessions] = useState<ExposureSession[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      listSessionsForItem(itemId).then((rows) => {
        if (!active) return
        setSessions(rows)
        setLoading(false)
      })
      return () => { active = false }
    }, [itemId])
  )

  const handleDelete = useCallback((session: ExposureSession) => {
    Alert.alert(
      t('common.delete'),
      t('modules.exposure_hierarchy.history_delete_session'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteExposureSession(session.id)
            setSessions((prev) => prev.filter((s) => s.id !== session.id))
          },
        },
      ]
    )
  }, [t])

  const accentColor = teenColor('exposure_hierarchy') ?? colors.primary
  const chartWidth = width - spacing.lg * 2
  const firstSuds = sessions.length > 0 ? sessions[0].suds_score : null
  const lastSuds = sessions.length > 0 ? sessions[sessions.length - 1].suds_score : null

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={accentColor} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Hero — situation */}
        <View style={styles.hero}>
          <View style={styles.heroInitialRow}>
            <Text style={styles.heroInitialLabel}>SUDs estimé au départ</Text>
            <Text style={[styles.heroInitialValue, { color: accentColor }]}>{initialSuds}</Text>
          </View>
          <Text style={styles.heroDescription} numberOfLines={4}>
            {description}
          </Text>
        </View>

        {/* Stats */}
        {sessions.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: accentColor }]}>{sessions.length}</Text>
              <Text style={styles.statLabel}>{sessions.length > 1 ? 'séances' : 'séance'}</Text>
            </View>
            {firstSuds !== null && (
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: accentColor }]}>{firstSuds}</Text>
                <Text style={styles.statLabel}>1ʳᵉ séance</Text>
              </View>
            )}
            {lastSuds !== null && (
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: accentColor }]}>{lastSuds}</Text>
                <Text style={styles.statLabel}>dernière</Text>
              </View>
            )}
          </View>
        )}

        {/* Graphique */}
        {sessions.length >= 2 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Courbe de désensibilisation</Text>
            <DesensitizationChart
              sessions={sessions}
              initialSuds={initialSuds}
              width={chartWidth}
              accentColor={accentColor}
            />
            <ChartLegend accentColor={accentColor} />
          </View>
        )}

        {sessions.length === 1 && (
          <View style={styles.chartHint}>
            <Text style={styles.chartHintText}>
              Enregistrez une 2ᵉ séance pour voir votre courbe d'évolution apparaître.
            </Text>
          </View>
        )}

        {/* Liste des séances */}
        <View style={styles.sessionSection}>
          <Text style={styles.sectionTitle}>Détail des séances</Text>
          {sessions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('modules.exposure_hierarchy.history_no_sessions')}
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {sessions.map((s, i) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  index={i + 1}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={[styles.addBtn, { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('ExposureSession', { itemId, hierarchyId })}
          accessibilityRole="button"
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.addBtnText}>
            {t('modules.exposure_hierarchy.history_add_session')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Hero
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroInitialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroInitialLabel: { fontSize: 12, color: colors.textMuted },
  heroInitialValue: { fontSize: 22, fontWeight: '800' },
  heroDescription: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  // Chart
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chartTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  chartHint: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  chartHintText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

  // Sessions
  sessionSection: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionList: { gap: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Footer
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  addBtn: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  addBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
})
