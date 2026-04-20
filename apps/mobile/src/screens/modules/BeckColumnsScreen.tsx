import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllThoughtRecords,
  deleteThoughtRecord,
  type ThoughtRecord,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Carte d'aperçu d'un enregistrement ──────────────────────────────────────

interface RecordCardProps {
  record: ThoughtRecord
  onEdit: () => void
  onDelete: () => void
}

function RecordCard({ record, onEdit, onDelete }: RecordCardProps) {
  const { t } = useTranslation()
  const dateLabel = new Date(record.date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <View style={cardStyles.container}>
      {/* En-tête : date + actions */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.date}>{dateLabel}</Text>
        <View style={cardStyles.actions}>
          <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={t('common.modify')}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={t('common.delete')}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Colonne 1 — Situation */}
      {!!record.situation && (
        <View style={cardStyles.row}>
          <View style={[cardStyles.dot, { backgroundColor: '#0EA5E9' }]} />
          <Text style={cardStyles.rowText} numberOfLines={2}>{record.situation}</Text>
        </View>
      )}

      {/* Colonne 2 — Émotion + intensité */}
      {!!record.emotion && (
        <View style={cardStyles.row}>
          <View style={[cardStyles.dot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={cardStyles.rowText}>
            {record.emotion}
            {' '}
            <Text style={cardStyles.intensity}>({record.emotion_intensity}%)</Text>
          </Text>
        </View>
      )}

      {/* Colonne 3 — Pensée automatique */}
      {!!record.automatic_thought && (
        <View style={cardStyles.row}>
          <View style={[cardStyles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={cardStyles.rowText} numberOfLines={2}>{record.automatic_thought}</Text>
        </View>
      )}

      {/* Résultat — intensité après réexamen si renseignée */}
      {!!record.outcome_emotion && (
        <View style={cardStyles.outcome}>
          <MaterialCommunityIcons name="arrow-right-circle-outline" size={14} color={colors.textMuted} />
          <Text style={cardStyles.outcomeText}>
            {record.outcome_emotion}{' '}
            <Text style={cardStyles.intensity}>({record.outcome_intensity}%)</Text>
          </Text>
        </View>
      )}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  rowText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  intensity: { color: colors.textMuted, fontSize: 13 },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  outcomeText: { fontSize: 13, color: colors.textMuted },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BeckColumnsScreen() {
  const { t } = useTranslation()
  const { tt, teenColor } = useTeen()
  const navigation = useNavigation<Nav>()
  const [records, setRecords] = useState<ThoughtRecord[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      getAllThoughtRecords().then((data) => {
        if (!active) return
        setRecords(data)
        setLoading(false)
      })
      return () => { active = false }
    }, [])
  )

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('modules.beck_columns.delete_record_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteThoughtRecord(id)
            setRecords((prev) => prev.filter((r) => r.id !== id))
          },
        },
      ]
    )
  }, [t])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('beck_columns')} />
      <ScrollView contentContainerStyle={styles.content}>
        {records.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="thought-bubble-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>{t('modules.beck_columns.empty_title')}</Text>
            <Text style={styles.emptyText}>{t('modules.beck_columns.intro')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={() => navigation.navigate('BeckEntry', { recordId: record.id })}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bouton flottant "Nouvelle pensée" */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('BeckEntry', {})}
          accessibilityRole="button"
          accessibilityLabel={t('modules.beck_columns.new_thought')}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          <Text style={styles.addBtnText}>{t('modules.beck_columns.new_thought')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  list: { gap: spacing.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
