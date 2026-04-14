import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getThoughtRecord,
  saveThoughtRecord,
  generateId,
  type ThoughtRecord,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'

type RouteType = RouteProp<AppStackParamList, 'BeckEntry'>

// ─── Curseur d'intensité 0–100 ────────────────────────────────────────────────
// Affiche le chiffre brut saisi par le patient — aucune interprétation algorithmique
// (conformité MDR 2017/745 : le code affiche, jamais il ne conclut).

interface IntensitySliderProps {
  label: string
  value: number
  accentColor: string
  onChange: (v: number) => void
}

function IntensitySlider({ label, value, accentColor, onChange }: IntensitySliderProps) {
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color: accentColor }]}>{value}</Text>
      </View>
      <View style={sliderStyles.track}>
        {steps.map((step) => (
          <Pressable
            key={step}
            style={[
              sliderStyles.pip,
              value >= step && { backgroundColor: accentColor },
            ]}
            onPress={() => onChange(step)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === step }}
            accessibilityLabel={`${step}`}
          />
        ))}
      </View>
      <View style={sliderStyles.endpoints}>
        <Text style={sliderStyles.endpoint}>0</Text>
        <Text style={sliderStyles.endpoint}>100</Text>
      </View>
    </View>
  )
}

const sliderStyles = StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: colors.textMuted },
  value: { fontSize: 20, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  pip: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  endpoints: { flexDirection: 'row', justifyContent: 'space-between' },
  endpoint: { fontSize: 11, color: colors.textMuted },
})

// ─── Section d'une colonne ────────────────────────────────────────────────────

interface ColumnSectionProps {
  number: number
  title: string
  hint: string
  accentColor: string
  children: React.ReactNode
}

function ColumnSection({ number, title, hint, accentColor, children }: ColumnSectionProps) {
  return (
    <View style={[sectionStyles.container, { borderLeftColor: accentColor }]}>
      <View style={sectionStyles.header}>
        <View style={[sectionStyles.badge, { backgroundColor: accentColor }]}>
          <Text style={sectionStyles.badgeText}>{number}</Text>
        </View>
        <View style={sectionStyles.headerText}>
          <Text style={[sectionStyles.title, { color: accentColor }]}>{title}</Text>
          <Text style={sectionStyles.hint}>{hint}</Text>
        </View>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: colors.white },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
})

// ─── Champ texte partagé ──────────────────────────────────────────────────────

interface FieldProps {
  placeholder: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  minHeight?: number
}

function Field({ placeholder, value, onChange, multiline = true, minHeight = 72 }: FieldProps) {
  return (
    <TextInput
      style={[fieldStyles.input, multiline && { minHeight }]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      textAlignVertical="top"
    />
  )
}

const fieldStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
})

// ─── Valeur initiale d'un nouvel enregistrement ───────────────────────────────

function newRecord(): Omit<ThoughtRecord, 'created_at'> {
  return {
    id: generateId(),
    date: new Date().toISOString(),
    situation: '',
    emotion: '',
    emotion_intensity: 50,
    automatic_thought: '',
    thought_belief: 50,
    rational_response: '',
    outcome_emotion: '',
    outcome_intensity: 50,
    outcome_belief: 50,
  }
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BeckEntryScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteType>()
  const patient = useAuthStore((s) => s.patient)

  const [record, setRecord] = useState<Omit<ThoughtRecord, 'created_at'>>(newRecord())
  const [loading, setLoading] = useState(!!route.params?.recordId)
  const [saving, setSaving] = useState(false)

  // Charge l'enregistrement existant si on est en mode édition
  useEffect(() => {
    const { recordId } = route.params ?? {}
    if (!recordId) return
    getThoughtRecord(recordId).then((stored) => {
      if (stored) {
        const { created_at: _omit, ...rest } = stored
        setRecord(rest)
      }
      setLoading(false)
    })
  }, [route.params])

  const set = useCallback(<K extends keyof Omit<ThoughtRecord, 'created_at'>>(
    key: K,
    value: Omit<ThoughtRecord, 'created_at'>[K]
  ) => {
    setRecord((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!record.situation.trim() && !record.automatic_thought.trim()) {
      Alert.alert('Enregistrement vide', 'Renseignez au moins la situation ou la pensée automatique.')
      return
    }

    setSaving(true)
    try {
      await saveThoughtRecord(record)

      // Signal d'observance anonymisé (aucune donnée clinique envoyée)
      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_BECK_THOUGHT_RECORD',
          metadata: {},
        })
      }

      navigation.goBack()
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.')
    } finally {
      setSaving(false)
    }
  }, [record, patient, navigation])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* Colonne 1 — Situation */}
        <ColumnSection
          number={1}
          title="Situation"
          hint="Où étiez-vous ? Que se passait-il ? Qui était présent ?"
          accentColor="#0EA5E9"
        >
          <Field
            placeholder="Décrivez la situation..."
            value={record.situation}
            onChange={(v) => set('situation', v)}
          />
        </ColumnSection>

        {/* Colonne 2 — Émotion */}
        <ColumnSection
          number={2}
          title="Émotion(s)"
          hint="Quelle émotion avez-vous ressentie ?"
          accentColor="#8B5CF6"
        >
          <Field
            placeholder="Ex : anxiété, tristesse, colère..."
            value={record.emotion}
            onChange={(v) => set('emotion', v)}
            multiline={false}
            minHeight={0}
          />
          <IntensitySlider
            label="Intensité initiale"
            value={record.emotion_intensity}
            accentColor="#8B5CF6"
            onChange={(v) => set('emotion_intensity', v)}
          />
        </ColumnSection>

        {/* Colonne 3 — Pensée automatique */}
        <ColumnSection
          number={3}
          title="Pensée automatique"
          hint="Quelle pensée est passée dans votre tête à ce moment-là ?"
          accentColor="#EF4444"
        >
          <Field
            placeholder="Ex : Je suis nul(le), ça va mal se passer..."
            value={record.automatic_thought}
            onChange={(v) => set('automatic_thought', v)}
          />
          <IntensitySlider
            label="Conviction initiale"
            value={record.thought_belief}
            accentColor="#EF4444"
            onChange={(v) => set('thought_belief', v)}
          />
        </ColumnSection>

        {/* Colonne 4 — Réponse rationnelle */}
        <ColumnSection
          number={4}
          title="Réponse rationnelle"
          hint="Quelle autre façon de voir la situation ? Quels faits contredisent cette pensée ?"
          accentColor="#059669"
        >
          <Field
            placeholder="Rédigez une pensée alternative plus équilibrée..."
            value={record.rational_response}
            onChange={(v) => set('rational_response', v)}
            minHeight={88}
          />
        </ColumnSection>

        {/* Colonne 5 — Résultat */}
        <ColumnSection
          number={5}
          title="Résultat"
          hint="Comment vous sentez-vous maintenant, après ce travail ?"
          accentColor="#D97706"
        >
          <Field
            placeholder="Émotion après réexamen..."
            value={record.outcome_emotion}
            onChange={(v) => set('outcome_emotion', v)}
            multiline={false}
            minHeight={0}
          />
          <IntensitySlider
            label="Intensité de l'émotion maintenant"
            value={record.outcome_intensity}
            accentColor="#D97706"
            onChange={(v) => set('outcome_intensity', v)}
          />
          <IntensitySlider
            label="Conviction en la pensée alternative"
            value={record.outcome_belief}
            accentColor="#D97706"
            onChange={(v) => set('outcome_belief', v)}
          />
        </ColumnSection>

      </ScrollView>

      {/* Bouton de sauvegarde persistant */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Sauvegarder cet enregistrement"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Sauvegarder</Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
