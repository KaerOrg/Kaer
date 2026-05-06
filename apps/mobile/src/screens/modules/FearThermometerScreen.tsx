import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllFearEntries,
  getAllFearSituations,
  saveFearSituation,
  deleteFearSituation,
  deleteFearEntry,
  deserializeStrategies,
  generateId,
  type FearEntry,
  type FearSituation,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { formatDateShortYear } from '../../lib/dateUtils'
import { useTranslation } from 'react-i18next'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Barre SUDs visuelle ──────────────────────────────────────────────────────
// Affiche le chiffre brut + une barre proportionnelle sans couleur interprétative

interface SudsBarProps {
  label: string
  value: number | null
  color: string
}

function SudsBar({ label, value, color }: SudsBarProps) {
  if (value === null) {
    return (
      <View style={sudsStyles.row}>
        <Text style={sudsStyles.label}>{label}</Text>
        <Text style={sudsStyles.pending}>—</Text>
      </View>
    )
  }
  return (
    <View style={sudsStyles.row}>
      <Text style={sudsStyles.label}>{label}</Text>
      <View style={sudsStyles.track}>
        <View style={[sudsStyles.fill, { width: `${value}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[sudsStyles.value, { color }]}>{value}</Text>
    </View>
  )
}

const sudsStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: 12, color: colors.textMuted, width: 42 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
  value: { fontSize: 13, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  pending: { fontSize: 13, color: colors.border, marginLeft: spacing.xs },
})

// ─── Carte d'une saisie ───────────────────────────────────────────────────────

interface EntryCardProps {
  entry: FearEntry
  onEdit: () => void
  onDelete: () => void
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const { t } = useTranslation()
  const { selected, custom } = deserializeStrategies(entry.strategies)
  const allStrategies = custom.trim()
    ? [...selected, custom.trim()]
    : selected

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.headerLeft}>
          <Text style={cardStyles.situation} numberOfLines={1}>{entry.situation_label}</Text>
          <Text style={cardStyles.date}>{formatDateShortYear(entry.date)}</Text>
        </View>
        <View style={cardStyles.actions}>
          <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={t('common.modify')}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={t('common.delete')}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* SUDs avant / après */}
      <View style={cardStyles.suds}>
        <SudsBar label={t('modules.fear_thermometer.suds_before')} value={entry.suds_before} color="#EF4444" />
        <SudsBar label={t('modules.fear_thermometer.suds_after')} value={entry.suds_after} color="#059669" />
      </View>

      {/* Stratégies utilisées */}
      {allStrategies.length > 0 && (
        <View style={cardStyles.strategies}>
          {allStrategies.map((s, i) => (
            <View key={i} style={cardStyles.strategyBadge}>
              <Text style={cardStyles.strategyText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {!!entry.notes && (
        <Text style={cardStyles.notes} numberOfLines={2}>{entry.notes}</Text>
      )}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 2 },
  situation: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.sm },
  suds: { gap: 4 },
  strategies: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  strategyBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  strategyText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  notes: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
})

// ─── Panneau gestion des situations ──────────────────────────────────────────

interface SituationsPanelProps {
  situations: FearSituation[]
  onAdd: (label: string) => void
  onDelete: (id: string) => void
}

function SituationsPanel({ situations, onAdd, onDelete }: SituationsPanelProps) {
  const { t } = useTranslation()
  const [newLabel, setNewLabel] = useState('')

  const handleAdd = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewLabel('')
  }

  return (
    <View style={panelStyles.container}>
      <Text style={panelStyles.title}>{t('modules.fear_thermometer.situations_title')}</Text>
      <Text style={panelStyles.hint}>{t('modules.fear_thermometer.situations_hint')}</Text>

      {/* Champ d'ajout */}
      <View style={panelStyles.addRow}>
        <TextInput
          style={panelStyles.input}
          placeholder={t('modules.fear_thermometer.situation_placeholder')}
          placeholderTextColor={colors.textMuted}
          value={newLabel}
          onChangeText={setNewLabel}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          testID="new-situation-input"
        />
        <Pressable
          style={panelStyles.addBtn}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel={t('common.add')}
          testID="add-situation-btn"
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Liste */}
      {situations.length === 0 ? (
        <Text style={panelStyles.empty}>{t('modules.fear_thermometer.situation_empty')}</Text>
      ) : (
        <View style={panelStyles.list}>
          {situations.map((s) => (
            <View key={s.id} style={panelStyles.item}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.primary} />
              <Text style={panelStyles.itemLabel} numberOfLines={1}>{s.label}</Text>
              <Pressable
                onPress={() => onDelete(s.id)}
                hitSlop={8}
                accessibilityLabel={`${t('common.delete')} ${s.label}`}
              >
                <MaterialCommunityIcons name="close" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const panelStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { fontSize: 13, color: colors.border, textAlign: 'center', paddingVertical: spacing.sm },
  list: { gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  itemLabel: { flex: 1, fontSize: 13, color: colors.text },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function FearThermometerScreen() {
  const { t } = useTranslation()
  const { teenColor } = useTeen()
  const navigation = useNavigation<Nav>()
  const [entries, setEntries] = useState<FearEntry[]>([])
  const [situations, setSituations] = useState<FearSituation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'entries' | 'situations'>('entries')

  useFocusEffect(
    useCallback(() => {
      let active = true
      Promise.all([getAllFearEntries(), getAllFearSituations()]).then(([e, s]) => {
        if (!active) return
        setEntries(e)
        setSituations(s)
        setLoading(false)
      })
      return () => { active = false }
    }, [])
  )

  const handleAddSituation = useCallback(async (label: string) => {
    const s: Omit<FearSituation, 'created_at'> = { id: generateId(), label }
    await saveFearSituation(s)
    setSituations((prev) => [...prev, { ...s, created_at: new Date().toISOString() }])
  }, [])

  const handleDeleteSituation = useCallback((id: string) => {
    Alert.alert(t('modules.fear_thermometer.delete_situation_title'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteFearSituation(id)
          setSituations((prev) => prev.filter((s) => s.id !== id))
        },
      },
    ])
  }, [t])

  const handleDeleteEntry = useCallback((id: string) => {
    Alert.alert(t('modules.fear_thermometer.delete_entry_title'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteFearEntry(id)
          setEntries((prev) => prev.filter((e) => e.id !== id))
        },
      },
    ])
  }, [t])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('fear_thermometer')} />
      {/* Onglets */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'entries' && styles.tabActive]}
          onPress={() => setTab('entries')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'entries' }}
        >
          <Text style={[styles.tabText, tab === 'entries' && styles.tabTextActive]}>{t('modules.fear_thermometer.tab_entries')}</Text>
          {entries.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{entries.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'situations' && styles.tabActive]}
          onPress={() => setTab('situations')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'situations' }}
        >
          <Text style={[styles.tabText, tab === 'situations' && styles.tabTextActive]}>{t('modules.fear_thermometer.tab_situations')}</Text>
          {situations.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{situations.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {tab === 'entries' ? (
          entries.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="thermometer" size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>{t('modules.fear_thermometer.empty_title')}</Text>
              <Text style={styles.emptyText}>{t('modules.fear_thermometer.empty_text')}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => navigation.navigate('FearEntry', { entryId: entry.id })}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
            </View>
          )
        ) : (
          <SituationsPanel
            situations={situations}
            onAdd={handleAddSituation}
            onDelete={handleDeleteSituation}
          />
        )}
      </ScrollView>

      {/* Bouton nouvelle saisie (uniquement sur l'onglet Saisies) */}
      {tab === 'entries' && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('FearEntry', {})}
            accessibilityRole="button"
            accessibilityLabel={t('modules.fear_thermometer.new_entry')}
            testID="new-entry-btn"
          >
            <MaterialCommunityIcons name="thermometer-plus" size={22} color={colors.white} />
            <Text style={styles.addBtnText}>{t('modules.fear_thermometer.new_entry')}</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
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
  list: { gap: spacing.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
