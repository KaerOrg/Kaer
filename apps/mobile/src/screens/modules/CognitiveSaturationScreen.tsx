import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllCognitiveSaturationSessions,
  deleteCognitiveSaturationSession,
  type CognitiveSaturationSession,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'

// ─── Données cliniques ────────────────────────────────────────────────────────
//
// Saturation sémantique / défusion cognitive (ACT — Hayes et al., 1999).
// Répéter un mot ou une pensée de manière rapide et répétée jusqu'à ce qu'il
// perde sa charge émotionnelle et devienne « juste des sons ».
// Utilisé en TCC et ACT pour réduire la fusion cognitive et interrompre les
// ruminations. Conformité MDR 2017/745 : aucun score interprétatif.

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

// ─── Carte d'une session ──────────────────────────────────────────────────────

interface SessionCardProps {
  session: CognitiveSaturationSession
  onDelete: (id: string) => void
}

function SessionCard({ session, onDelete }: SessionCardProps) {
  function handleDelete() {
    Alert.alert(
      'Supprimer cette session ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(session.id) },
      ]
    )
  }

  return (
    <View style={styles.sessionCard} testID={`session-card-${session.id}`}>
      <View style={styles.sessionHeader}>
        <View style={styles.wordBadge}>
          <Text style={styles.wordText} numberOfLines={1}>{session.word}</Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer cette session"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="gesture-tap" size={14} color={colors.textMuted} />
          <Text style={styles.statText}>{session.repetitions} répétitions</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
          <Text style={styles.statText}>{formatDuration(session.duration_seconds)}</Text>
        </View>
      </View>
      <Text style={styles.sessionDate}>{formatDateTime(session.created_at)}</Text>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function CognitiveSaturationScreen() {
  const navigation = useNavigation<Nav>()
  const [sessions, setSessions] = useState<CognitiveSaturationSession[]>([])
  const [loading, setLoading] = useState(true)

  const loadSessions = useCallback(async () => {
    const data = await getAllCognitiveSaturationSessions()
    setSessions(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadSessions().finally(() => setLoading(false))
    }, [loadSessions])
  )

  const handleDelete = useCallback(async (id: string) => {
    await deleteCognitiveSaturationSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Bouton démarrer ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => navigation.navigate('CognitiveSaturationExercise')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Démarrer un exercice de saturation cognitive"
        testID="start-exercise-button"
      >
        <MaterialCommunityIcons name="repeat" size={20} color={colors.white} />
        <Text style={styles.startBtnText}>Démarrer un exercice</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Intro ─────────────────────────────────────────────────────────── */}
        <View style={styles.introCard} testID="intro-card">
          <MaterialCommunityIcons name="chat-processing-outline" size={24} color={colors.primary} />
          <Text style={styles.introText}>
            Répétez un mot ou une pensée rapidement et de nombreuses fois pour qu'il perde
            progressivement sa charge émotionnelle et devienne « juste des sons ».
          </Text>
        </View>

        {/* ── Historique ────────────────────────────────────────────────────── */}
        {sessions.length === 0 ? (
          <View style={styles.empty} testID="empty-state">
            <MaterialCommunityIcons name="chat-processing-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>Aucune session</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le bouton ci-dessus pour démarrer votre premier exercice.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Historique ({sessions.length})</Text>
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  // ── Bouton démarrer
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },

  // ── Intro
  introCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  introText: { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  // ── Section
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Carte session
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  wordBadge: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  wordText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: colors.textMuted },
  sessionDate: { fontSize: 11, color: colors.border, marginTop: 2 },

  // ── État vide
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
