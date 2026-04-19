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
import { getAllEmotionEntries, deleteEmotionEntry, type EmotionEntry } from '../../lib/database'
import { EMOTION_WHEEL } from '../../constants/emotionWheel'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

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

// Lookup couleur par clé primaire — module-level pour éviter les re-créations
const PRIMARY_COLOR_MAP = new Map(EMOTION_WHEEL.map((e) => [e.key, e.color]))
const PRIMARY_ICON_MAP = new Map(
  EMOTION_WHEEL.map((e) => [e.key, e.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']])
)

// ─── Carte d'une entrée ───────────────────────────────────────────────────────

interface EntryCardProps {
  entry: EmotionEntry
  onDelete: (id: string) => void
}

function EntryCard({ entry, onDelete }: EntryCardProps) {
  const color = PRIMARY_COLOR_MAP.get(entry.primary_key) ?? colors.primary
  const icon = PRIMARY_ICON_MAP.get(entry.primary_key) ?? 'emoticon-outline'

  function handleDelete() {
    Alert.alert(
      'Supprimer cette entrée ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(entry.id) },
      ]
    )
  }

  return (
    <View style={[styles.entryCard, { borderLeftColor: color }]} testID={`entry-card-${entry.id}`}>
      <View style={styles.entryHeader}>
        <View style={[styles.entryIconCircle, { backgroundColor: color + '1A' }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <View style={styles.entryLabels}>
          <Text style={[styles.entryPrimary, { color }]}>{entry.primary_label}</Text>
          <Text style={styles.entrySecondary}>
            {entry.secondary_label} · {entry.specific_label}
          </Text>
        </View>
        <View style={styles.entryRight}>
          <View style={[styles.intensityBadge, { backgroundColor: color + '1A' }]}>
            <Text style={[styles.intensityText, { color }]}>{entry.intensity}/10</Text>
          </View>
          <TouchableOpacity
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Supprimer cette entrée"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      {!!entry.notes && (
        <Text style={styles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
      )}
      <Text style={styles.entryDate}>{formatDateTime(entry.created_at)}</Text>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function EmotionWheelScreen() {
  const { teenColor } = useTeen()
  const navigation = useNavigation<Nav>()
  const [entries, setEntries] = useState<EmotionEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    const data = await getAllEmotionEntries()
    setEntries(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadEntries().finally(() => setLoading(false))
    }, [loadEntries])
  )

  const handleDelete = useCallback(async (id: string) => {
    await deleteEmotionEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
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
      <TeenAccent color={teenColor('emotion_wheel')} />

      {/* ── Boutons d'action ──────────────────────────────────────────────── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('EmotionEntry')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une nouvelle entrée d'émotion"
          testID="add-entry-button"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Identifier une émotion</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.monthBtn}
          onPress={() => navigation.navigate('EmotionMonth')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Voir le bilan mensuel"
          testID="month-view-button"
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Intro ─────────────────────────────────────────────────────────── */}
        <View style={styles.introCard} testID="intro-card">
          <MaterialCommunityIcons name="palette" size={24} color={colors.primary} />
          <Text style={styles.introText}>
            Nommez vos émotions avec précision pour mieux les reconnaître et les communiquer à votre praticien.
          </Text>
        </View>

        {/* ── Historique ────────────────────────────────────────────────────── */}
        {entries.length === 0 ? (
          <View style={styles.empty} testID="empty-state">
            <MaterialCommunityIcons name="palette-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>Aucune entrée</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le bouton ci-dessus pour identifier votre première émotion.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Historique ({entries.length})</Text>
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
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

  // ── Boutons d'action
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  monthBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

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

  // ── Carte entrée
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  entryLabels: { flex: 1, gap: 2 },
  entryPrimary: { fontSize: 15, fontWeight: '700' },
  entrySecondary: { fontSize: 13, color: colors.textMuted },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  intensityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  intensityText: { fontSize: 12, fontWeight: '700' },
  entryNotes: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  entryDate: { fontSize: 11, color: colors.border, marginTop: 2 },

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
