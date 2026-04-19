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

// ─── Métadonnées des 6 étapes (Stanley & Brown, 2012) ─────────────────────────

type StepMeta = {
  readonly number: number
  readonly title: string
  readonly hint: string
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  readonly bgColor: string
  readonly iconColor: string
}

const STEPS: ReadonlyArray<StepMeta> = [
  {
    number: 1,
    title: 'Signes avant-coureurs',
    hint: 'Comment est-ce que je me sens quand une crise approche ?',
    icon: 'alert-circle-outline',
    bgColor: '#FFFBEB',
    iconColor: '#D97706',
  },
  {
    number: 2,
    title: "Stratégies d'apaisement internes",
    hint: 'Que puis-je faire seul(e) pour me calmer ?',
    icon: 'heart-pulse',
    bgColor: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    number: 3,
    title: 'Personnes ou lieux de distraction',
    hint: 'Qui puis-je voir ou où puis-je aller pour me distraire ?',
    icon: 'account-group-outline',
    bgColor: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    number: 4,
    title: 'Proches à contacter',
    hint: "Qui peut m'écouter et m'aider si je me sens en danger ?",
    icon: 'account-heart-outline',
    bgColor: '#FDF4FF',
    iconColor: '#9333EA',
  },
  {
    number: 5,
    title: 'Professionnels et urgences',
    hint: 'Quels professionnels ou services puis-je contacter ?',
    icon: 'hospital-box-outline',
    bgColor: '#EFF6FF',
    iconColor: '#1D4ED8',
  },
  {
    number: 6,
    title: 'Sécuriser mon environnement',
    hint: 'Comment rendre mon entourage plus sûr ?',
    icon: 'shield-home-outline',
    bgColor: '#F0FDF4',
    iconColor: '#15803D',
  },
] as const

// ─── Composant écran ──────────────────────────────────────────────────────────

export default function CrisisPlanScreen() {
  const { isTeenMode, tt, teenColor } = useTeen()
  const [items, setItems] = useState<CrisisPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<ReadonlySet<number>>(new Set())
  const [addingToStep, setAddingToStep] = useState<number | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Regroupe les items par numéro d'étape
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

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [loadItems])
  )

  const toggleStep = useCallback((stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
        // Annuler l'ajout en cours si on referme la section
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

  const handleSaveNewItem = useCallback(
    async (stepNumber: number) => {
      const trimmed = newItemText.trim()
      if (!trimmed) return
      const existingItems = itemsByStep.get(stepNumber) ?? []
      await saveCrisisPlanItem({
        id: generateId(),
        step_number: stepNumber,
        content: trimmed,
        position: existingItems.length,
      })
      setAddingToStep(null)
      setNewItemText('')
      await loadItems()
    },
    [newItemText, itemsByStep, loadItems]
  )

  const handleStartEdit = useCallback((item: CrisisPlanItem) => {
    setEditingId(item.id)
    setEditText(item.content)
    setAddingToStep(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleSaveEdit = useCallback(
    async (item: CrisisPlanItem) => {
      const trimmed = editText.trim()
      if (!trimmed) return
      await saveCrisisPlanItem({ ...item, content: trimmed })
      setEditingId(null)
      setEditText('')
      await loadItems()
    },
    [editText, loadItems]
  )

  const handleDelete = useCallback(
    (item: CrisisPlanItem) => {
      Alert.alert('Supprimer cet élément', `"${item.content}"`, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCrisisPlanItem(item.id)
            await loadItems()
          },
        },
      ])
    },
    [loadItems]
  )

  const handleCallEmergency = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`)
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('crisis_plan')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {tt('crisis_plan', 'title') || 'Mon Plan de Crise'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isTeenMode
              ? tt('crisis_plan', 'intro')
              : "Remplissez ce plan avec votre praticien. Il vous aidera dans les moments difficiles."}
          </Text>
        </View>

        {/* Les 6 étapes en accordéon */}
        {STEPS.map((step) => {
          const stepItems = itemsByStep.get(step.number) ?? []
          const isExpanded = expandedSteps.has(step.number)

          return (
            <View key={step.number} style={styles.stepCard}>
              <Pressable
                style={styles.stepHeader}
                onPress={() => toggleStep(step.number)}
                testID={`step-header-${step.number}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                accessibilityLabel={`Étape ${step.number} : ${step.title}`}
              >
                <View style={[styles.stepIconBg, { backgroundColor: step.bgColor }]}>
                  <MaterialCommunityIcons name={step.icon} size={22} color={step.iconColor} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>Étape {step.number}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <View style={styles.stepRight}>
                  {stepItems.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{stepItems.length}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepHint}>{step.hint}</Text>

                  {stepItems.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      {editingId === item.id ? (
                        <View style={styles.editContainer}>
                          <TextInput
                            style={styles.textInput}
                            value={editText}
                            onChangeText={setEditText}
                            autoFocus
                            multiline
                            testID={`edit-input-${item.id}`}
                          />
                          <View style={styles.actionRow}>
                            <Pressable
                              style={[styles.actionBtn, styles.validateBtn]}
                              onPress={() => handleSaveEdit(item)}
                              testID={`validate-edit-${item.id}`}
                            >
                              <Text style={styles.validateBtnText}>Valider</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.actionBtn, styles.cancelBtn]}
                              onPress={handleCancelEdit}
                            >
                              <Text style={styles.cancelBtnText}>Annuler</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="circle-small"
                            size={20}
                            color={step.iconColor}
                          />
                          <Pressable style={styles.itemTextArea} onPress={() => handleStartEdit(item)}>
                            <Text style={styles.itemContent}>{item.content}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDelete(item)}
                            hitSlop={8}
                            testID={`delete-item-${item.id}`}
                            accessibilityLabel={`Supprimer : ${item.content}`}
                          >
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={18}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        </>
                      )}
                    </View>
                  ))}

                  {addingToStep === step.number ? (
                    <View style={styles.addForm}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Saisir un élément..."
                        value={newItemText}
                        onChangeText={setNewItemText}
                        autoFocus
                        multiline
                        testID="new-item-input"
                      />
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionBtn, styles.validateBtn]}
                          onPress={() => handleSaveNewItem(step.number)}
                          testID="validate-new-item"
                        >
                          <Text style={styles.validateBtnText}>Valider</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.cancelBtn]}
                          onPress={handleCancelAdd}
                          testID="cancel-new-item"
                        >
                          <Text style={styles.cancelBtnText}>Annuler</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addBtn}
                      onPress={() => handleStartAdd(step.number)}
                      testID={`add-to-step-${step.number}`}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={step.iconColor} />
                      <Text style={[styles.addBtnText, { color: step.iconColor }]}>
                        Ajouter un élément
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* Barre d'urgence persistante */}
      <SafeAreaView edges={['bottom']} style={styles.emergencyBar}>
        <View style={styles.emergencyRow}>
          <Pressable
            style={[styles.emergencyBtn, styles.emergencySamu]}
            onPress={() => handleCallEmergency('15')}
            testID="emergency-15"
            accessibilityRole="button"
            accessibilityLabel="Appeler le 15 SAMU, urgence médicale"
          >
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <View>
              <Text style={styles.emergencyNumber}>15 — SAMU</Text>
              <Text style={styles.emergencyLabel}>Urgence médicale</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.emergencyBtn, styles.emergency3114]}
            onPress={() => handleCallEmergency('3114')}
            testID="emergency-3114"
            accessibilityRole="button"
            accessibilityLabel="Appeler le 3114, numéro national de prévention du suicide"
          >
            <MaterialCommunityIcons name="phone" size={20} color={colors.white} />
            <View>
              <Text style={styles.emergencyNumber}>3114 — Prévention</Text>
              <Text style={styles.emergencyLabel}>Numéro national</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // En-tête
  header: { marginBottom: spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  // Carte étape
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepIconBg: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: { flex: 1 },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Contenu de l'étape
  stepContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepHint: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },

  // Item
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  itemTextArea: { flex: 1 },
  itemContent: { fontSize: 15, color: colors.text, lineHeight: 22 },

  // Formulaires (ajout + édition)
  editContainer: { flex: 1, gap: spacing.xs },
  addForm: { gap: spacing.xs, marginTop: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.text,
    minHeight: 44,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  validateBtn: { backgroundColor: colors.primary },
  validateBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  cancelBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, marginTop: spacing.xs },
  addBtnText: { fontSize: 14, fontWeight: '500' },

  // Barre d'urgence
  emergencyBar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emergencyRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  emergencyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  emergencySamu: { backgroundColor: '#0D9488' },
  emergency3114: { backgroundColor: '#7C3AED' },
  emergencyNumber: { color: colors.white, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  emergencyLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 14 },
})
