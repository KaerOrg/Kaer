import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import {
  getAllCrisisPlanItems,
  saveCrisisPlanItem,
  deleteCrisisPlanItem,
  generateId,
  CrisisPlanItem,
} from '../../lib/database'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'
import { Card } from '../../components/Card'
import { StatusBadge } from '../../components/StatusBadge'

type StepMeta = {
  readonly number: number
  readonly titleKey: string
  readonly hintKey: string
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  readonly bgColor: string
  readonly iconColor: string
}

const STEPS: ReadonlyArray<StepMeta> = [
  { number: 1, titleKey: 'modules.crisis_plan.step_1_title', hintKey: 'modules.crisis_plan.step_1_hint', icon: 'alert-circle-outline', bgColor: '#FFFBEB', iconColor: '#D97706' },
  { number: 2, titleKey: 'modules.crisis_plan.step_2_title', hintKey: 'modules.crisis_plan.step_2_hint', icon: 'heart-pulse', bgColor: '#ECFDF5', iconColor: '#059669' },
  { number: 3, titleKey: 'modules.crisis_plan.step_3_title', hintKey: 'modules.crisis_plan.step_3_hint', icon: 'account-group-outline', bgColor: '#EEF2FF', iconColor: '#4F46E5' },
  { number: 4, titleKey: 'modules.crisis_plan.step_4_title', hintKey: 'modules.crisis_plan.step_4_hint', icon: 'account-heart-outline', bgColor: '#FDF4FF', iconColor: '#9333EA' },
  { number: 5, titleKey: 'modules.crisis_plan.step_5_title', hintKey: 'modules.crisis_plan.step_5_hint', icon: 'hospital-box-outline', bgColor: '#EFF6FF', iconColor: '#1D4ED8' },
  { number: 6, titleKey: 'modules.crisis_plan.step_6_title', hintKey: 'modules.crisis_plan.step_6_hint', icon: 'shield-home-outline', bgColor: '#F0FDF4', iconColor: '#15803D' },
] as const

export default function CrisisPlanScreen() {
  const { t } = useTranslation()
  const { isTeenMode, tt, teenColor } = useTeen()
  const [items, setItems] = useState<CrisisPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<ReadonlySet<number>>(new Set())
  const [addingToStep, setAddingToStep] = useState<number | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const itemsByStep = useMemo(() => {
    const map = new Map<number, CrisisPlanItem[]>()
    for (const item of items) {
      const list = map.get(item.step_number) ?? []
      list.push(item)
      map.set(item.step_number, list)
    }
    return map
  }, [items])

  const loadItems = useCallback(async () => {
    const data = await getAllCrisisPlanItems()
    setItems(data)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { loadItems() }, [loadItems]))

  const toggleStep = useCallback((stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
        setAddingToStep((current) => (current === stepNumber ? null : current))
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }, [])

  const handleStartAdd = useCallback((stepNumber: number) => {
    setAddingToStep(stepNumber)
    setNewItemText('')
    setEditingId(null)
  }, [])

  const handleCancelAdd = useCallback(() => {
    setAddingToStep(null)
    setNewItemText('')
  }, [])

  const handleSaveNewItem = useCallback(async (stepNumber: number) => {
    const trimmed = newItemText.trim()
    if (!trimmed) return
    const existingItems = itemsByStep.get(stepNumber) ?? []
    await saveCrisisPlanItem({ id: generateId(), step_number: stepNumber, content: trimmed, position: existingItems.length })
    setAddingToStep(null)
    setNewItemText('')
    await loadItems()
  }, [newItemText, itemsByStep, loadItems])

  const handleStartEdit = useCallback((item: CrisisPlanItem) => {
    setEditingId(item.id)
    setEditText(item.content)
    setAddingToStep(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleSaveEdit = useCallback(async (item: CrisisPlanItem) => {
    const trimmed = editText.trim()
    if (!trimmed) return
    await saveCrisisPlanItem({ ...item, content: trimmed })
    setEditingId(null)
    setEditText('')
    await loadItems()
  }, [editText, loadItems])

  const handleDelete = useCallback((item: CrisisPlanItem) => {
    Alert.alert(t('modules.crisis_plan.delete_item_title'), `"${item.content}"`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteCrisisPlanItem(item.id); await loadItems() } },
    ])
  }, [loadItems, t])

  const handleCallEmergency = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`)
  }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('crisis_plan')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tt('crisis_plan', 'title')}</Text>
          <Text style={styles.headerSubtitle}>
            {isTeenMode ? tt('crisis_plan', 'subtitle') : t('modules.crisis_plan.subtitle')}
          </Text>
        </View>

        {STEPS.map((step) => {
          const stepItems = itemsByStep.get(step.number) ?? []
          const isExpanded = expandedSteps.has(step.number)

          return (
            <Card key={step.number}>
              <Pressable
                style={styles.stepHeader}
                onPress={() => toggleStep(step.number)}
                testID={`step-header-${step.number}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`${t('modules.crisis_plan.step_label', { number: step.number })} : ${t(step.titleKey)}`}
              >
                <View style={[styles.stepIconBg, { backgroundColor: step.bgColor }]}>
                  <MaterialCommunityIcons name={step.icon} size={22} color={step.iconColor} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>{t('modules.crisis_plan.step_label', { number: step.number })}</Text>
                  <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
                </View>
                <View style={styles.stepRight}>
                  {stepItems.length > 0 && <StatusBadge variant="info" label="" value={stepItems.length} />}
                  <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepHint}>{t(step.hintKey)}</Text>

                  {stepItems.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      {editingId === item.id ? (
                        <View style={styles.editContainer}>
                          <TextInput style={styles.textInput} value={editText} onChangeText={setEditText} autoFocus multiline testID={`edit-input-${item.id}`} />
                          <View style={styles.actionRow}>
                            <Pressable style={[styles.actionBtn, styles.validateBtn]} onPress={() => handleSaveEdit(item)} testID={`validate-edit-${item.id}`}>
                              <Text style={styles.validateBtnText}>{t('common.validate')}</Text>
                            </Pressable>
                            <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancelEdit}>
                              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="circle-small" size={20} color={step.iconColor} />
                          <Pressable style={styles.itemTextArea} onPress={() => handleStartEdit(item)}>
                            <Text style={styles.itemContent}>{item.content}</Text>
                          </Pressable>
                          <Pressable onPress={() => handleDelete(item)} hitSlop={8} testID={`delete-item-${item.id}`} accessibilityLabel={`${t('common.delete')} : ${item.content}`}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                          </Pressable>
                        </>
                      )}
                    </View>
                  ))}

                  {addingToStep === step.number ? (
                    <View style={styles.addForm}>
                      <TextInput style={styles.textInput} placeholder={t('modules.crisis_plan.item_placeholder')} value={newItemText} onChangeText={setNewItemText} autoFocus multiline testID="new-item-input" />
                      <View style={styles.actionRow}>
                        <Pressable style={[styles.actionBtn, styles.validateBtn]} onPress={() => handleSaveNewItem(step.number)} testID="validate-new-item">
                          <Text style={styles.validateBtnText}>{t('common.validate')}</Text>
                        </Pressable>
                        <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancelAdd} testID="cancel-new-item">
                          <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable style={styles.addBtn} onPress={() => handleStartAdd(step.number)} testID={`add-to-step-${step.number}`}>
                      <MaterialCommunityIcons name="plus" size={18} color={step.iconColor} />
                      <Text style={[styles.addBtnText, { color: step.iconColor }]}>{t('modules.crisis_plan.add_item')}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Card>
          )
        })}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.emergencyBar}>
        <View style={styles.emergencyRow}>
          <Pressable style={[styles.emergencyBtn, styles.emergencySamu]} onPress={() => handleCallEmergency('15')} testID="emergency-15" accessibilityRole="button" accessibilityLabel={t('modules.crisis_plan.emergency_samu_a11y')}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <View>
              <Text style={styles.emergencyNumber}>{t('modules.crisis_plan.emergency_samu')}</Text>
              <Text style={styles.emergencyLabel}>{t('modules.crisis_plan.emergency_samu_label')}</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.emergencyBtn, styles.emergency3114]} onPress={() => handleCallEmergency('3114')} testID="emergency-3114" accessibilityRole="button" accessibilityLabel={t('modules.crisis_plan.emergency_3114_a11y')}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <View>
              <Text style={styles.emergencyNumber}>{t('modules.crisis_plan.emergency_3114')}</Text>
              <Text style={styles.emergencyLabel}>{t('modules.crisis_plan.emergency_3114_label')}</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginBottom: spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  stepIconBg: { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepInfo: { flex: 1 },
  stepNumber: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepContent: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.sm },
  stepHint: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  itemTextArea: { flex: 1 },
  itemContent: { fontSize: 15, color: colors.text, lineHeight: 22 },
  editContainer: { flex: 1, gap: spacing.xs },
  addForm: { gap: spacing.xs, marginTop: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm, fontSize: 15, color: colors.text, minHeight: 44 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  validateBtn: { backgroundColor: colors.primary },
  validateBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  cancelBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, marginTop: spacing.xs },
  addBtnText: { fontSize: 14, fontWeight: '500' },
  emergencyBar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emergencyRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  emergencyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, gap: spacing.sm },
  emergencySamu: { backgroundColor: '#0D9488' },
  emergency3114: { backgroundColor: '#7C3AED' },
  emergencyNumber: { color: colors.white, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  emergencyLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 14 },
})
