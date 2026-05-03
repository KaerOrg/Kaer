import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../../navigation/AppStack'
import {
  saveCravingEntry,
  getCravingEntry,
  deleteCravingEntry,
  generateId,
  type CravingEntry,
} from '../../lib/database'
import { TeenAccent } from '../../components/TeenAccent'
import { useTeen } from '../../hooks/useTeen'
import { colors, spacing, radius } from '../../theme'

type RouteProps = RouteProp<AppStackParamList, 'CravingJournalEntry'>

const INTENSITY_MIN = 0
const INTENSITY_MAX = 10
const INTENSITY_STEP = 1

// ─── Sélecteur d'intensité ────────────────────────────────────────────────────

interface IntensitySelectorProps {
  value: number
  onChange: (v: number) => void
}

const IntensitySelector = React.memo(function IntensitySelector({ value, onChange }: IntensitySelectorProps) {
  return (
    <View style={intensityStyles.row}>
      {Array.from({ length: INTENSITY_MAX - INTENSITY_MIN + 1 }, (_, i) => {
        const v = INTENSITY_MIN + i * INTENSITY_STEP
        const selected = v === value
        return (
          <Pressable
            key={v}
            style={[intensityStyles.cell, selected && intensityStyles.cellSelected]}
            onPress={() => onChange(v)}
          >
            <Text style={[intensityStyles.label, selected && intensityStyles.labelSelected]}>
              {v}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
})

const intensityStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  cell: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelSelected: { color: colors.white },
})

// ─── Écran saisie ─────────────────────────────────────────────────────────────

export default function CravingJournalEntryScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProps>()
  const { entryId } = route.params ?? {}
  const { t } = useTranslation()
  const { isTeenMode, teenColor } = useTeen()

  const [loading, setLoading] = useState(!!entryId)
  const [saving, setSaving] = useState(false)
  const [intensity, setIntensity] = useState(5)
  const [triggerContext, setTriggerContext] = useState('')
  const [emotion, setEmotion] = useState('')
  const [automaticThought, setAutomaticThought] = useState('')
  const [copingUsed, setCopingUsed] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!entryId) return
    getCravingEntry(entryId).then((entry) => {
      if (entry) {
        setIntensity(entry.intensity)
        setTriggerContext(entry.trigger_context ?? '')
        setEmotion(entry.emotion ?? '')
        setAutomaticThought(entry.automatic_thought ?? '')
        setCopingUsed(entry.coping_used ?? '')
        setNotes(entry.notes ?? '')
      }
      setLoading(false)
    })
  }, [entryId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    const entry: CravingEntry = {
      id: entryId ?? generateId(),
      created_at: new Date().toISOString(),
      intensity,
      trigger_context: triggerContext.trim() || null,
      emotion: emotion.trim() || null,
      automatic_thought: automaticThought.trim() || null,
      coping_used: copingUsed.trim() || null,
      notes: notes.trim() || null,
    }
    try {
      await saveCravingEntry(entry)
      navigation.goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }, [entryId, intensity, triggerContext, emotion, automaticThought, copingUsed, notes, navigation, t])

  const handleDelete = useCallback(() => {
    if (!entryId) return
    Alert.alert(
      t('modules.craving_journal.delete_entry_title'),
      t('common.irreversible'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCravingEntry(entryId)
            navigation.goBack()
          },
        },
      ]
    )
  }, [entryId, navigation, t])

  const tFn = useCallback((key: string) =>
    isTeenMode
      ? t(key, { ns: 'teen', defaultValue: t(key) })
      : t(key)
  , [isTeenMode, t])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={teenColor('craving_journal')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Intensité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.craving_journal.section_intensity')}</Text>
          <Text style={styles.hint}>
            {isTeenMode
              ? t('modules.craving_journal.intensity_hint', { ns: 'teen', defaultValue: t('modules.craving_journal.intensity_hint') })
              : t('modules.craving_journal.intensity_hint')}
          </Text>
          <IntensitySelector value={intensity} onChange={setIntensity} />
        </View>

        {/* Déclencheur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.craving_journal.section_trigger')}</Text>
          <TextInput
            style={styles.input}
            value={triggerContext}
            onChangeText={setTriggerContext}
            placeholder={tFn('modules.craving_journal.trigger_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Émotion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.craving_journal.section_emotion')}</Text>
          <TextInput
            style={styles.input}
            value={emotion}
            onChangeText={setEmotion}
            placeholder={tFn('modules.craving_journal.emotion_placeholder')}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Pensée automatique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.craving_journal.section_thought')}</Text>
          <TextInput
            style={styles.input}
            value={automaticThought}
            onChangeText={setAutomaticThought}
            placeholder={tFn('modules.craving_journal.thought_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Stratégie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.craving_journal.section_coping')}</Text>
          <TextInput
            style={styles.input}
            value={copingUsed}
            onChangeText={setCopingUsed}
            placeholder={tFn('modules.craving_journal.coping_placeholder')}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Notes libres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.notes_optional')}</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Boutons */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.saveBtnText}>{t('modules.craving_journal.save_entry')}</Text>
          }
        </Pressable>

        {entryId && (
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.75 }]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>{t('modules.craving_journal.delete_entry_title')}</Text>
          </Pressable>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },

  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },

  deleteBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  deleteBtnText: { fontSize: 14, color: colors.error ?? '#EF4444' },

  bottomSpacer: { height: 40 },
})
