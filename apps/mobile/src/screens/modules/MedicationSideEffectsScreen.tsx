import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getSideEffectsEntry,
  getAllSideEffectsEntries,
  saveSideEffectsEntry,
  generateId,
  type SideEffectsEntry,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'

// ─── Définition des 6 effets ──────────────────────────────────────────────────
// Inspiré UKU Side Effect Rating Scale (Lingjaerde et al., 1987)
// Classes couvertes : antipsychotiques, thymorégulateurs, antidépresseurs

type EffectKey = keyof Omit<SideEffectsEntry, 'id' | 'date' | 'notes' | 'created_at'>

type EffectMeta = {
  readonly key: EffectKey
  readonly label: string
  readonly detail: string
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
}

const EFFECTS: ReadonlyArray<EffectMeta> = [
  {
    key: 'sedation',
    label: 'Sédation',
    detail: 'Somnolence, lenteur, difficultés de concentration',
    icon: 'sleep',
  },
  {
    key: 'akathisia',
    label: 'Akathisie',
    detail: 'Agitation intérieure, impossibilité de rester immobile',
    icon: 'run',
  },
  {
    key: 'tremors',
    label: 'Tremblements',
    detail: 'Mains, membres — peut survenir avec certains médicaments psychiatriques',
    icon: 'hand-wave-outline',
  },
  {
    key: 'dry_mouth',
    label: 'Sécheresse buccale',
    detail: 'Bouche sèche — peut survenir avec certains médicaments',
    icon: 'water-off-outline',
  },
  {
    key: 'sleep_disturbance',
    label: 'Troubles du sommeil',
    detail: 'Insomnie ou difficultés à dormir — peut survenir avec certains antidépresseurs ou régulateurs d\'humeur',
    icon: 'moon-waning-crescent',
  },
  {
    key: 'nausea',
    label: 'Nausées / troubles digestifs',
    detail: 'Nausées, douleurs abdominales — peut survenir avec certains médicaments',
    icon: 'stomach',
  },
] as const

// Labels de l'échelle 0–3
const SCALE_LABELS: Record<number, string> = {
  0: 'Absent',
  1: 'Léger',
  2: 'Modéré',
  3: 'Sévère',
}

const SCALE_COLORS: Record<number, string> = {
  0: colors.textMuted,
  1: '#16A34A',   // vert
  2: '#D97706',   // orange
  3: '#DC2626',   // rouge
}

// Formate "2026-04-14" → "Lundi 14 avril 2026"
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formate "2026-04-14" → "14/04/2026"
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Jauge 0–3 ───────────────────────────────────────────────────────────────

interface ScalePickerProps {
  value: number
  onChange: (v: number) => void
}

function ScalePicker({ value, onChange }: ScalePickerProps) {
  return (
    <View style={scaleStyles.row}>
      {[0, 1, 2, 3].map((n) => {
        const selected = value === n
        const color = SCALE_COLORS[n]
        return (
          <TouchableOpacity
            key={n}
            style={[
              scaleStyles.btn,
              selected && { backgroundColor: color, borderColor: color },
            ]}
            onPress={() => onChange(n)}
            activeOpacity={0.75}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${n} — ${SCALE_LABELS[n]}`}
          >
            <Text style={[scaleStyles.num, selected && scaleStyles.numSelected]}>
              {n}
            </Text>
            <Text style={[scaleStyles.label, selected && { color: colors.white }]}>
              {SCALE_LABELS[n]}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const scaleStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 2,
  },
  num: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  numSelected: { color: colors.white },
  label: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
})

// ─── Carte d'un effet ─────────────────────────────────────────────────────────

interface EffectCardProps {
  meta: EffectMeta
  value: number
  onChange: (v: number) => void
}

function EffectCard({ meta, value, onChange }: EffectCardProps) {
  const color = SCALE_COLORS[value]
  return (
    <View style={[effectStyles.card, value > 0 && { borderLeftColor: color }]}>
      <View style={effectStyles.header}>
        <MaterialCommunityIcons name={meta.icon} size={20} color={value > 0 ? color : colors.textMuted} />
        <View style={effectStyles.headerText}>
          <Text style={effectStyles.label}>{meta.label}</Text>
          <Text style={effectStyles.detail}>{meta.detail}</Text>
        </View>
        {value > 0 && (
          <View style={[effectStyles.badge, { backgroundColor: color }]}>
            <Text style={effectStyles.badgeText}>{value}</Text>
          </View>
        )}
      </View>
      <ScalePicker value={value} onChange={onChange} />
    </View>
  )
}

const effectStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: colors.white },
})

// ─── Ligne d'historique ───────────────────────────────────────────────────────

interface HistoryRowProps {
  entry: SideEffectsEntry
}

function HistoryRow({ entry }: HistoryRowProps) {
  // Résumé des effets non nuls
  const active = EFFECTS.filter((e) => entry[e.key] > 0)
  return (
    <View style={histStyles.row}>
      <Text style={histStyles.date}>{formatShortDate(entry.date)}</Text>
      <View style={histStyles.pills}>
        {active.length === 0 ? (
          <Text style={histStyles.none}>Aucun effet</Text>
        ) : (
          active.map((e) => {
            const val = entry[e.key] as number
            const color = SCALE_COLORS[val]
            return (
              <View key={e.key} style={[histStyles.pill, { backgroundColor: color + '22', borderColor: color }]}>
                <Text style={[histStyles.pillText, { color }]}>
                  {e.label} {val}
                </Text>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

const histStyles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  date: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  none: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
})

// ─── Valeurs vides par défaut ─────────────────────────────────────────────────

const EMPTY_VALUES: Record<EffectKey, number> = {
  sedation: 0,
  akathisia: 0,
  tremors: 0,
  dry_mouth: 0,
  sleep_disturbance: 0,
  nausea: 0,
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MedicationSideEffectsScreen() {
  const patient = useAuthStore((s) => s.patient)
  const todayDate = today()

  const [values, setValues] = useState<Record<EffectKey, number>>(EMPTY_VALUES)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<SideEffectsEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadData = useCallback(async () => {
    setLoadingHistory(true)
    const [todayEntry, entries] = await Promise.all([
      getSideEffectsEntry(todayDate),
      getAllSideEffectsEntries(30),
    ])
    if (todayEntry) {
      setExistingId(todayEntry.id)
      setValues({
        sedation: todayEntry.sedation,
        akathisia: todayEntry.akathisia,
        tremors: todayEntry.tremors,
        dry_mouth: todayEntry.dry_mouth,
        sleep_disturbance: todayEntry.sleep_disturbance,
        nausea: todayEntry.nausea,
      })
      setNotes(todayEntry.notes ?? '')
    } else {
      setExistingId(null)
      setValues(EMPTY_VALUES)
      setNotes('')
    }
    setHistory(entries)
    setLoadingHistory(false)
  }, [todayDate])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const handleChange = useCallback((key: EffectKey, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const entry: Omit<SideEffectsEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        date: todayDate,
        ...values,
        notes: notes.trim() || null,
      }
      await saveSideEffectsEntry(entry)

      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_SIDE_EFFECTS',
          metadata: {},
        })
      }

      setExistingId(entry.id)
      await loadData()
      Alert.alert('Enregistré', 'Votre saisie a été sauvegardée.')
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>Aujourd'hui</Text>
          <Text style={styles.dateValue}>{formatFullDate(todayDate)}</Text>
        </View>

        {/* Rappel échelle */}
        <View style={styles.scaleInfo}>
          <Text style={styles.scaleInfoText}>
            0 = Absent · 1 = Léger · 2 = Modéré · 3 = Sévère
          </Text>
        </View>

        {/* Les 6 effets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effets ressentis aujourd'hui</Text>
          {EFFECTS.map((meta) => (
            <EffectCard
              key={meta.key}
              meta={meta}
              value={values[meta.key]}
              onChange={(v) => handleChange(meta.key, v)}
            />
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (facultatif)</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Contexte, remarque, moment de la journée…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer ma saisie du jour"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {existingId ? 'Mettre à jour' : 'Enregistrer'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Historique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique (30 derniers jours)</Text>
          <View style={styles.card}>
            {loadingHistory ? (
              <ActivityIndicator color={colors.primary} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistory}>Aucune saisie pour l'instant.</Text>
            ) : (
              history.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  dateHeader: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: { fontSize: 18, fontWeight: '700', color: colors.text },

  scaleInfo: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scaleInfoText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  notesInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 72,
    lineHeight: 22,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  emptyHistory: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontStyle: 'italic',
  },
})
