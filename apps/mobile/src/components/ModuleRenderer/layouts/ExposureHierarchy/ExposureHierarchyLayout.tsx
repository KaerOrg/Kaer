import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../../../../theme'
import {
  listExposureHierarchies,
  createExposureHierarchy,
  deleteExposureHierarchy,
  getAllFearSituations,
  saveFearSituation,
  deleteFearSituation,
  getAllFearEntries,
  generateId,
  type ExposureHierarchy,
  type FearSituation,
  type FearEntry,
} from '../../../../lib/database'
import { PipPicker } from '../../../PipPicker'
import { DesensitizationChart, ChartLegend, type SudsPoint } from '../../../Chart'

type Mode =
  | { kind: 'hierarchies' }
  | { kind: 'items'; hierarchyId: string; hierarchyTitle: string }
  | { kind: 'item_form'; hierarchyId: string; itemId: string | null }
  | { kind: 'item_history'; itemId: string; itemLabel: string; targetSuds: number }

const SUDS_STEPS_0_100 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

interface Props {
  moduleId: string
}

// Layout 'exposure_hierarchy' — hiérarchies d'exposition graduées (TCC).
// Le patient crée des hiérarchies thématiques (ex. phobie sociale), y
// ajoute des situations classées par SUDs cible, et logge des séances par
// situation. Le chart affiche la progression des séances par situation.
//
// MDR : aucun seuil interprétatif. SUDs et progression affichés bruts.
export function ExposureHierarchyLayout({ moduleId }: Props) {
  const { t } = useTranslation()

  const [mode, setMode] = useState<Mode>({ kind: 'hierarchies' })
  const [loading, setLoading] = useState(true)
  const [hierarchies, setHierarchies] = useState<readonly ExposureHierarchy[]>([])
  const [situations, setSituations] = useState<readonly FearSituation[]>([])
  const [entries, setEntries] = useState<readonly FearEntry[]>([])

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const [itemLabel, setItemLabel] = useState('')
  const [itemSuds, setItemSuds] = useState(50)

  const reload = useCallback(async () => {
    const [h, s, e] = await Promise.all([
      listExposureHierarchies(moduleId),
      getAllFearSituations(),
      getAllFearEntries(),
    ])
    setHierarchies(h)
    setSituations(s)
    setEntries(e)
    setLoading(false)
  }, [moduleId])

  useEffect(() => {
    void reload()
  }, [reload])

  // ── Hierarchies mode ──────────────────────────────────────────────────
  const handleCreateHierarchy = useCallback(async () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    await createExposureHierarchy({ id: generateId(), module_id: moduleId, title: trimmed })
    setNewTitle('')
    setCreateModalVisible(false)
    void reload()
  }, [newTitle, moduleId, reload])

  const handleDeleteHierarchy = useCallback(
    (h: ExposureHierarchy) => {
      Alert.alert(
        t('common.delete'),
        t('common.irreversible'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteExposureHierarchy(h.id)
              void reload()
            },
          },
        ]
      )
    },
    [reload, t]
  )

  // ── Items mode ────────────────────────────────────────────────────────
  const itemsOfActiveHierarchy = useMemo(() => {
    if (mode.kind !== 'items' && mode.kind !== 'item_form') return []
    return situations.filter(s => s.hierarchy_id === mode.hierarchyId)
  }, [situations, mode])

  const handleSaveItem = useCallback(async () => {
    if (mode.kind !== 'item_form') return
    const trimmed = itemLabel.trim()
    if (!trimmed) return
    const id = mode.itemId ?? generateId()
    await saveFearSituation({
      id,
      label: trimmed,
      hierarchy_id: mode.hierarchyId,
      target_suds: itemSuds,
      is_done: 0,
    })
    setItemLabel('')
    setItemSuds(50)
    const hierarchyTitle = hierarchies.find(h => h.id === mode.hierarchyId)?.title ?? ''
    setMode({ kind: 'items', hierarchyId: mode.hierarchyId, hierarchyTitle })
    void reload()
  }, [mode, itemLabel, itemSuds, hierarchies, reload])

  const handleDeleteItem = useCallback(
    (s: FearSituation) => {
      Alert.alert(
        t('common.delete'),
        t('common.irreversible'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteFearSituation(s.id)
              void reload()
            },
          },
        ]
      )
    },
    [reload, t]
  )

  // ── Item history mode ─────────────────────────────────────────────────
  const sessionsForActiveItem = useMemo<readonly SudsPoint[]>(() => {
    if (mode.kind !== 'item_history') return []
    return entries
      .filter(e => e.situation_id === mode.itemId)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => ({ score: e.suds_after ?? e.suds_before, date: e.date }))
  }, [entries, mode])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // ── Mode : hiérarchies ────────────────────────────────────────────────
  if (mode.kind === 'hierarchies') {
    return (
      <View style={styles.container} testID="exposure-hierarchies-mode">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {hierarchies.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('modules.exposure_hierarchy.empty_text')}
              </Text>
            </View>
          ) : (
            hierarchies.map(h => {
              const itemCount = situations.filter(s => s.hierarchy_id === h.id).length
              return (
                <Pressable
                  key={h.id}
                  style={styles.row}
                  onPress={() =>
                    setMode({ kind: 'items', hierarchyId: h.id, hierarchyTitle: h.title })
                  }
                  testID={`hierarchy-${h.id}`}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{h.title}</Text>
                    <Text style={styles.rowSubtitle}>
                      {itemCount} {t('modules.exposure_hierarchy.items_count', { count: itemCount })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteHierarchy(h)}
                    hitSlop={8}
                    accessibilityLabel={t('common.delete')}
                    testID={`delete-hierarchy-${h.id}`}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </Pressable>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              )
            })
          )}
        </ScrollView>
        <Pressable
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
          testID="add-hierarchy-fab"
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.fabLabel}>
            {t('modules.exposure_hierarchy.add_hierarchy')}
          </Text>
        </Pressable>

        <Modal visible={createModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {t('modules.exposure_hierarchy.add_hierarchy')}
              </Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder={t('modules.exposure_hierarchy.new_hierarchy_placeholder')}
                placeholderTextColor={colors.textMuted}
                testID="hierarchy-title-input"
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.btnSecondary}
                  onPress={() => {
                    setNewTitle('')
                    setCreateModalVisible(false)
                  }}
                >
                  <Text style={styles.btnSecondaryText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={styles.btnPrimary}
                  onPress={handleCreateHierarchy}
                  testID="confirm-create-hierarchy"
                >
                  <Text style={styles.btnPrimaryText}>{t('common.create')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    )
  }

  // ── Mode : items d'une hiérarchie ─────────────────────────────────────
  if (mode.kind === 'items') {
    return (
      <View style={styles.container} testID="exposure-items-mode">
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => setMode({ kind: 'hierarchies' })}
            hitSlop={8}
            testID="back-to-hierarchies"
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{mode.hierarchyTitle}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {itemsOfActiveHierarchy.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('modules.exposure_hierarchy.items_empty_text')}
              </Text>
            </View>
          ) : (
            itemsOfActiveHierarchy.map(s => {
              const itemSessions = entries.filter(e => e.situation_id === s.id).length
              return (
                <Pressable
                  key={s.id}
                  style={styles.row}
                  onPress={() => setMode({
                    kind: 'item_history',
                    itemId: s.id,
                    itemLabel: s.label,
                    targetSuds: s.target_suds ?? 50,
                  })}
                  testID={`item-${s.id}`}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{s.label}</Text>
                    <Text style={styles.rowSubtitle}>
                      SUDs {s.target_suds ?? '—'} · {itemSessions} {t('modules.exposure_hierarchy.sessions_count', { count: itemSessions })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteItem(s)}
                    hitSlop={8}
                    testID={`delete-item-${s.id}`}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </Pressable>
                </Pressable>
              )
            })
          )}
        </ScrollView>
        <Pressable
          style={styles.fab}
          onPress={() => setMode({
            kind: 'item_form',
            hierarchyId: mode.hierarchyId,
            itemId: null,
          })}
          testID="add-item-fab"
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.fabLabel}>
            {t('modules.exposure_hierarchy.add_item')}
          </Text>
        </Pressable>
      </View>
    )
  }

  // ── Mode : item form (création) ───────────────────────────────────────
  if (mode.kind === 'item_form') {
    const hierarchyTitle =
      hierarchies.find(h => h.id === mode.hierarchyId)?.title ?? ''
    return (
      <View style={styles.container} testID="exposure-item-form-mode">
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => setMode({
              kind: 'items',
              hierarchyId: mode.hierarchyId,
              hierarchyTitle,
            })}
            hitSlop={8}
            testID="back-to-items"
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {t('modules.exposure_hierarchy.add_item')}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.formLabel}>
            {t('modules.exposure_hierarchy.description_label')}
          </Text>
          <TextInput
            style={styles.input}
            value={itemLabel}
            onChangeText={setItemLabel}
            placeholder={t('modules.exposure_hierarchy.description_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            testID="item-label-input"
          />
          <Text style={styles.formLabel}>
            {t('modules.exposure_hierarchy.suds_label')}
          </Text>
          <PipPicker
            value={itemSuds}
            onPress={setItemSuds}
            steps={SUDS_STEPS_0_100}
            color={colors.primary}
            variant="track"
            showEndLabels
          />
        </ScrollView>
        <Pressable
          style={[styles.fab, styles.fabFull]}
          onPress={handleSaveItem}
          testID="save-item"
        >
          <Text style={styles.fabLabel}>{t('common.save')}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Mode : historique d'un item ───────────────────────────────────────
  return (
    <View style={styles.container} testID="exposure-item-history-mode">
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => {
            const h = hierarchies.find(
              hh => situations.find(s => s.id === mode.itemId)?.hierarchy_id === hh.id
            )
            setMode(
              h
                ? { kind: 'items', hierarchyId: h.id, hierarchyTitle: h.title }
                : { kind: 'hierarchies' }
            )
          }}
          hitSlop={8}
          testID="back-to-items-from-history"
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{mode.itemLabel}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.chartCard}>
          {sessionsForActiveItem.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('modules.exposure_hierarchy.history_no_sessions')}
            </Text>
          ) : (
            <>
              <DesensitizationChart
                points={sessionsForActiveItem}
                referenceScore={mode.targetSuds}
                width={300}
                accentColor={colors.primary}
              />
              <ChartLegend accentColor={colors.primary} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: { padding: spacing.md, paddingBottom: 100, gap: spacing.sm },
  formContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fabFull: { paddingVertical: spacing.md },
  fabLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  btnPrimaryText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  btnSecondary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 44,
  },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
})
