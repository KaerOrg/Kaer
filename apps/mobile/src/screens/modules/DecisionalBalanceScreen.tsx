import React, { useState, useCallback, useMemo } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getDecisionalBalance,
  saveDecisionalBalance,
  computeBalanceScores,
  generateId,
  type DecisionalBalance,
  type BalanceArgument,
  type BalanceQuadrant,
} from '../../lib/database'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'

// ─── Métadonnées des 4 quadrants ─────────────────────────────────────────────

type QuadrantMeta = {
  readonly key: BalanceQuadrant
  readonly title: string
  readonly subtitle: string
  readonly bgColor: string
  readonly accentColor: string
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
}

const QUADRANTS: ReadonlyArray<QuadrantMeta> = [
  {
    key: 'pros_change',
    title: 'Avantages',
    subtitle: 'du changement',
    bgColor: '#ECFDF5',
    accentColor: '#059669',
    icon: 'thumb-up-outline',
  },
  {
    key: 'cons_change',
    title: 'Inconvénients',
    subtitle: 'du changement',
    bgColor: '#FFF7ED',
    accentColor: '#EA580C',
    icon: 'thumb-down-outline',
  },
  {
    key: 'pros_status_quo',
    title: 'Avantages',
    subtitle: 'à rester comme je suis',
    bgColor: '#EFF6FF',
    accentColor: '#2563EB',
    icon: 'shield-check-outline',
  },
  {
    key: 'cons_status_quo',
    title: 'Inconvénients',
    subtitle: 'à rester comme je suis',
    bgColor: '#FDF4FF',
    accentColor: '#9333EA',
    icon: 'alert-outline',
  },
] as const

// ─── Composant poids (1–5 étoiles) ───────────────────────────────────────────

interface WeightPickerProps {
  value: number
  accentColor: string
  onChange: (v: number) => void
}

function WeightPicker({ value, accentColor, onChange }: WeightPickerProps) {
  return (
    <View style={weightStyles.row} accessibilityLabel={`Importance : ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={`Importance ${n}`}
        >
          <MaterialCommunityIcons
            name={n <= value ? 'star' : 'star-outline'}
            size={20}
            color={n <= value ? accentColor : colors.border}
          />
        </Pressable>
      ))}
    </View>
  )
}

const weightStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
})

// ─── Composant quadrant ───────────────────────────────────────────────────────

interface QuadrantCardProps {
  meta: QuadrantMeta
  arguments: BalanceArgument[]
  onAddArgument: (quadrant: BalanceQuadrant, text: string, weight: number) => void
  onDeleteArgument: (quadrant: BalanceQuadrant, id: string) => void
  onWeightChange: (quadrant: BalanceQuadrant, id: string, weight: number) => void
}

function QuadrantCard({
  meta,
  arguments: args,
  onAddArgument,
  onDeleteArgument,
  onWeightChange,
}: QuadrantCardProps) {
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newWeight, setNewWeight] = useState(3)

  const handleConfirm = useCallback(() => {
    const trimmed = newText.trim()
    if (!trimmed) return
    onAddArgument(meta.key, trimmed, newWeight)
    setAdding(false)
    setNewText('')
    setNewWeight(3)
  }, [newText, newWeight, meta.key, onAddArgument])

  const handleCancel = useCallback(() => {
    setAdding(false)
    setNewText('')
    setNewWeight(3)
  }, [])

  return (
    <View style={[quadrantStyles.card, { borderTopColor: meta.accentColor }]}>
      {/* En-tête */}
      <View style={[quadrantStyles.header, { backgroundColor: meta.bgColor }]}>
        <MaterialCommunityIcons name={meta.icon} size={18} color={meta.accentColor} />
        <View style={quadrantStyles.headerText}>
          <Text style={[quadrantStyles.title, { color: meta.accentColor }]}>{meta.title}</Text>
          <Text style={quadrantStyles.subtitle}>{meta.subtitle}</Text>
        </View>
        {args.length > 0 && (
          <View style={[quadrantStyles.countBadge, { backgroundColor: meta.accentColor }]}>
            <Text style={quadrantStyles.countText}>{args.length}</Text>
          </View>
        )}
      </View>

      {/* Liste des arguments */}
      <View style={quadrantStyles.body}>
        {args.map((arg) => (
          <View key={arg.id} style={quadrantStyles.argRow}>
            <View style={quadrantStyles.argContent}>
              <Text style={quadrantStyles.argText}>{arg.text}</Text>
              <WeightPicker
                value={arg.weight}
                accentColor={meta.accentColor}
                onChange={(v) => onWeightChange(meta.key, arg.id, v)}
              />
            </View>
            <Pressable
              onPress={() => onDeleteArgument(meta.key, arg.id)}
              hitSlop={8}
              accessibilityLabel={`Supprimer : ${arg.text}`}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}

        {/* Formulaire d'ajout */}
        {adding ? (
          <View style={quadrantStyles.addForm}>
            <TextInput
              style={quadrantStyles.input}
              placeholder="Saisir un argument..."
              placeholderTextColor={colors.textMuted}
              value={newText}
              onChangeText={setNewText}
              autoFocus
              multiline
            />
            <Text style={quadrantStyles.weightLabel}>Importance :</Text>
            <WeightPicker value={newWeight} accentColor={meta.accentColor} onChange={setNewWeight} />
            <View style={quadrantStyles.addActions}>
              <Pressable
                style={[quadrantStyles.btn, { backgroundColor: meta.accentColor }]}
                onPress={handleConfirm}
              >
                <Text style={quadrantStyles.btnTextWhite}>Valider</Text>
              </Pressable>
              <Pressable
                style={[quadrantStyles.btn, quadrantStyles.btnGhost]}
                onPress={handleCancel}
              >
                <Text style={quadrantStyles.btnTextGhost}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={quadrantStyles.addTrigger}
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter un argument — ${meta.title} ${meta.subtitle}`}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={16} color={meta.accentColor} />
            <Text style={[quadrantStyles.addTriggerText, { color: meta.accentColor }]}>
              Ajouter
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const quadrantStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  headerText: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  countBadge: {
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.white },
  body: { padding: spacing.sm, gap: spacing.sm },
  argRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  argContent: { flex: 1 },
  argText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  weightLabel: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
  addForm: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    minHeight: 40,
  },
  addActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  btnTextWhite: { color: colors.white, fontSize: 13, fontWeight: '600' },
  btnTextGhost: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  addTriggerText: { fontSize: 13, fontWeight: '500' },
})

// ─── Jauge de motivation ──────────────────────────────────────────────────────

interface MotivationGaugeProps {
  motivationPercent: number
  changeScore: number
  statusQuoScore: number
}

function MotivationGauge({ motivationPercent, changeScore, statusQuoScore }: MotivationGaugeProps) {
  return (
    <View style={gaugeStyles.container}>
      <Text style={gaugeStyles.title}>Jauge de motivation</Text>
      <View style={gaugeStyles.labels}>
        <Text style={gaugeStyles.labelLeft}>Rester comme je suis ({statusQuoScore})</Text>
        <Text style={gaugeStyles.labelRight}>Changement ({changeScore})</Text>
      </View>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${motivationPercent}%` as `${number}%`, backgroundColor: colors.primary }]} />
        <View style={[gaugeStyles.marker, { left: '50%' as const }]} />
      </View>
    </View>
  )
}

const gaugeStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  labelLeft: { fontSize: 11, color: colors.textMuted },
  labelRight: { fontSize: 11, color: colors.textMuted },
  track: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: colors.textMuted,
    marginLeft: -1,
  },
  statusLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

const EMPTY_BALANCE: Omit<DecisionalBalance, 'id' | 'updated_at'> = {
  target_behavior: '',
  pros_change: [],
  cons_change: [],
  pros_status_quo: [],
  cons_status_quo: [],
}

export default function DecisionalBalanceScreen() {
  const patient = useAuthStore((s) => s.patient)

  const [balance, setBalance] = useState<DecisionalBalance>({
    ...EMPTY_BALANCE,
    id: generateId(),
    updated_at: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Chargement initial ──────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      let active = true
      getDecisionalBalance().then((stored) => {
        if (!active) return
        if (stored) setBalance(stored)
        setLoading(false)
      })
      return () => { active = false }
    }, [])
  )

  // ── Scores calculés ─────────────────────────────────────────────────────

  const scores = useMemo(() => computeBalanceScores(balance), [balance])

  // ── Mutations des quadrants ─────────────────────────────────────────────

  const handleAddArgument = useCallback(
    (quadrant: BalanceQuadrant, text: string, weight: number) => {
      const newArg: BalanceArgument = { id: generateId(), text, weight }
      setBalance((prev) => ({ ...prev, [quadrant]: [...prev[quadrant], newArg] }))
    },
    []
  )

  const handleDeleteArgument = useCallback(
    (quadrant: BalanceQuadrant, id: string) => {
      setBalance((prev) => ({
        ...prev,
        [quadrant]: prev[quadrant].filter((a) => a.id !== id),
      }))
    },
    []
  )

  const handleWeightChange = useCallback(
    (quadrant: BalanceQuadrant, id: string, weight: number) => {
      setBalance((prev) => ({
        ...prev,
        [quadrant]: prev[quadrant].map((a) => (a.id === id ? { ...a, weight } : a)),
      }))
    },
    []
  )

  // ── Sauvegarde ──────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await saveDecisionalBalance(balance)

      // Signal d'observance anonymisé vers Supabase (aucune donnée clinique)
      if (patient?.id) {
        await supabase.from('patient_engagement_logs').insert({
          patient_id: patient.id,
          event_type: 'UPDATE_DECISIONAL_BALANCE',
          metadata: {},
        })
      }

      Alert.alert('Enregistré', 'Votre balance a été sauvegardée.')
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.')
    } finally {
      setSaving(false)
    }
  }, [balance, patient])

  // ── Rendu ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Comportement cible */}
        <View style={styles.behaviorSection}>
          <Text style={styles.behaviorLabel}>Comportement ciblé</Text>
          <TextInput
            style={styles.behaviorInput}
            placeholder="Ex : Prendre mon traitement chaque jour"
            placeholderTextColor={colors.textMuted}
            value={balance.target_behavior}
            onChangeText={(t) => setBalance((prev) => ({ ...prev, target_behavior: t }))}
          />
        </View>

        {/* Grille 2×2 */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <QuadrantCard
              meta={QUADRANTS[0]}
              arguments={balance.pros_change}
              onAddArgument={handleAddArgument}
              onDeleteArgument={handleDeleteArgument}
              onWeightChange={handleWeightChange}
            />
            <QuadrantCard
              meta={QUADRANTS[1]}
              arguments={balance.cons_change}
              onAddArgument={handleAddArgument}
              onDeleteArgument={handleDeleteArgument}
              onWeightChange={handleWeightChange}
            />
          </View>
          <View style={styles.gridRow}>
            <QuadrantCard
              meta={QUADRANTS[2]}
              arguments={balance.pros_status_quo}
              onAddArgument={handleAddArgument}
              onDeleteArgument={handleDeleteArgument}
              onWeightChange={handleWeightChange}
            />
            <QuadrantCard
              meta={QUADRANTS[3]}
              arguments={balance.cons_status_quo}
              onAddArgument={handleAddArgument}
              onDeleteArgument={handleDeleteArgument}
              onWeightChange={handleWeightChange}
            />
          </View>
        </View>

        {/* Jauge de motivation */}
        <MotivationGauge
          motivationPercent={scores.motivationPercent}
          changeScore={scores.changeScore}
          statusQuoScore={scores.statusQuoScore}
        />
      </ScrollView>

      {/* Bouton de sauvegarde persistant */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Sauvegarder la balance décisionnelle"
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Comportement cible
  behaviorSection: { gap: spacing.xs },
  behaviorLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  behaviorInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },

  // Grille 2×2
  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },

  // Footer sauvegarde
  footer: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
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
