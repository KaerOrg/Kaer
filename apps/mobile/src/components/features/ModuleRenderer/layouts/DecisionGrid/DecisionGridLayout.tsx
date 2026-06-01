import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, ScrollView, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors } from '../../../../../theme'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { useAuthStore } from '../../../../../store/authStore'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { logEvent, type EngagementEventType } from '../../../../../services/engagementService'
import {
  generateId,
  getAllPlanItemsForModule,
  savePlanItem,
  deletePlanItem,
  getModuleSetting,
  setModuleSetting,
  type PlanItem,
} from '../../../../../lib/database'
import type { ContentField } from '../../../../../services/moduleService'
import { QuadrantCard } from './QuadrantCard'
import { MotivationGauge } from './MotivationGauge'
import { dgStyles } from './styles'

export interface DecisionGridLayoutProps {
  fields: ReadonlyArray<ContentField>
  moduleId: string
}

interface QuadrantSpec {
  sectionId: string
  title: string
  subtitle: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  accentColor: string
  bgColor: string
  /** When set, this quadrant's weights contribute to that side of the gauge. */
  gaugeRole: 'change' | 'status_quo' | null
}

/**
 * Decision grid layout (preview_kind = 'decision_grid').
 *
 * 2×2 grid of editable quadrants. Each quadrant holds a dynamic list of items
 * with a weight (1..N stars). A top-level text input captures the target
 * behavior. A bottom motivation gauge displays a raw arithmetic ratio of
 * weights — no clinical interpretation (MDR-conformant).
 *
 * Persistence:
 *   - Items: plan_items (one row per argument, keyed by module_id + section_id)
 *   - Target behavior: module_settings (single key/value pair per patient)
 */
export function DecisionGridLayout({ fields, moduleId }: DecisionGridLayoutProps) {
  const t = useModuleT()
  const { i18n } = useTranslation()
  const patient = useAuthStore((s) => s.patient)
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  // ── Configuration ──────────────────────────────────────────────────────────
  const configField = useMemo(() => fields.find((f) => f.field_type === 'decision_grid_config'), [fields])

  const lbl = useCallback((key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }, [configField, t])
  const engagementEventType = (configField?.props['engagement_event_type'] ?? '') as EngagementEventType | ''
  const targetBehaviorKey = (configField?.props['target_behavior_key'] ?? 'target_behavior') as string
  const weightMin = parseInt(configField?.props['weight_min'] ?? '1', 10)
  const weightMax = parseInt(configField?.props['weight_max'] ?? '5', 10)
  const weightDefault = parseInt(configField?.props['weight_default'] ?? String(Math.round((weightMin + weightMax) / 2)), 10)
  const fillColor = (configField?.props['gauge_fill_color'] ?? colors.primary) as string

  const weightConfig = useMemo(() => ({
    min: weightMin,
    max: weightMax,
    defaultValue: weightDefault,
    label: lbl('weight_label') || undefined,
  }), [weightMin, weightMax, weightDefault, lbl])

  // ── Quadrants (sorted by sort_order of their column_header) ────────────────
  const quadrants = useMemo<QuadrantSpec[]>(() => {
    const headers = fields
      .filter((f) => f.field_type === 'column_header' && f.section_id != null)
      .sort((a, b) => a.sort_order - b.sort_order)
    return headers.map((h) => {
      const subtitleCode = h.props['subtitle_code']
      const role = h.props['gauge_role']
      const gaugeRole = role === 'change' ? 'change' : role === 'status_quo' ? 'status_quo' : null
      return {
        sectionId: h.section_id!,
        title: h.text_code ? t(h.text_code) : '',
        subtitle: subtitleCode ? t(subtitleCode) : '',
        icon: (h.props['icon'] ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
        accentColor: h.props['color'] ?? colors.primary,
        bgColor: h.props['bg_color'] ?? '#F3F4F6',
        gaugeRole,
      }
    })
  }, [fields, t, i18n.language])

  // ── State ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<ReadonlyArray<PlanItem>>([])
  const [targetBehavior, setTargetBehavior] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      getAllPlanItemsForModule(moduleId),
      getModuleSetting(moduleId, targetBehaviorKey),
    ]).then(([loadedItems, loadedBehavior]) => {
      if (!active) return
      setItems(loadedItems)
      setTargetBehavior(loadedBehavior ?? '')
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [moduleId, targetBehaviorKey])

  // Items grouped by section_id for fast lookup.
  const itemsBySection = useMemo(() => {
    const map = new Map<string, PlanItem[]>()
    for (const item of items) {
      const list = map.get(item.section_id) ?? []
      list.push(item)
      map.set(item.section_id, list)
    }
    return map
  }, [items])

  // ── Score computation (pure arithmetic on user-assigned weights) ──────────
  const scores = useMemo(() => {
    let changeScore = 0
    let statusQuoScore = 0
    for (const q of quadrants) {
      if (!q.gaugeRole) continue
      const list = itemsBySection.get(q.sectionId) ?? []
      const sum = list.reduce((acc, item) => acc + (item.weight ?? 0), 0)
      if (q.gaugeRole === 'change') changeScore += sum
      else statusQuoScore += sum
    }
    return { changeScore, statusQuoScore }
  }, [quadrants, itemsBySection])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const handleAdd = useCallback(async (sectionId: string, text: string, weight: number | null) => {
    const existingItems = itemsBySection.get(sectionId) ?? []
    const newItem: PlanItem = {
      id: generateId(),
      module_id: moduleId,
      section_id: sectionId,
      text,
      sort_order: existingItems.length,
      weight,
      created_at: new Date().toISOString(),
    }
    await savePlanItem(newItem)
    setItems((prev) => [...prev, newItem])
  }, [itemsBySection, moduleId])

  const handleEdit = useCallback(async (item: PlanItem, text: string, weight: number | null) => {
    const updated: PlanItem = { ...item, text, weight }
    await savePlanItem(updated)
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
  }, [])

  const handleDelete = useCallback((item: PlanItem) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: `"${item.text}"`,
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deletePlanItem(item.id)
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      },
    })
  }, [lbl, t, showConfirm])

  // ── Save (target behavior + engagement signal) ────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await setModuleSetting(moduleId, targetBehaviorKey, targetBehavior.trim())
      if (patient?.id && engagementEventType) {
        await logEvent(patient.id, engagementEventType as EngagementEventType, {})
      }
      const savedMessage = lbl('saved_message')
      showToast(savedMessage || t('common.saved'), 'success')
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [moduleId, targetBehaviorKey, targetBehavior, patient, engagementEventType, lbl, t, showToast])

  if (loading) {
    return <View style={dgStyles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const targetLabel = lbl('target_label')
  const targetPlaceholder = lbl('target_placeholder')
  const saveLabel = lbl('save_label') || t('common.save')
  const addLabel = lbl('add_label') || t('common.add')
  const argPlaceholder = lbl('arg_placeholder')
  const gaugeTitle = lbl('gauge_title')
  const gaugeChangeLabel = lbl('gauge_change_label')
  const gaugeStatusLabel = lbl('gauge_status_label')

  // Distribute quadrants into rows of 2 — robust to any number of quadrants,
  // but designed for the canonical 4-quadrant decisional balance.
  const rows: QuadrantSpec[][] = []
  for (let i = 0; i < quadrants.length; i += 2) {
    rows.push(quadrants.slice(i, i + 2))
  }

  const showGauge = quadrants.some((q) => q.gaugeRole != null)

  return (
    <KeyboardAvoidingView
      style={dgStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        style={dgStyles.scroll}
        contentContainerStyle={dgStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {targetLabel ? (
          <View style={dgStyles.behaviorSection}>
            <Text style={dgStyles.behaviorLabel}>{targetLabel}</Text>
            <TextInput
              style={dgStyles.behaviorInput}
              placeholder={targetPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={targetBehavior}
              onChangeText={setTargetBehavior}
              testID="target-behavior-input"
            />
          </View>
        ) : null}

        <View style={dgStyles.grid}>
          {rows.map((row, idx) => (
            <View key={`row-${idx}`} style={dgStyles.gridRow}>
              {row.map((q) => (
                <QuadrantCard
                  key={q.sectionId}
                  sectionId={q.sectionId}
                  title={q.title}
                  subtitle={q.subtitle}
                  icon={q.icon}
                  accentColor={q.accentColor}
                  bgColor={q.bgColor}
                  items={itemsBySection.get(q.sectionId) ?? []}
                  weightConfig={weightConfig}
                  addLabel={addLabel}
                  placeholder={argPlaceholder}
                  onAdd={handleAdd}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          ))}
        </View>

        {showGauge && gaugeTitle ? (
          <MotivationGauge
            title={gaugeTitle}
            changeLabel={gaugeChangeLabel}
            statusLabel={gaugeStatusLabel}
            changeScore={scores.changeScore}
            statusQuoScore={scores.statusQuoScore}
            fillColor={fillColor}
          />
        ) : null}
      </ScrollView>

      <View style={dgStyles.footer}>
        <Pressable
          style={[dgStyles.saveBtn, saving && dgStyles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          testID="save-decision-grid"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
              <Text style={dgStyles.saveBtnText}>{saveLabel}</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
