import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {
  getAllActivityRecords,
  deleteActivityRecord,
  saveActivityRecord,
  type ActivityRecord,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius } from '../../theme'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { StatusBadge } from '../../components/StatusBadge'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(records: ActivityRecord[]): { date: string; items: ActivityRecord[] }[] {
  const map = new Map<string, ActivityRecord[]>()
  for (const r of records) {
    const list = map.get(r.date) ?? []
    list.push(r)
    map.set(r.date, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ─── Carte d'une activité ─────────────────────────────────────────────────────

interface ActivityCardProps {
  record: ActivityRecord
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
}

function ActivityCard({ record, onToggleDone, onEdit, onDelete }: ActivityCardProps) {
  return (
    <Card state={record.done === 1 ? 'disabled' : undefined}>
      <View style={cardStyles.row}>
        <Pressable
          style={cardStyles.checkbox}
          onPress={onToggleDone}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: record.done === 1 }}
          accessibilityLabel={record.done === 1 ? 'Marquer comme non réalisée' : 'Marquer comme réalisée'}
        >
          <MaterialCommunityIcons
            name={record.done === 1 ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={26}
            color={record.done === 1 ? colors.success : colors.border}
          />
        </Pressable>

        <View style={cardStyles.content}>
          <Text style={[cardStyles.label, record.done === 1 && cardStyles.labelDone]}>
            {record.label}
          </Text>
          <View style={cardStyles.scores}>
            <StatusBadge variant="info" label="P" value={record.pleasure} />
            <StatusBadge variant="info" label="M" value={record.mastery} />
          </View>
          {!!record.notes && (
            <Text style={cardStyles.notes} numberOfLines={1}>{record.notes}</Text>
          )}
        </View>

        <View style={cardStyles.actions}>
          <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel="Modifier">
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Supprimer">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Card>
  )
}

const cardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 32, alignItems: 'center' },
  content: { flex: 1, gap: 4 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  labelDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  scores: { flexDirection: 'row', gap: spacing.xs },
  notes: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  actions: { gap: spacing.sm, alignItems: 'center' },
})

// ─── Vue mensuelle ────────────────────────────────────────────────────────────

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface MonthCalendarProps {
  records: ActivityRecord[]
  selectedDay: string | null
  onDayPress: (date: string) => void
}

function MonthCalendarView({ records, selectedDay, onDayPress }: MonthCalendarProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = month.getFullYear()
  const m = month.getMonth()

  // Index des activités du mois courant
  const activityMap = new Map<string, { done: number; planned: number }>()
  for (const r of records) {
    const d = new Date(r.date + 'T00:00:00')
    if (d.getFullYear() === year && d.getMonth() === m) {
      const cur = activityMap.get(r.date) ?? { done: 0, planned: 0 }
      if (r.done === 1) cur.done++
      else cur.planned++
      activityMap.set(r.date, cur)
    }
  }

  // Construction de la grille
  const firstDay = new Date(year, m, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6 // dimanche → décalage 6 (semaine commence lundi)
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === m && today.getDate() === day

  const getDateStr = (day: number) => {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Stat du mois
  const monthDone = [...activityMap.values()].reduce((acc, v) => acc + v.done, 0)
  const monthPlanned = [...activityMap.values()].reduce((acc, v) => acc + v.planned, 0)

  return (
    <View style={calStyles.wrapper}>
      {/* Navigation mois */}
      <View style={calStyles.navRow}>
        <Pressable
          onPress={() => setMonth(new Date(year, m - 1, 1))}
          hitSlop={12}
          accessibilityLabel="Mois précédent"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
        </Pressable>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={() => setMonth(new Date(year, m + 1, 1))}
          hitSlop={12}
          accessibilityLabel="Mois suivant"
        >
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.primary} />
        </Pressable>
      </View>

      {/* En-têtes des jours */}
      <View style={calStyles.grid}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={calStyles.weekDay}>{d}</Text>
        ))}

        {/* Cellules */}
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={calStyles.cell} />
          const dateStr = getDateStr(day)
          const acts = activityMap.get(dateStr)
          const isTod = isToday(day)
          const isSel = selectedDay === dateStr
          return (
            <Pressable
              key={dateStr}
              style={[
                calStyles.cell,
                isTod && calStyles.cellToday,
                isSel && calStyles.cellSelected,
                acts && !isSel && calStyles.cellHasActivity,
              ]}
              onPress={() => onDayPress(dateStr)}
              accessibilityRole="button"
              accessibilityLabel={`${formatDate(dateStr)}${acts ? `, ${acts.done + acts.planned} activité(s)` : ''}`}
            >
              <Text style={[
                calStyles.dayNum,
                isTod && calStyles.dayNumToday,
                isSel && calStyles.dayNumSelected,
              ]}>
                {day}
              </Text>
              {acts && (
                <View style={calStyles.dots}>
                  {acts.done > 0 && <View style={[calStyles.dot, calStyles.dotDone]} />}
                  {acts.planned > 0 && <View style={[calStyles.dot, calStyles.dotPlanned]} />}
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* Légende + stats */}
      <View style={calStyles.footer}>
        <View style={calStyles.legend}>
          <View style={calStyles.legendItem}>
            <View style={[calStyles.dot, calStyles.dotDone]} />
            <Text style={calStyles.legendText}>Réalisée</Text>
          </View>
          <View style={calStyles.legendItem}>
            <View style={[calStyles.dot, calStyles.dotPlanned]} />
            <Text style={calStyles.legendText}>Planifiée</Text>
          </View>
        </View>
        {(monthDone > 0 || monthPlanned > 0) && (
          <Text style={calStyles.stat}>
            {monthDone} réalisée{monthDone > 1 ? 's' : ''} · {monthPlanned} planifiée{monthPlanned > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  )
}

const calStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    gap: 2,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellHasActivity: {
    backgroundColor: colors.primaryLight,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  dayNumToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayNumSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  dotDone: { backgroundColor: colors.success },
  dotPlanned: { backgroundColor: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legend: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { fontSize: 11, color: colors.textMuted },
  stat: { fontSize: 11, color: colors.textMuted },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

type ViewMode = 'list' | 'month'

export default function BehavioralActivationScreen() {
  const navigation = useNavigation<Nav>()
  const [records, setRecords] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    const data = await getAllActivityRecords()
    setRecords(data)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadRecords()
    }, [loadRecords])
  )

  const handleToggleDone = async (record: ActivityRecord) => {
    await saveActivityRecord({ ...record, done: record.done === 1 ? 0 : 1 })
    await loadRecords()
  }

  const handleDelete = (record: ActivityRecord) => {
    Alert.alert(
      'Supprimer cette activité ?',
      `"${record.label}" sera supprimée définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteActivityRecord(record.id)
            await loadRecords()
          },
        },
      ]
    )
  }

  const handleDayPress = (dateStr: string) => {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr))
  }

  // En vue mois : filtre sur le jour sélectionné ; sinon tout
  const displayedRecords = viewMode === 'month' && selectedDay
    ? records.filter((r) => r.date === selectedDay)
    : records

  const groups = groupByDate(displayedRecords)

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Toggle Liste / Mois */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, viewMode === 'list' && styles.tabActive]}
          onPress={() => { setViewMode('list'); setSelectedDay(null) }}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === 'list' }}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={viewMode === 'list' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>Liste</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, viewMode === 'month' && styles.tabActive]}
          onPress={() => setViewMode('month')}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === 'month' }}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={16}
            color={viewMode === 'month' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, viewMode === 'month' && styles.tabTextActive]}>Mois</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* Calendrier mensuel (vue mois uniquement) */}
            {viewMode === 'month' && (
              <MonthCalendarView
                records={records}
                selectedDay={selectedDay}
                onDayPress={handleDayPress}
              />
            )}

            {/* Liste vide */}
            {records.length === 0 ? (
              <EmptyState
                icon="🏃"
                title="Aucune activité"
                description={`Ajoutez des activités à planifier ou réalisées.\nÉvaluez chaque activité en Plaisir (P) et Maîtrise (M).`}
              />
            ) : viewMode === 'month' && !selectedDay ? (
              // En vue mois sans jour sélectionné : invite à toucher un jour
              <View style={styles.monthHint}>
                <MaterialCommunityIcons name="gesture-tap" size={24} color={colors.textMuted} />
                <Text style={styles.monthHintText}>
                  Touchez un jour du calendrier pour voir ses activités
                </Text>
              </View>
            ) : viewMode === 'month' && selectedDay && groups.length === 0 ? (
              <View style={styles.monthHint}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={colors.textMuted} />
                <Text style={styles.monthHintText}>Aucune activité ce jour-là</Text>
              </View>
            ) : (
              // Groupes d'activités
              groups.map(({ date, items }) => (
                <View key={date} style={styles.group}>
                  {viewMode === 'list' && (
                    <Text style={styles.groupDate}>{formatDate(date)}</Text>
                  )}
                  {viewMode === 'month' && selectedDay && (
                    <Text style={styles.groupDate}>{formatDate(date)}</Text>
                  )}
                  {items.map((r) => (
                    <ActivityCard
                      key={r.id}
                      record={r}
                      onToggleDone={() => handleToggleDone(r)}
                      onEdit={() => navigation.navigate('BehavioralActivationEntry', { recordId: r.id })}
                      onDelete={() => handleDelete(r)}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Bouton ajout flottant */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('BehavioralActivationEntry', {})}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une activité"
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },

  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 96 },
  loader: { marginTop: spacing.xl * 2 },

  monthHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  monthHintText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  group: { gap: spacing.sm },
  groupDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
})
