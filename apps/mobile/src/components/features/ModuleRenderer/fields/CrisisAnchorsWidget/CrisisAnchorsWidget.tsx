// ─── Widget `crisis_anchors_preview` (mobile) : « Mes raisons de tenir » ─────
//
// Version interactive patient du field_type `crisis_anchors_preview` (le web en
// affiche un aperçu statique pour le praticien). Photos d'ancrage (FileSystem),
// phrase d'ancrage (SQLite) et message du praticien (Supabase) : tout passe par
// `crisisPlanService`. Conformité MDR 2017/745 : journal libre, zéro interprétation.

import { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { InputField } from '@ui/InputField'
import { PhotoCarousel } from '@ui/PhotoCarousel'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useAuthStore } from '../../../../../store/authStore'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import {
  getAnchors,
  pickAndSaveAnchorPhoto,
  removeAnchorPhoto,
  getAnchorPhrase,
  saveAnchorPhrase,
  fetchPractitionerConfig,
  type CrisisAnchor,
} from '@services/crisisPlanService'

const MAX_ANCHORS = 3

export function CrisisAnchorsWidget() {
  const t = useModuleTranslation()
  const [anchors, setAnchors] = useState<CrisisAnchor[]>([])
  const [practitionerMessage, setPractitionerMessage] = useState('')
  const [anchorPhrase, setAnchorPhrase] = useState('')
  const [editingPhrase, setEditingPhrase] = useState(false)
  // Diaporama plein écran : ouvert + index de la photo tapée (états solidaires).
  const [viewer, setViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  const patient = useAuthStore(s => s.patient)
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

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
    }).catch(() => { /* chargement silencieux : l'UI reste sur l'état vide */ })
    return () => { active = false }
  }, [patient]))

  const handleAddPhoto = useCallback(async () => {
    try {
      const anchor = await pickAndSaveAnchorPhoto(anchors.length)
      if (anchor) setAnchors(prev => [...prev, anchor])
    } catch {
      showToast(t('modules.crisis_plan.photo_error'), 'error')
    }
  }, [anchors.length, t, showToast])

  const handleDeletePhoto = useCallback((anchor: CrisisAnchor) => {
    showConfirm({
      title: t('modules.crisis_plan.delete_photo_title'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await removeAnchorPhoto(anchor)
        setAnchors(prev => prev.filter(a => a.id !== anchor.id))
      },
    })
  }, [t, showConfirm])

  const handleSavePhrase = useCallback(async () => {
    await saveAnchorPhrase(anchorPhrase)
    setEditingPhrase(false)
  }, [anchorPhrase])

  const startEditing = useCallback(() => setEditingPhrase(true), [])

  const anchorUris = useMemo(() => anchors.map(a => a.uri), [anchors])
  const openViewer = useCallback((index: number) => setViewer({ open: true, index }), [])
  const closeViewer = useCallback(() => setViewer(v => ({ ...v, open: false })), [])

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="heart-outline" size={20} color={colors.danger} />
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
        {anchors.map((anchor, index) => (
          <Pressable
            key={anchor.id}
            style={styles.photoWrapper}
            onPress={() => openViewer(index)}
            onLongPress={() => handleDeletePhoto(anchor)}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('modules.crisis_plan.anchors_title')}
          >
            <Image source={{ uri: anchor.uri }} style={styles.photo} contentFit="cover" />
            <Pressable
              style={styles.photoDelete}
              onPress={() => handleDeletePhoto(anchor)}
              accessibilityRole="button"
              accessibilityLabel={t('modules.crisis_plan.delete_photo_title')}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.danger} />
            </Pressable>
          </Pressable>
        ))}
        {anchors.length < MAX_ANCHORS && (
          <Pressable
            style={styles.photoAdd}
            onPress={handleAddPhoto}
            accessibilityRole="button"
            accessibilityLabel={t('modules.crisis_plan.add_photo')}
          >
            <MaterialCommunityIcons name="image-plus" size={28} color={colors.textMuted} />
            <Text style={styles.photoAddLabel}>{t('modules.crisis_plan.add_photo')}</Text>
          </Pressable>
        )}
      </View>
      {anchors.length >= MAX_ANCHORS && (
        <Text style={styles.photoLimit}>{t('modules.crisis_plan.photo_limit')}</Text>
      )}

      {editingPhrase ? (
        <View style={styles.phraseEdit}>
          <InputField
            label={t('modules.crisis_plan.anchor_phrase_label')}
            value={anchorPhrase}
            onChangeText={setAnchorPhrase}
            placeholder={t('modules.crisis_plan.anchor_phrase_placeholder')}
            multiline
            autoFocus
          />
          <Button
            variant="primary"
            label={t('modules.crisis_plan.anchor_phrase_save')}
            onPress={handleSavePhrase}
          />
        </View>
      ) : (
        <View style={styles.phraseView}>
          <Text style={styles.fieldLabel}>{t('modules.crisis_plan.anchor_phrase_label')}</Text>
          <Pressable
            style={styles.phraseTap}
            onPress={startEditing}
            accessibilityRole="button"
            accessibilityLabel={t('modules.crisis_plan.anchor_phrase_label')}
          >
            <Text style={[styles.phraseText, anchorPhrase ? null : styles.phrasePlaceholder]}>
              {anchorPhrase || t('modules.crisis_plan.anchor_phrase_placeholder')}
            </Text>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <PhotoCarousel
        visible={viewer.open}
        uris={anchorUris}
        initialIndex={viewer.index}
        onClose={closeViewer}
        closeLabel={t('common.close')}
        prevLabel={t('modules.crisis_plan.carousel_prev')}
        nextLabel={t('modules.crisis_plan.carousel_next')}
        testID="anchors-carousel"
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  card:             { borderRadius: radius.lg },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:     { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  sectionSubtitle:  { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  fieldLabel:       { fontSize: 13, fontWeight: '500', color: colors.textMuted },

  practitionerMessage: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
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

  phraseView:      { gap: spacing.xs },
  phraseEdit:      { gap: spacing.sm },
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
  phraseText:        { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  phrasePlaceholder: { color: colors.textMuted },
})
