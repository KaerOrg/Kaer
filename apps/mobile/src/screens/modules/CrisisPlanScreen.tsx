import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppStackParamList } from '../../navigation/AppStack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/features/TeenAccent'
import { useAuthStore } from '../../store/authStore'
import { FieldRenderer } from '../../components/features/ModuleRenderer/FieldRenderer'
import {
  generateId,
  getAllPlanItemsForModule,
  savePlanItem,
  deletePlanItem,
  type PlanItem,
} from '../../lib/database'
import { fetchModuleFields, type ContentField } from '../../services/moduleService'
import { EditableItemsList } from '../../components/features/ModuleRenderer/layouts/shared/EditableItemsList'
import {
  fetchPractitionerConfig,
  getAnchors,
  pickAndSaveAnchorPhoto,
  removeAnchorPhoto,
  getAnchorPhrase,
  saveAnchorPhrase,
  getCommitment,
  saveCommitment,
  type CrisisAnchor,
  type CrisisCommitment,
} from '../../services/crisisPlanService'

// ─── Sous-composant : Section "Mes raisons de tenir" ─────────────────────────

function AnchorsSection({ t, isTeenMode }: { t: (k: string) => string; isTeenMode: boolean }) {
  const [anchors, setAnchors] = useState<CrisisAnchor[]>([])
  const [practitionerMessage, setPractitionerMessage] = useState('')
  const [anchorPhrase, setAnchorPhrase] = useState('')
  const [editingPhrase, setEditingPhrase] = useState(false)
  const patient = useAuthStore(s => s.patient)

  useFocusEffect(useCallback(() => {
    let active = true
    Promise.all([
      getAnchors(),
      getAnchorPhrase(),
      patient ? fetchPractitionerConfig(patient.id).then(c => c.practitionerMessage) : Promise.resolve(''),
    ]).then(([a, phrase, msg]) => {
      if (!active) return
      setAnchors(a)
      setAnchorPhrase(phrase)
      setPractitionerMessage(msg ?? '')
    }).catch(() => { /* chargement silencieux — l'UI reste sur l'état vide */ })
    return () => { active = false }
  }, [patient]))

  const handleAddPhoto = useCallback(async () => {
    try {
      const anchor = await pickAndSaveAnchorPhoto(anchors.length)
      if (anchor) setAnchors(prev => [...prev, anchor])
    } catch {
      Alert.alert(
        t('common.error'),
        t('modules.crisis_plan.photo_error'),
      )
    }
  }, [anchors.length, t])

  const handleDeletePhoto = useCallback((anchor: CrisisAnchor) => {
    Alert.alert(
      t('modules.crisis_plan.delete_photo_title') || 'Supprimer cette photo ?',
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await removeAnchorPhoto(anchor)
            setAnchors(prev => prev.filter(a => a.id !== anchor.id))
          },
        },
      ],
    )
  }, [t])

  const handleSavePhrase = useCallback(async () => {
    await saveAnchorPhrase(anchorPhrase)
    setEditingPhrase(false)
  }, [anchorPhrase])

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="heart-outline" size={20} color={'#DC2626'} />
        <Text style={styles.sectionTitle}>{t('modules.crisis_plan.anchors_title')}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>{t('modules.crisis_plan.anchors_subtitle')}</Text>

      {practitionerMessage !== '' && (
        <View style={styles.practitionerMessage}>
          <MaterialCommunityIcons name="account-heart-outline" size={16} color={colors.primary} />
          <Text style={styles.practitionerMessageText}>{practitionerMessage}</Text>
        </View>
      )}

      <View style={styles.photosRow}>
        {anchors.map(anchor => (
          <Pressable key={anchor.id} style={styles.photoWrapper} onLongPress={() => handleDeletePhoto(anchor)}>
            <Image source={{ uri: anchor.uri }} style={styles.photo} />
            <Pressable style={styles.photoDelete} onPress={() => handleDeletePhoto(anchor)}>
              <MaterialCommunityIcons name="close-circle" size={20} color={'#DC2626'} />
            </Pressable>
          </Pressable>
        ))}
        {anchors.length < 3 && (
          <Pressable style={styles.photoAdd} onPress={handleAddPhoto}>
            <MaterialCommunityIcons name="image-plus" size={28} color={colors.textMuted} />
            <Text style={styles.photoAddLabel}>{t('modules.crisis_plan.add_photo')}</Text>
          </Pressable>
        )}
      </View>
      {anchors.length >= 3 && (
        <Text style={styles.photoLimit}>{t('modules.crisis_plan.photo_limit')}</Text>
      )}

      <Text style={styles.fieldLabel}>{t('modules.crisis_plan.anchor_phrase_label')}</Text>
      {editingPhrase ? (
        <View style={styles.phraseEdit}>
          <TextInput
            style={styles.phraseInput}
            value={anchorPhrase}
            onChangeText={setAnchorPhrase}
            placeholder={t('modules.crisis_plan.anchor_phrase_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
          />
          <Pressable style={styles.saveBtn} onPress={handleSavePhrase}>
            <Text style={styles.saveBtnText}>{t('modules.crisis_plan.anchor_phrase_save')}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.phraseTap} onPress={() => setEditingPhrase(true)}>
          <Text style={[styles.phraseText, !anchorPhrase && { color: colors.textMuted }]}>
            {anchorPhrase || t('modules.crisis_plan.anchor_phrase_placeholder')}
          </Text>
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  )
}

// ─── Sous-composant : Cartes de coping personnalisées ────────────────────────

function CopingCardsSection({ t, patientId }: { t: (k: string) => string; patientId: string | undefined }) {
  const [cards, setCards] = useState<Array<{ id: string; thought: string; response: string }>>([])

  useFocusEffect(useCallback(() => {
    if (!patientId) return
    let active = true
    fetchPractitionerConfig(patientId).then(cfg => {
      if (active) setCards(cfg.copingCards)
    }).catch(() => {})
    return () => { active = false }
  }, [patientId]))

  if (cards.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="card-text-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('modules.crisis_plan.coping_cards_title')}</Text>
        </View>
        <Text style={styles.emptyText}>{t('modules.crisis_plan.coping_cards_empty')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="card-text-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{t('modules.crisis_plan.coping_cards_title')}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>{t('modules.crisis_plan.coping_cards_subtitle')}</Text>
      {cards.map(card => (
        <View key={card.id} style={styles.copingCard}>
          <View style={styles.copingCardRow}>
            <MaterialCommunityIcons name="thought-bubble-outline" size={14} color={colors.textMuted} />
            <Text style={styles.copingCardLabel}>{t('modules.crisis_plan.coping_card_thought')}</Text>
          </View>
          <Text style={styles.copingCardThought}>{card.thought}</Text>
          <View style={[styles.copingCardRow, { marginTop: spacing.sm }]}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.primary} />
            <Text style={styles.copingCardLabel}>{t('modules.crisis_plan.coping_card_response')}</Text>
          </View>
          <Text style={styles.copingCardResponse}>{card.response}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Sous-composant : Engagement thérapeutique ────────────────────────────────

function CommitmentSection({ t, patientId }: { t: (k: string) => string; patientId: string | undefined }) {
  const [commitment, setCommitment] = useState<CrisisCommitment | null>(null)
  const [commitmentPhrase, setCommitmentPhrase] = useState('')
  const [signingName, setSigningName] = useState('')
  const [signing, setSigning] = useState(false)

  useFocusEffect(useCallback(() => {
    let active = true
    Promise.all([
      getCommitment(),
      patientId ? fetchPractitionerConfig(patientId).then(c => c.commitmentPhrase) : Promise.resolve(''),
    ]).then(([c, phrase]) => {
      if (!active) return
      setCommitment(c)
      setCommitmentPhrase(phrase || t('modules.crisis_plan.commitment_phrase_default'))
    }).catch(() => {})
    return () => { active = false }
  }, [patientId, t]))

  const handleSign = useCallback(async () => {
    if (!signingName.trim()) return
    try {
      await saveCommitment(signingName.trim())
      setCommitment({ name: signingName.trim(), date: new Date().toISOString() })
      setSigning(false)
      setSigningName('')
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    }
  }, [signingName, t])

  const formattedDate = commitment
    ? new Date(commitment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <View style={[styles.section, styles.commitmentSection]}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="handshake-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{t('modules.crisis_plan.commitment_title')}</Text>
      </View>
      <Text style={styles.commitmentPhrase}>{commitmentPhrase}</Text>

      {commitment && !signing ? (
        <View style={styles.commitmentSigned}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#22c55e" />
          <Text style={styles.commitmentSignedText}>
            {commitment.name} — {t('modules.crisis_plan.commitment_signed_on').replace('{{date}}', formattedDate)}
          </Text>
          <Pressable onPress={() => setSigning(true)}>
            <Text style={styles.commitmentUpdate}>{t('modules.crisis_plan.commitment_update')}</Text>
          </Pressable>
        </View>
      ) : signing ? (
        <View style={styles.commitmentForm}>
          <TextInput
            style={styles.commitmentInput}
            value={signingName}
            onChangeText={setSigningName}
            placeholder={t('modules.crisis_plan.commitment_sign_placeholder')}
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <Pressable
            style={[styles.commitmentBtn, !signingName.trim() && { opacity: 0.4 }]}
            onPress={handleSign}
            disabled={!signingName.trim()}
          >
            <Text style={styles.commitmentBtnText}>{t('modules.crisis_plan.commitment_sign_button')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.commitmentForm}>
          <Text style={styles.fieldLabel}>{t('modules.crisis_plan.commitment_sign_label')}</Text>
          <TextInput
            style={styles.commitmentInput}
            value={signingName}
            onChangeText={setSigningName}
            placeholder={t('modules.crisis_plan.commitment_sign_placeholder')}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            style={[styles.commitmentBtn, !signingName.trim() && { opacity: 0.4 }]}
            onPress={handleSign}
            disabled={!signingName.trim()}
          >
            <Text style={styles.commitmentBtnText}>{t('modules.crisis_plan.commitment_sign_button')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, 'CrisisPlan'>

export default function CrisisPlanScreen({ route }: Props) {
  const { t } = useTranslation()
  const { isTeenMode, tt, teenColor } = useTeen()
  const patient = useAuthStore(s => s.patient)

  const [loading, setLoading] = useState(true)
  const [urgencyVisible, setUrgencyVisible] = useState(route.params?.initialUrgency ?? false)
  const [loadError, setLoadError] = useState(false)
  const [sections, setSections] = useState<Map<string, ContentField[]>>(new Map())
  const [uiFields, setUiFields] = useState<ContentField[]>([])
  const [items, setItems] = useState<PlanItem[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const loadSteps = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    let active = true
    Promise.all([
      fetchModuleFields('crisis_plan'),
      getAllPlanItemsForModule('crisis_plan').catch((): PlanItem[] => []),
    ]).then(([result, planItems]) => {
      if (!active) return
      const sMap = new Map<string, ContentField[]>()
      const ui: ContentField[] = []
      for (const f of result.fields) {
        if (!f.section_id) { ui.push(f); continue }
        if (!sMap.has(f.section_id)) sMap.set(f.section_id, [])
        sMap.get(f.section_id)!.push(f)
      }
      setSections(sMap)
      setUiFields(ui)
      setItems(planItems)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoadError(true)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  useFocusEffect(loadSteps)

  const itemsBySection = useMemo(() => {
    const map = new Map<string, PlanItem[]>()
    for (const item of items) {
      const list = map.get(item.section_id) ?? []
      list.push(item)
      map.set(item.section_id, list)
    }
    return map
  }, [items])

  const emergencyFields = useMemo(
    () => uiFields.filter(f => f.field_type === 'exercise_safety').sort((a, b) => a.sort_order - b.sort_order),
    [uiFields],
  )

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }, [])

  const handleAdd = useCallback(async (sectionId: string, text: string) => {
    const existingItems = itemsBySection.get(sectionId) ?? []
    const newItem: PlanItem = {
      id: generateId(),
      module_id: 'crisis_plan',
      section_id: sectionId,
      text,
      sort_order: existingItems.length,
      weight: null,
      created_at: new Date().toISOString(),
    }
    await savePlanItem(newItem)
    setItems(prev => [...prev, newItem])
  }, [itemsBySection])

  const handleEdit = useCallback(async (item: PlanItem, text: string) => {
    await savePlanItem({ id: item.id, module_id: item.module_id, section_id: item.section_id, text, sort_order: item.sort_order, weight: item.weight })
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, text } : i)))
  }, [])

  const handleDelete = useCallback((item: PlanItem) => {
    Alert.alert(t('modules.crisis_plan.delete_item_title'), `"${item.text}"`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await deletePlanItem(item.id)
          setItems(prev => prev.filter(i => i.id !== item.id))
        },
      },
    ])
  }, [t])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('crisis_plan')} />
      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bouton mode urgence */}
          <Pressable
            style={styles.urgencyBanner}
            onPress={() => setUrgencyVisible(true)}
          >
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.urgencyBannerText}>{t('modules.crisis_plan.urgency_title')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>

          {/* 6 étapes Stanley & Brown */}
          {loadError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{t('common.load_error')}</Text>
              <Pressable style={styles.retryBtn} onPress={loadSteps}>
                <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          )}

          {[...sections.entries()].map(([sectionId, fields], idx) => {
            const titleField = fields.find(f => f.field_type === 'step_title')
            const hintField = fields.find(f => f.field_type === 'step_hint')
            if (!titleField) return null

            const iconName = (titleField.props['icon'] ?? 'circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
            const bgColor = (titleField.props['bgColor'] as string | undefined) ?? '#F3F4F6'
            const iconColor = (titleField.props['color'] as string | undefined) ?? colors.primary
            const stepNumber = titleField.props['step_number'] ?? String(idx + 1)
            const isExpanded = expandedSections.has(sectionId)
            const sectionItems = itemsBySection.get(sectionId) ?? []

            return (
              <View key={sectionId} style={styles.card}>
                <Pressable
                  style={styles.stepHeader}
                  onPress={() => toggleSection(sectionId)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View style={[styles.stepIconBg, { backgroundColor: bgColor }]}>
                    <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepNumber}>
                      {t('modules.crisis_plan.step_label').replace('{{number}}', String(stepNumber))}
                    </Text>
                    <Text style={styles.stepTitle}>{t(titleField.text_code ?? '')}</Text>
                  </View>
                  <View style={styles.stepRight}>
                    {sectionItems.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{sectionItems.length}</Text>
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
                    {hintField != null && (
                      <Text style={styles.stepHint}>{t(hintField.text_code ?? '')}</Text>
                    )}
                    <EditableItemsList
                      items={sectionItems}
                      accentColor={iconColor}
                      weightConfig={null}
                      addLabel={t('modules.crisis_plan.add_item')}
                      placeholder={t('modules.crisis_plan.item_placeholder')}
                      onAdd={(text) => handleAdd(sectionId, text)}
                      onEdit={(item, text) => handleEdit(item, text)}
                      onDelete={handleDelete}
                      testIdPrefix={`step-${stepNumber}`}
                    />
                  </View>
                )}
              </View>
            )
          })}

          {/* Section 7 : Mes raisons de tenir */}
          <AnchorsSection t={t} isTeenMode={isTeenMode} />

          {/* Section 8 : Cartes de coping personnalisées */}
          <CopingCardsSection t={t} patientId={patient?.id} />

          {/* Section 9 : Engagement thérapeutique */}
          <CommitmentSection t={t} patientId={patient?.id} />
        </ScrollView>

        {/* Barre d'urgence fixe en bas */}
        {emergencyFields.length > 0 && (
          <View style={styles.emergencyBar}>
            <View style={styles.emergencyRow}>
              {emergencyFields.map(f => {
                const phone = f.props['phone'] ?? ''
                const btnColor = (f.props['bgColor'] as string | undefined) ?? '#DC2626'
                return (
                  <Pressable
                    key={f.id}
                    style={[styles.emergencyBtn, { backgroundColor: btnColor }]}
                    onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                    <View>
                      <Text style={styles.emergencyNumber}>{t(f.text_code ?? '')}</Text>
                      {f.props['label_code'] != null && (
                        <Text style={styles.emergencyLabel}>{t(f.props['label_code'] as string)}</Text>
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>

      {/* Modal urgence */}
      <Modal visible={urgencyVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.urgencyRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
          <SafeAreaView style={styles.urgencyHeader} edges={['top']}>
            <View style={styles.urgencyHeaderInner}>
              <View style={styles.urgencyHeaderLeft}>
                <MaterialCommunityIcons name="alert-circle" size={28} color="#fff" />
                <View>
                  <Text style={styles.urgencyTitle}>{tt('crisis_plan', 'urgency_title')}</Text>
                  <Text style={styles.urgencySubtitle}>{tt('crisis_plan', 'urgency_subtitle')}</Text>
                </View>
              </View>
              <Pressable style={styles.urgencyClose} onPress={() => setUrgencyVisible(false)} accessibilityRole="button">
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>
          <SafeAreaView style={styles.urgencyContent} edges={['bottom']}>
            <FieldRenderer preview_kind="crisis_urgency" fields={uiFields} moduleId="crisis_plan" />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  flex:    { flex: 1 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:  { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.sm },

  // Bouton mode urgence
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  urgencyBannerText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal urgence
  urgencyRoot:       { flex: 1, backgroundColor: colors.background },
  urgencyHeader:     { backgroundColor: '#DC2626' },
  urgencyHeaderInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm,
  },
  urgencyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  urgencyTitle:      { color: '#fff', fontSize: 18, fontWeight: '700' },
  urgencySubtitle:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },
  urgencyClose:      { padding: 4 },
  urgencyContent:    { flex: 1 },

  // Étapes accordion
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  stepIconBg:  { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  stepInfo:    { flex: 1 },
  stepNumber:  { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle:   { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  stepRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge:       { backgroundColor: colors.primary, borderRadius: 999, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepContent: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.sm },
  stepHint:    { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.xs },

  // Barre d'urgence
  emergencyBar:   { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  emergencyRow:   { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  emergencyBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, gap: spacing.sm },
  emergencyNumber: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  emergencyLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 14 },

  // Erreur chargement étapes
  errorBanner: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  // Sections supplémentaires
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  commitmentSection: { borderWidth: 1.5, borderColor: colors.primary + '40' },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:     { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  sectionSubtitle:  { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  fieldLabel:       { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  emptyText:        { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  practitionerMessage: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary + '12',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  practitionerMessageText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20, fontStyle: 'italic' },

  photosRow:    { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  photoWrapper: { width: 88, height: 88, position: 'relative' },
  photo:        { width: 88, height: 88, borderRadius: radius.md },
  photoDelete:  { position: 'absolute', top: -6, right: -6 },
  photoAdd: {
    width: 88, height: 88,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  photoLimit:    { fontSize: 12, color: colors.textMuted },

  phraseTap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phraseText:  { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  phraseEdit:  { gap: spacing.sm },
  phraseInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  copingCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  copingCardRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copingCardLabel:    { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  copingCardThought:  { fontSize: 14, color: colors.text, fontStyle: 'italic' },
  copingCardResponse: { fontSize: 14, color: colors.text, fontWeight: '500' },

  commitmentPhrase: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  commitmentSigned:     { gap: spacing.xs, alignItems: 'flex-start' },
  commitmentSignedText: { fontSize: 13, color: colors.text },
  commitmentUpdate:     { fontSize: 12, color: colors.primary, textDecorationLine: 'underline', marginTop: 2 },
  commitmentForm:       { gap: spacing.sm },
  commitmentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  commitmentBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  commitmentBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
