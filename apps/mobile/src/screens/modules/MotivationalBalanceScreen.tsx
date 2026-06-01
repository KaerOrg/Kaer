import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { Info, Plus, Trash2, X } from 'lucide-react-native'
import type { PsyEduTopic } from '@psytool/shared'
import { ChevronRight } from 'lucide-react-native'
import { fetchTopicsByModule } from '../../services/psyeduService'
import { resolvePsyEduIcon } from '../../components/features/ModuleRenderer/layouts/PsyEdu/iconMap'
import {
  saveEMRuler,
  listEMRulers,
  deleteEMRuler,
  saveEMBalanceItem,
  listEMBalanceItems,
  deleteEMBalanceItem,
  saveEMValues,
  listEMValues,
} from '../../services/motivationalBalanceService'
import type { EMRuler, EMBalanceItem, EMValue } from '../../lib/database'
import { DisclaimerBanner } from '../../components/features/DisclaimerBanner'
import { TeenAccent } from '../../components/features/TeenAccent'
import { useTeen } from '../../hooks/useTeen'
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext'
import { colors, spacing, radius } from '../../theme'
import type { AppStackParamList } from '../../navigation/AppStack'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

const MODULE_KEY = 'motivational_balance'
type Tab = 'guides' | 'stage' | 'rulers' | 'balance'
type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Valeurs disponibles ──────────────────────────────────────────────────────

const VALUE_KEYS = [
  'family', 'health', 'freedom', 'work', 'relationships',
  'spirituality', 'creativity', 'autonomy', 'pleasure', 'security',
  'justice', 'growth',
] as const

// ─── Stades Prochaska ────────────────────────────────────────────────────────

const STAGE_NUMBERS = [1, 2, 3, 4, 5, 6] as const

// ─── Composant pip (slider discret 0–10) ─────────────────────────────────────

interface PipSliderProps {
  value: number | null
  onValueChange: (v: number) => void
  accent: string
}

const PipSlider = React.memo(function PipSlider({ value, onValueChange, accent }: PipSliderProps) {
  const pips = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <View style={pipStyles.row}>
      {pips.map(n => {
        const selected = n === value
        const filled = value !== null && n <= value
        return (
          <Pressable
            key={n}
            style={[
              pipStyles.pip,
              filled && { backgroundColor: accent + '33' },
              selected && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => onValueChange(n)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={String(n)}
          >
            <Text style={[pipStyles.label, selected && pipStyles.labelSelected]}>
              {n}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
})

const pipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.xs },
  pip: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  labelSelected: { color: '#fff', fontWeight: '700' },
})

// ─── Onglet Fiches ────────────────────────────────────────────────────────────

interface GuideRowProps {
  topic: PsyEduTopic
  accent: string | undefined
  onPress: () => void
}

const GuideRow = React.memo(function GuideRow({ topic, accent, onPress }: GuideRowProps) {
  const { t } = useTranslation('psyedu')
  const { isTeenMode } = useTeen()
  const Icon = resolvePsyEduIcon(topic.icon_name)
  const color = accent ?? colors.primary
  const title = isTeenMode
    ? (t(`${MODULE_KEY}.${topic.topic_key}.title`, { ns: 'psyedu_teen', defaultValue: '' }) ||
       t(`${MODULE_KEY}.${topic.topic_key}.title`))
    : t(`${MODULE_KEY}.${topic.topic_key}.title`)
  const summary = isTeenMode
    ? (t(`${MODULE_KEY}.${topic.topic_key}.summary`, { ns: 'psyedu_teen', defaultValue: '' }) ||
       t(`${MODULE_KEY}.${topic.topic_key}.summary`))
    : t(`${MODULE_KEY}.${topic.topic_key}.summary`)
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={onPress}
      testID={`guide-row-${topic.topic_key}`}
      accessibilityRole="button"
    >
      <View style={[s.rowIcon, { backgroundColor: color + '1A' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={s.rowText}>
        <Text style={s.rowTitle}>{title}</Text>
        {Boolean(summary) && (
          <Text style={s.rowSummary} numberOfLines={2}>{summary}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  )
})

// ─── Onglet Stade ────────────────────────────────────────────────────────────

interface StageTabProps {
  accent: string
  t: (key: string, options?: Record<string, unknown>) => string
  isTeenMode: boolean
}

function StageTab({ accent, t, isTeenMode }: StageTabProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [history, setHistory] = useState<EMRuler[]>([])
  const [saving, setSaving] = useState(false)
  const ns = isTeenMode ? 'teen' : 'common'
  const { showConfirm } = useConfirmDialog()

  useFocusEffect(
    useCallback(() => {
      listEMRulers(20).then(setHistory)
    }, [])
  )

  const saveStage = useCallback(async () => {
    if (selected === null) return
    setSaving(true)
    await saveEMRuler({
      id: uuidv4(),
      behavior_target: null,
      stage: selected,
      importance_score: null,
      importance_why: null,
      confidence_score: null,
      confidence_why: null,
      commitment_text: null,
    })
    const updated = await listEMRulers(20)
    setHistory(updated)
    setSelected(null)
    setSaving(false)
  }, [selected])

  const stageRulers = history.filter(r => r.stage !== null)

  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      <Text style={s.sectionTitle}>{t(`modules.${MODULE_KEY}.stage_title`)}</Text>
      <Text style={[s.sectionSubtitle, { marginBottom: spacing.md }]}>
        {t(`modules.${MODULE_KEY}.stage_subtitle` + (isTeenMode ? '' : ''), { ns })}
      </Text>
      {STAGE_NUMBERS.map(n => {
        const active = selected === n
        return (
          <Pressable
            key={n}
            style={[s.stageCard, active && { borderColor: accent, backgroundColor: accent + '12' }]}
            onPress={() => setSelected(n)}
            testID={`stage-card-${n}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <View style={[s.stageDot, { backgroundColor: active ? accent : colors.border }]} />
            <View style={s.stageText}>
              <Text style={[s.stageName, active && { color: accent }]}>
                {t(`modules.${MODULE_KEY}.stage_${n}`)}
              </Text>
              <Text style={s.stageDesc}>
                {t(`modules.${MODULE_KEY}.stage_${n}_desc`)}
              </Text>
            </View>
          </Pressable>
        )
      })}

      <Pressable
        style={[s.saveBtn, (!selected || saving) && s.saveBtnDisabled]}
        onPress={saveStage}
        disabled={!selected || saving}
        testID="stage-save-btn"
      >
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.saveBtnText}>{t(`modules.${MODULE_KEY}.rulers_save`)}</Text>
        }
      </Pressable>

      {stageRulers.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
            {t(`modules.${MODULE_KEY}.stage_history`)}
          </Text>
          {stageRulers.map(r => (
            <View key={r.id} style={s.historyRow}>
              <View style={[s.stageDotSm, { backgroundColor: accent }]} />
              <Text style={s.historyLabel}>
                {t(`modules.${MODULE_KEY}.stage_${r.stage}`)}
              </Text>
              <Text style={s.historyDate}>{r.created_at.slice(0, 10)}</Text>
              <Pressable
                onPress={() => showConfirm({
                  title: t(`modules.${MODULE_KEY}.rulers_delete_confirm`),
                  confirmLabel: t('common.delete'),
                  destructive: true,
                  onConfirm: async () => {
                    await deleteEMRuler(r.id)
                    setHistory(prev => prev.filter(x => x.id !== r.id))
                  },
                })}
                hitSlop={8}
                testID={`stage-delete-${r.id}`}
              >
                <Trash2 size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

// ─── Onglet Thermomètres ─────────────────────────────────────────────────────

interface RulersTabProps {
  accent: string
  t: (key: string, options?: Record<string, unknown>) => string
  isTeenMode: boolean
}

function RulersTab({ accent, t, isTeenMode }: RulersTabProps) {
  const [behaviorTarget, setBehaviorTarget] = useState('')
  const [importance, setImportance] = useState<number | null>(null)
  const [importanceWhy, setImportanceWhy] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [confidenceWhy, setConfidenceWhy] = useState('')
  const [commitment, setCommitment] = useState('')
  const [history, setHistory] = useState<EMRuler[]>([])
  const { showConfirm } = useConfirmDialog()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const ns = isTeenMode ? 'teen' : 'common'

  useFocusEffect(
    useCallback(() => {
      listEMRulers(20).then(rows => setHistory(rows.filter(r => r.importance_score !== null || r.confidence_score !== null)))
    }, [])
  )

  const save = useCallback(async () => {
    if (importance === null && confidence === null) return
    setSaving(true)
    await saveEMRuler({
      id: uuidv4(),
      behavior_target: behaviorTarget || null,
      stage: null,
      importance_score: importance,
      importance_why: importanceWhy || null,
      confidence_score: confidence,
      confidence_why: confidenceWhy || null,
      commitment_text: commitment || null,
    })
    const updated = await listEMRulers(20)
    setHistory(updated.filter(r => r.importance_score !== null || r.confidence_score !== null))
    setBehaviorTarget('')
    setImportance(null)
    setImportanceWhy('')
    setConfidence(null)
    setConfidenceWhy('')
    setCommitment('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [behaviorTarget, importance, importanceWhy, confidence, confidenceWhy, commitment])

  const hasData = importance !== null || confidence !== null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">
        <Text style={s.sectionTitle}>{t(`modules.${MODULE_KEY}.rulers_title`)}</Text>

        <Text style={s.fieldLabel}>{t(`modules.${MODULE_KEY}.rulers_behavior_label`)}</Text>
        <TextInput
          style={s.input}
          value={behaviorTarget}
          onChangeText={setBehaviorTarget}
          placeholder={t(`modules.${MODULE_KEY}.rulers_behavior_placeholder`)}
          placeholderTextColor={colors.textMuted}
          testID="rulers-behavior-input"
        />

        {/* Importance */}
        <View style={s.rulerCard}>
          <View style={s.rulerHeader}>
            <Text style={[s.rulerTitle, { color: accent }]}>
              {t(`modules.${MODULE_KEY}.rulers_importance`)}
            </Text>
            {importance !== null && (
              <Text style={[s.rulerScore, { color: accent }]}>{importance}/10</Text>
            )}
          </View>
          <Text style={s.rulerQuestion}>{t(`modules.${MODULE_KEY}.rulers_importance_q`)}</Text>
          <PipSlider value={importance} onValueChange={setImportance} accent={accent} />
          {importance !== null && (
            <>
              <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>
                {t(`modules.${MODULE_KEY}.rulers_importance_why_label`, { ns })}
              </Text>
              <TextInput
                style={s.textArea}
                value={importanceWhy}
                onChangeText={setImportanceWhy}
                placeholder={t(`modules.${MODULE_KEY}.rulers_importance_why_placeholder`, { ns })}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                testID="rulers-importance-why"
              />
            </>
          )}
        </View>

        {/* Confiance */}
        <View style={s.rulerCard}>
          <View style={s.rulerHeader}>
            <Text style={[s.rulerTitle, { color: accent }]}>
              {t(`modules.${MODULE_KEY}.rulers_confidence`)}
            </Text>
            {confidence !== null && (
              <Text style={[s.rulerScore, { color: accent }]}>{confidence}/10</Text>
            )}
          </View>
          <Text style={s.rulerQuestion}>{t(`modules.${MODULE_KEY}.rulers_confidence_q`, { ns })}</Text>
          <PipSlider value={confidence} onValueChange={setConfidence} accent={accent} />
          {confidence !== null && (
            <>
              <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>
                {t(`modules.${MODULE_KEY}.rulers_confidence_why_label`, { ns })}
              </Text>
              <TextInput
                style={s.textArea}
                value={confidenceWhy}
                onChangeText={setConfidenceWhy}
                placeholder={t(`modules.${MODULE_KEY}.rulers_confidence_why_placeholder`, { ns })}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                testID="rulers-confidence-why"
              />
            </>
          )}
        </View>

        {/* Engagement */}
        <View style={s.rulerCard}>
          <Text style={s.rulerTitle}>{t(`modules.${MODULE_KEY}.rulers_commitment_label`)}</Text>
          <TextInput
            style={s.textArea}
            value={commitment}
            onChangeText={setCommitment}
            placeholder={t(`modules.${MODULE_KEY}.rulers_commitment_placeholder`, { ns })}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            testID="rulers-commitment-input"
          />
        </View>

        {saved && (
          <Text style={s.savedMsg}>{t(`modules.${MODULE_KEY}.rulers_saved`)}</Text>
        )}

        <Pressable
          style={[s.saveBtn, (!hasData || saving) && s.saveBtnDisabled]}
          onPress={save}
          disabled={!hasData || saving}
          testID="rulers-save-btn"
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>{t(`modules.${MODULE_KEY}.rulers_save`)}</Text>
          }
        </Pressable>

        {/* Historique */}
        {history.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
              {t(`modules.${MODULE_KEY}.rulers_history`)}
            </Text>
            {history.map(r => (
              <View key={r.id} style={s.historyCard}>
                <View style={s.historyCardHeader}>
                  <Text style={s.historyDate}>{r.created_at.slice(0, 10)}</Text>
                  <Pressable
                    onPress={() => showConfirm({
                      title: t(`modules.${MODULE_KEY}.rulers_delete_confirm`),
                      confirmLabel: t('common.delete'),
                      destructive: true,
                      onConfirm: async () => {
                        await deleteEMRuler(r.id)
                        setHistory(prev => prev.filter(x => x.id !== r.id))
                      },
                    })}
                    hitSlop={8}
                    testID={`ruler-delete-${r.id}`}
                  >
                    <Trash2 size={14} color={colors.textMuted} />
                  </Pressable>
                </View>
                {r.behavior_target ? (
                  <Text style={s.historyBehavior} numberOfLines={1}>{r.behavior_target}</Text>
                ) : null}
                <View style={s.historyScores}>
                  {r.importance_score !== null && (
                    <Text style={[s.historyScore, { color: accent }]}>
                      {t(`modules.${MODULE_KEY}.rulers_importance`)} : {r.importance_score}/10
                    </Text>
                  )}
                  {r.confidence_score !== null && (
                    <Text style={[s.historyScore, { color: accent }]}>
                      {t(`modules.${MODULE_KEY}.rulers_confidence`)} : {r.confidence_score}/10
                    </Text>
                  )}
                </View>
                {r.commitment_text ? (
                  <Text style={s.historyCommitment}>💬 {r.commitment_text}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Onglet Balance ──────────────────────────────────────────────────────────

interface BalanceTabProps {
  accent: string
  t: (key: string, options?: Record<string, unknown>) => string
  isTeenMode: boolean
}

const WEIGHT_COLORS = ['#9CA3AF', '#F59E0B', '#EF4444'] as const

function BalanceTab({ accent, t, isTeenMode }: BalanceTabProps) {
  const [values, setValues] = useState<string[]>([])
  const [items, setItems] = useState<EMBalanceItem[]>([])
  const [newForText, setNewForText] = useState('')
  const [newAgainstText, setNewAgainstText] = useState('')
  const [saved, setSaved] = useState(false)
  const ns = isTeenMode ? 'teen' : 'common'

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      Promise.all([listEMValues(), listEMBalanceItems()]).then(([vals, its]) => {
        if (cancelled) return
        setValues(vals.map(v => v.value_key))
        setItems(its)
      })
      return () => { cancelled = true }
    }, [])
  )

  const toggleValue = useCallback((key: string) => {
    setValues(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 3) return prev
      return [...prev, key]
    })
  }, [])

  const saveValues = useCallback(async () => {
    await saveEMValues(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [values])

  const addItem = useCallback(async (side: 'for' | 'against') => {
    const text = side === 'for' ? newForText.trim() : newAgainstText.trim()
    if (!text) return
    const newItem: EMBalanceItem = {
      id: uuidv4(),
      behavior_target: '',
      side,
      text,
      weight: 1,
      sort_order: items.filter(i => i.side === side).length,
      created_at: new Date().toISOString(),
    }
    await saveEMBalanceItem(newItem)
    setItems(prev => [...prev, newItem])
    if (side === 'for') setNewForText('')
    else setNewAgainstText('')
  }, [newForText, newAgainstText, items])

  const updateWeight = useCallback(async (id: string, weight: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const updated = { ...item, weight }
    await saveEMBalanceItem(updated)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }, [items])

  const removeItem = useCallback(async (id: string) => {
    await deleteEMBalanceItem(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const forItems = items.filter(i => i.side === 'for')
  const againstItems = items.filter(i => i.side === 'against')

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">

        {/* Valeurs */}
        <Text style={s.sectionTitle}>{t(`modules.${MODULE_KEY}.balance_values_title`)}</Text>
        <Text style={[s.sectionSubtitle, { marginBottom: spacing.sm }]}>
          {t(`modules.${MODULE_KEY}.balance_values_subtitle`, { ns })}
        </Text>
        <View style={s.valuesGrid}>
          {VALUE_KEYS.map(key => {
            const selected = values.includes(key)
            return (
              <Pressable
                key={key}
                style={[s.valueChip, selected && { backgroundColor: accent, borderColor: accent }]}
                onPress={() => toggleValue(key)}
                testID={`value-chip-${key}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <Text style={[s.valueChipText, selected && { color: '#fff' }]}>
                  {t(`modules.${MODULE_KEY}.values_${key}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Pressable style={[s.saveBtn, s.saveBtnSecondary]} onPress={saveValues} testID="values-save-btn">
          <Text style={[s.saveBtnText, { color: accent }]}>
            {t(`modules.${MODULE_KEY}.balance_values_save`)}
          </Text>
        </Pressable>
        {saved && <Text style={s.savedMsg}>{t(`modules.${MODULE_KEY}.balance_saved`)}</Text>}

        {/* Colonnes balance */}
        <View style={s.balanceCols}>
          {/* Pour changer */}
          <View style={s.balanceCol}>
            <Text style={[s.balanceColTitle, { color: accent }]}>
              {t(`modules.${MODULE_KEY}.balance_for`)}
            </Text>
            {forItems.length === 0 && (
              <Text style={s.emptyColText}>{t(`modules.${MODULE_KEY}.balance_no_items`)}</Text>
            )}
            {forItems.map(item => (
              <BalanceItemRow
                key={item.id}
                item={item}
                accent={accent}
                onWeightChange={w => updateWeight(item.id, w)}
                onDelete={() => removeItem(item.id)}
              />
            ))}
            <View style={s.addRow}>
              <TextInput
                style={s.addInput}
                value={newForText}
                onChangeText={setNewForText}
                placeholder={t(`modules.${MODULE_KEY}.balance_item_placeholder`, { ns })}
                placeholderTextColor={colors.textMuted}
                testID="balance-for-input"
                returnKeyType="done"
                onSubmitEditing={() => addItem('for')}
              />
              <Pressable
                style={[s.addBtn, { backgroundColor: accent }]}
                onPress={() => addItem('for')}
                testID="balance-for-add"
              >
                <Plus size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Contre changer */}
          <View style={s.balanceCol}>
            <Text style={[s.balanceColTitle, { color: colors.textMuted }]}>
              {t(`modules.${MODULE_KEY}.balance_against`)}
            </Text>
            {againstItems.length === 0 && (
              <Text style={s.emptyColText}>{t(`modules.${MODULE_KEY}.balance_no_items`)}</Text>
            )}
            {againstItems.map(item => (
              <BalanceItemRow
                key={item.id}
                item={item}
                accent={colors.textMuted}
                onWeightChange={w => updateWeight(item.id, w)}
                onDelete={() => removeItem(item.id)}
              />
            ))}
            <View style={s.addRow}>
              <TextInput
                style={s.addInput}
                value={newAgainstText}
                onChangeText={setNewAgainstText}
                placeholder={t(`modules.${MODULE_KEY}.balance_item_placeholder`, { ns })}
                placeholderTextColor={colors.textMuted}
                testID="balance-against-input"
                returnKeyType="done"
                onSubmitEditing={() => addItem('against')}
              />
              <Pressable
                style={[s.addBtn, { backgroundColor: colors.border }]}
                onPress={() => addItem('against')}
                testID="balance-against-add"
              >
                <Plus size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface BalanceItemRowProps {
  item: EMBalanceItem
  accent: string
  onWeightChange: (w: number) => void
  onDelete: () => void
}

const BalanceItemRow = React.memo(function BalanceItemRow({
  item, accent, onWeightChange, onDelete,
}: BalanceItemRowProps) {
  return (
    <View style={s.balanceItem}>
      <Text style={s.balanceItemText} numberOfLines={3}>{item.text}</Text>
      <View style={s.balanceItemFooter}>
        <View style={s.weightRow}>
          {[1, 2, 3].map(w => (
            <Pressable
              key={w}
              onPress={() => onWeightChange(w)}
              hitSlop={4}
              testID={`weight-${item.id}-${w}`}
            >
              <View style={[
                s.weightDot,
                { backgroundColor: w <= item.weight ? WEIGHT_COLORS[w - 1] : colors.border },
              ]} />
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onDelete} hitSlop={8} testID={`balance-delete-${item.id}`}>
          <Trash2 size={14} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  )
})

// ─── Modal sources "i" ───────────────────────────────────────────────────────

interface InfoModalProps {
  visible: boolean
  onClose: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function InfoModal({ visible, onClose, t }: InfoModalProps) {
  const sources = [
    'info_miller', 'info_prochaska', 'info_sdt', 'info_has', 'info_nice',
  ] as const
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={infoStyles.overlay} onPress={onClose}>
        <Pressable style={infoStyles.sheet} onPress={e => e.stopPropagation()}>
          <View style={infoStyles.header}>
            <Text style={infoStyles.title}>{t(`modules.${MODULE_KEY}.info_title`)}</Text>
            <Pressable onPress={onClose} hitSlop={8} testID="info-close-btn">
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          {sources.map(key => (
            <View key={key} style={infoStyles.sourceRow}>
              <View style={infoStyles.dot} />
              <Text style={infoStyles.sourceText}>
                {t(`modules.${MODULE_KEY}.${key}`)}
              </Text>
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const infoStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  sourceText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MotivationalBalanceScreen() {
  const navigation = useNavigation<Nav>()
  const { t } = useTranslation()
  const { isTeenMode, teenColor } = useTeen()
  const accent = teenColor(MODULE_KEY) ?? '#0EA5E9'

  const [activeTab, setActiveTab] = useState<Tab>('guides')
  const [topics, setTopics] = useState<PsyEduTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [infoVisible, setInfoVisible] = useState(false)

  // Bouton "i" dans le header
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setLoadingTopics(true)
      fetchTopicsByModule(MODULE_KEY)
        .then(data => { if (!cancelled) { setTopics(data); setLoadingTopics(false) } })
        .catch(() => { if (!cancelled) setLoadingTopics(false) })
      return () => { cancelled = true }
    }, [])
  )

  const TABS: { key: Tab; labelKey: string }[] = [
    { key: 'guides',  labelKey: `modules.${MODULE_KEY}.tab_guides` },
    { key: 'stage',   labelKey: `modules.${MODULE_KEY}.tab_stage` },
    { key: 'rulers',  labelKey: `modules.${MODULE_KEY}.tab_rulers` },
    { key: 'balance', labelKey: `modules.${MODULE_KEY}.tab_balance` },
  ]

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={{ flex: 1 }} testID="mb-screen">
      <TeenAccent color={teenColor(MODULE_KEY)} />
      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} t={t} />

      <DisclaimerBanner moduleKey={MODULE_KEY} isTeenMode={isTeenMode} />

      {/* Tab bar + bouton info */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && { borderBottomColor: accent, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.key)}
            testID={`tab-${tab.key}`}
          >
            <Text style={[s.tabLabel, activeTab === tab.key && { color: accent, fontWeight: '700' }]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setInfoVisible(true)}
          hitSlop={8}
          style={s.tabInfoBtn}
          testID="info-btn"
          accessibilityLabel={t(`modules.${MODULE_KEY}.info_title`)}
        >
          <Info size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Onglet Fiches */}
      {activeTab === 'guides' && (
        loadingTopics
          ? <View style={s.center}><ActivityIndicator color={accent} size="large" /></View>
          : (
            <ScrollView contentContainerStyle={s.tabContent}>
              {topics.map(topic => (
                <GuideRow
                  key={topic.id}
                  topic={topic}
                  accent={accent}
                  onPress={() =>
                    navigation.navigate('MotivationalBalanceDetail', {
                      topicId: topic.id,
                      topicKey: topic.topic_key,
                    })
                  }
                />
              ))}
            </ScrollView>
          )
      )}

      {/* Onglet Stade */}
      {activeTab === 'stage' && (
        <StageTab accent={accent} t={t} isTeenMode={isTeenMode} />
      )}

      {/* Onglet Thermomètres */}
      {activeTab === 'rulers' && (
        <RulersTab accent={accent} t={t} isTeenMode={isTeenMode} />
      )}

      {/* Onglet Balance */}
      {activeTab === 'balance' && (
        <BalanceTab accent={accent} t={t} isTeenMode={isTeenMode} />
      )}
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tabBtn: {
    flex: 1, paddingVertical: spacing.sm,
    alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  tabInfoBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },

  // Tab content
  tabContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },

  // Rows generics
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSummary: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // Titres sections
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // Stade
  stageCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
  },
  stageDot: { width: 12, height: 12, borderRadius: 6 },
  stageDotSm: { width: 8, height: 8, borderRadius: 4 },
  stageText: { flex: 1 },
  stageName: { fontSize: 14, fontWeight: '600', color: colors.text },
  stageDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Rulers
  rulerCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    gap: spacing.xs,
  },
  rulerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rulerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rulerScore: { fontSize: 20, fontWeight: '800' },
  rulerQuestion: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  // Balance
  balanceCols: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  balanceCol: { flex: 1, gap: spacing.xs },
  balanceColTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
  balanceItem: {
    backgroundColor: colors.card, borderRadius: radius.sm,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
    gap: 4,
  },
  balanceItemText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  balanceItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weightRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  weightDot: { width: 10, height: 10, borderRadius: 5 },
  addRow: { flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  addInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    fontSize: 13, color: colors.text,
  },
  addBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyColText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: spacing.sm },

  // Values
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  valueChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  valueChipText: { fontSize: 13, color: colors.text },

  // Form
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.text,
  },
  textArea: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.text, minHeight: 72, textAlignVertical: 'top',
  },

  // Save
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnSecondary: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  savedMsg: { fontSize: 13, color: colors.primary, textAlign: 'center', marginTop: spacing.xs },

  // History
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.sm,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  historyLabel: { flex: 1, fontSize: 13, color: colors.text },
  historyDate: { fontSize: 12, color: colors.textMuted },
  historyBehavior: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  historyCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyScores: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  historyScore: { fontSize: 14, fontWeight: '700' },
  historyCommitment: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
})
