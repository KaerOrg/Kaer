import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, Trash2, CheckCircle2, Circle, Pencil, BarChart2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  listExposureItems,
  toggleExposureItemDone,
  deleteExposureItem,
  countSessionsForItems,
  type ExposureItem,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>
type Route = RouteProp<AppStackParamList, 'ExposureHierarchyDetail'>

// ─── Barre SUDS visuelle ──────────────────────────────────────────────────────

interface SudsBarProps {
  value: number
}

function SudsBar({ value }: SudsBarProps) {
  const widthPct = `${value}%` as `${number}%`
  return (
    <View style={sudsStyles.row}>
      <Text style={sudsStyles.score}>{value}</Text>
      <View style={sudsStyles.track}>
        <View style={[sudsStyles.fill, { width: widthPct }]} />
      </View>
      <Text style={sudsStyles.max}>100</Text>
    </View>
  )
}

const sudsStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  score: { fontSize: 12, fontWeight: '700', color: colors.primary, minWidth: 24 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    opacity: 0.6,
  },
  max: { fontSize: 11, color: colors.textMuted },
})

// ─── Ligne item ───────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ExposureItem
  sessionCount: number
  onToggle: (id: string, isDone: boolean) => void
  onEdit: (item: ExposureItem) => void
  onDelete: (id: string) => void
  onAddSession: (item: ExposureItem) => void
  onViewHistory: (item: ExposureItem) => void
}

function ItemRow({ item, sessionCount, onToggle, onEdit, onDelete, onAddSession, onViewHistory }: ItemRowProps) {
  const { t } = useTranslation()
  return (
    <View style={itemStyles.card}>
      <Pressable
        style={itemStyles.check}
        onPress={() => onToggle(item.id, !item.is_done)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.is_done }}
        accessibilityLabel={t('modules.exposure_hierarchy.toggle_done')}
        hitSlop={8}
      >
        {item.is_done ? (
          <CheckCircle2 size={22} color={colors.primary} />
        ) : (
          <Circle size={22} color={colors.border} />
        )}
      </Pressable>

      <Pressable
        style={itemStyles.body}
        onPress={() => sessionCount > 0 ? onViewHistory(item) : onAddSession(item)}
        accessibilityRole="button"
      >
        <Text style={[itemStyles.description, item.is_done && itemStyles.doneText]}>
          {item.description}
        </Text>
        <SudsBar value={item.suds_score} />
        {sessionCount > 0 && (
          <View style={itemStyles.sessionChip}>
            <BarChart2 size={11} color={colors.primary} />
            <Text style={itemStyles.sessionChipText}>
              {sessionCount} séance{sessionCount > 1 ? 's' : ''} — voir l'évolution
            </Text>
          </View>
        )}
      </Pressable>

      <View style={itemStyles.actions}>
        <Pressable
          onPress={() => onAddSession(item)}
          hitSlop={8}
          accessibilityLabel={t('modules.exposure_hierarchy.history_add_session')}
        >
          <Plus size={15} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => onEdit(item)}
          hitSlop={8}
          accessibilityLabel={t('common.edit')}
        >
          <Pencil size={15} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={() => onDelete(item.id)}
          hitSlop={8}
          accessibilityLabel={t('common.delete')}
        >
          <Trash2 size={15} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  )
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  check: { paddingTop: 2 },
  body: { flex: 1, gap: 2 },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
  doneText: { color: colors.textMuted, textDecorationLine: 'line-through' },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  sessionChipText: { fontSize: 11, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingTop: 2 },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ExposureHierarchyDetailScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { hierarchyId } = route.params
  const { isTeenMode, teenColor } = useTeen()

  const [items, setItems] = useState<ExposureItem[]>([])
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      listExposureItems(hierarchyId).then((rows) => {
        if (!active) return
        setItems(rows)
        setLoading(false)
        countSessionsForItems(rows.map((it) => it.id)).then((counts) => {
          if (!active) return
          setSessionCounts(counts)
        })
      })
      return () => { active = false }
    }, [hierarchyId])
  )

  const handleToggle = useCallback(async (id: string, isDone: boolean) => {
    await toggleExposureItemDone(id, isDone)
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: isDone } : it)))
  }, [])

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('common.delete'),
      t('modules.exposure_hierarchy.delete_item_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteExposureItem(id)
            setItems((prev) => prev.filter((it) => it.id !== id))
          },
        },
      ]
    )
  }, [t])

  const handleEdit = useCallback((item: ExposureItem) => {
    navigation.navigate('ExposureHierarchyEntry', {
      hierarchyId,
      itemId: item.id,
    })
  }, [navigation, hierarchyId])

  const handleAddSession = useCallback((item: ExposureItem) => {
    navigation.navigate('ExposureSession', {
      itemId: item.id,
      hierarchyId,
    })
  }, [navigation, hierarchyId])

  const handleViewHistory = useCallback((item: ExposureItem) => {
    navigation.navigate('ExposureItemHistory', {
      itemId: item.id,
      hierarchyId,
      description: item.description,
      initialSuds: item.suds_score,
    })
  }, [navigation, hierarchyId])

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('exposure_hierarchy')} />

      {/* Légende SUDS */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          {t('modules.exposure_hierarchy.suds_legend')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              sessionCount={sessionCounts[item.id] ?? 0}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSession={handleAddSession}
              onViewHistory={handleViewHistory}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t('modules.exposure_hierarchy.items_empty_title')}
              </Text>
              <Text style={styles.emptyText}>
                {t('modules.exposure_hierarchy.items_empty_text')}
              </Text>
            </View>
          }
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('ExposureHierarchyEntry', { hierarchyId })}
          accessibilityRole="button"
          accessibilityLabel={t('modules.exposure_hierarchy.add_item')}
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.addBtnText}>
            {t('modules.exposure_hierarchy.add_item')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  legend: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  legendText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },

  list: { padding: spacing.md, paddingBottom: 100 },
  separator: { height: spacing.sm },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

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
