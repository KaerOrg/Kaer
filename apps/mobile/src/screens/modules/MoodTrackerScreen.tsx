import React, { useCallback, useMemo, useState } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllMoodEntries,
  getMoodEntryForDate,
  saveMoodEntry,
  deleteMoodEntry,
  generateId,
  type MoodEntry,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

// ─── Helpers date ─────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ─── Métadonnées des 4 dimensions cliniques ───────────────────────────────────
//
// Référence : CANMAT 2018, Basco & Rush (2005), NIMH Life Chart Method,
//             Snaith-Hamilton Pleasure Scale (SHAPS, 1995).
// Échelle 1–10 — chiffres bruts, sans label interprétatif (conformité MDR).
//
// "Plaisir" = dimension anhédonique.
// Terme patient-friendly pour l'anhédonie (critère DSM-5 cardinal MDD).
// Distinct de l'énergie : on peut être épuisé et encore ressentir du plaisir,
// ou avoir de l'énergie mais n'en retirer aucune satisfaction.

type DimensionKey = 'mood' | 'energy' | 'anxiety' | 'pleasure'

interface DimensionMeta {
  key: DimensionKey
  label: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  color: string
  lowHint: string   // affiché à l'extrémité basse (1) — décrit sans juger
  highHint: string  // affiché à l'extrémité haute (10)
}

const DIMENSIONS: DimensionMeta[] = [
  {
    key: 'mood',
    label: 'Humeur',
    icon: 'emoticon-outline',
    color: '#8B5CF6',
    lowHint: 'Très basse',
    highHint: 'Très élevée',
  },
  {
    key: 'energy',
    label: 'Énergie',
    icon: 'lightning-bolt-outline',
    color: '#F59E0B',
    lowHint: 'Épuisé(e)',
    highHint: 'Plein(e) d\'énergie',
  },
  {
    key: 'anxiety',
    label: 'Anxiété',
    icon: 'pulse',
    color: '#EF4444',
    lowHint: 'Aucune',
    highHint: 'Très intense',
  },
  {
    key: 'pleasure',
    label: 'Plaisir',
    icon: 'heart-outline',
    color: '#059669',
    lowHint: 'Rien ne m\'a touché',
    highHint: 'Pleinement ressenti',
  },
]

// ─── Curseur 1–10 ─────────────────────────────────────────────────────────────

interface ScalePickerProps {
  value: number
  meta: DimensionMeta
  onChange: (v: number) => void
}

function ScalePicker({ value, meta, onChange }: ScalePickerProps) {
  return (
    <View style={scaleStyles.container}>
      {/* En-tête */}
      <View style={scaleStyles.header}>
        <View style={scaleStyles.labelRow}>
          <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
          <Text style={[scaleStyles.label, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={[scaleStyles.value, { color: meta.color }]}>{value}</Text>
      </View>

      {/* Pastilles 1–10 */}
      <View style={scaleStyles.pips}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const selected = n === value
          return (
            <Pressable
              key={n}
              style={[
                scaleStyles.pip,
                n <= value && { backgroundColor: meta.color + '33' }, // fond léger pour les valeurs ≤ sélection
                selected && { backgroundColor: meta.color, borderColor: meta.color },
              ]}
              onPress={() => onChange(n)}
              hitSlop={4}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${meta.label} : ${n}`}
            >
              <Text style={[scaleStyles.pipText, selected && scaleStyles.pipTextSelected]}>
                {n}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Libellés extrémités */}
      <View style={scaleStyles.hints}>
        <Text style={scaleStyles.hint}>{meta.lowHint}</Text>
        <Text style={scaleStyles.hint}>{meta.highHint}</Text>
      </View>
    </View>
  )
}

const scaleStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 24, fontWeight: '800', minWidth: 32, textAlign: 'right' },
  pips: {
    flexDirection: 'row',
    gap: 4,
  },
  pip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  pipText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  pipTextSelected: { color: colors.white, fontWeight: '700' },
  hints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontSize: 11, color: colors.textMuted },
})

// ─── Mini graphique historique (30 derniers jours) ────────────────────────────
//
// Affichage passif : barres de hauteur proportionnelle aux valeurs brutes.
// Aucune couleur interprétative, aucune flèche, aucun commentaire — MDR.

interface SparklineProps {
  entries: MoodEntry[]   // du plus récent au plus ancien
  dimensionKey: DimensionKey
  color: string
  label: string
}

function Sparkline({ entries, dimensionKey, color, label }: SparklineProps) {
  // On réverse pour afficher du plus ancien à gauche
  const data = [...entries].reverse().slice(-30)

  if (data.length === 0) return null

  return (
    <View style={sparkStyles.container}>
      <Text style={sparkStyles.label}>{label}</Text>
      <View style={sparkStyles.bars}>
        {data.map((entry, i) => {
          const val = entry[dimensionKey] as number
          const heightPct = (val / 10) * 100
          return (
            <View key={entry.id + i} style={sparkStyles.barWrapper}>
              <View style={sparkStyles.barBg}>
                <View
                  style={[
                    sparkStyles.bar,
                    { height: `${heightPct}%` as `${number}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const sparkStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 2,
  },
  barWrapper: { flex: 1 },
  barBg: {
    height: 48,
    justifyContent: 'flex-end',
    backgroundColor: colors.border + '44',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 2 },
})

// ─── Carte d'historique ───────────────────────────────────────────────────────

interface HistoryCardProps {
  entry: MoodEntry
  onDelete: () => void
}

function HistoryCard({ entry, onDelete }: HistoryCardProps) {
  return (
    <View style={histStyles.card}>
      <View style={histStyles.header}>
        <Text style={histStyles.date}>{formatDateLabel(entry.date)}</Text>
        <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Supprimer cette saisie">
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={histStyles.scores}>
        {DIMENSIONS.map((d) => (
          <View key={d.key} style={histStyles.score}>
            <MaterialCommunityIcons name={d.icon} size={14} color={d.color} />
            <Text style={[histStyles.scoreValue, { color: d.color }]}>
              {entry[d.key]}
            </Text>
          </View>
        ))}
      </View>
      {!!entry.notes && (
        <Text style={histStyles.notes} numberOfLines={2}>{entry.notes}</Text>
      )}
    </View>
  )
}

const histStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 13, fontWeight: '600', color: colors.text },
  scores: { flexDirection: 'row', gap: spacing.md },
  score: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreValue: { fontSize: 15, fontWeight: '700' },
  notes: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

type FormState = { mood: number; energy: number; anxiety: number; pleasure: number; notes: string }

const DEFAULT_FORM: FormState = { mood: 5, energy: 5, anxiety: 5, pleasure: 5, notes: '' }

export default function MoodTrackerScreen() {
  const { teenColor } = useTeen()
  const patient = useAuthStore((s) => s.patient)
  const today = todayISO()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [existingId, setExistingId] = useState<string | null>(null) // id si déjà saisi aujourd'hui
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'today' | 'history'>('today')

  // ── Chargement ──────────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      let active = true
      Promise.all([
        getMoodEntryForDate(today),
        getAllMoodEntries(),
      ]).then(([todayEntry, all]) => {
        if (!active) return
        if (todayEntry) {
          setForm({
            mood: todayEntry.mood,
            energy: todayEntry.energy,
            anxiety: todayEntry.anxiety,
            pleasure: todayEntry.pleasure,
            notes: todayEntry.notes ?? '',
          })
          setExistingId(todayEntry.id)
        } else {
          setForm(DEFAULT_FORM)
          setExistingId(null)
        }
        setEntries(all)
        setLoading(false)
      })
      return () => { active = false }
    }, [today])
  )

  // ── Historique sans aujourd'hui (pour la liste) ─────────────────────────────

  const pastEntries = useMemo(
    () => entries.filter((e) => e.date !== today),
    [entries, today]
  )

  // ── Sauvegarde ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const entry: Omit<MoodEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        date: today,
        mood: form.mood,
        energy: form.energy,
        anxiety: form.anxiety,
        pleasure: form.pleasure,
        notes: form.notes.trim() || null,
      }
      await saveMoodEntry(entry)

      // Signal d'observance anonymisé (aucune donnée clinique transmise)
      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'SAVE_MOOD_ENTRY',
          metadata: {},
        })
      }

      // Actualise la liste locale
      const all = await getAllMoodEntries()
      setEntries(all)
      setExistingId(entry.id)
      Alert.alert('Enregistré', 'Votre saisie du jour a été sauvegardée.')
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.')
    } finally {
      setSaving(false)
    }
  }, [form, existingId, today, patient])

  // ── Suppression ─────────────────────────────────────────────────────────────

  const handleDelete = useCallback((entry: MoodEntry) => {
    Alert.alert(
      'Supprimer cette saisie ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteMoodEntry(entry.id)
            setEntries((prev) => prev.filter((e) => e.id !== entry.id))
            if (entry.date === today) {
              setForm(DEFAULT_FORM)
              setExistingId(null)
            }
          },
        },
      ]
    )
  }, [today])

  // ── Rendu ───────────────────────────────────────────────────────────────────

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
      <TeenAccent color={teenColor('mood_tracker')} />
      {/* Onglets Aujourd'hui / Historique */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'today' && styles.tabActive]}
          onPress={() => setTab('today')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'today' }}
        >
          <Text style={[styles.tabText, tab === 'today' && styles.tabTextActive]}>
            Aujourd'hui
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'history' }}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
          {pastEntries.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pastEntries.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {tab === 'today' ? (
        // ── Onglet saisie du jour ────────────────────────────────────────────
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Indicateur saisie déjà effectuée */}
          {existingId && (
            <View style={styles.alreadySaved} testID="already-saved-banner">
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
              <Text style={styles.alreadySavedText}>Saisie du jour déjà enregistrée — vous pouvez la modifier.</Text>
            </View>
          )}

          {/* Les 3 dimensions */}
          <View style={styles.card}>
            {DIMENSIONS.map((meta, i) => (
              <React.Fragment key={meta.key}>
                <ScalePicker
                  value={form[meta.key]}
                  meta={meta}
                  onChange={(v) => setForm((prev) => ({ ...prev, [meta.key]: v }))}
                />
                {i < DIMENSIONS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Notes libres */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes libres (optionnel)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Contexte, événement du jour, remarque..."
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={(t) => setForm((prev) => ({ ...prev, notes: t }))}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      ) : (
        // ── Onglet historique ────────────────────────────────────────────────
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {entries.length < 2 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="chart-line" size={48} color={colors.border} />
              <Text style={styles.emptyText}>
                Continuez à noter votre humeur : votre historique apparaîtra à partir de 2 saisies.
              </Text>
            </View>
          ) : (
            <>
              {/* Mini graphiques — 3 sparklines */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>30 derniers jours</Text>
                {DIMENSIONS.map((d) => (
                  <Sparkline
                    key={d.key}
                    entries={entries}
                    dimensionKey={d.key}
                    color={d.color}
                    label={d.label}
                  />
                ))}
              </View>

              {/* Liste chronologique */}
              <View style={styles.histList}>
                {entries.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => handleDelete(entry)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Footer sauvegarde (uniquement sur l'onglet Aujourd'hui) */}
      {tab === 'today' && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Sauvegarder la saisie du jour"
            testID="save-button"
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
          </Pressable>
        </SafeAreaView>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },

  // Onglets
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },

  // Carte principale
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border },

  // Déjà sauvegardé
  alreadySaved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '18',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  alreadySavedText: { flex: 1, fontSize: 13, color: colors.success },

  // Notes
  notesSection: { gap: spacing.xs },
  notesLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
  },

  // Historique
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  histList: { gap: spacing.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Footer
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
