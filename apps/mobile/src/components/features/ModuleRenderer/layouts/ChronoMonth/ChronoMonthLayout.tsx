import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Button } from '../../../../ui/Button'
import { useTranslation } from 'react-i18next'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing } from '@theme'
import { getAllFormEntries, type FormEntry } from '../../../../../lib/database'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { CalendarGrid } from './CalendarGrid'
import { RhythmogramChart } from './RhythmogramChart'
import {
  buildEntriesByDate,
  DEFAULT_ANCHORS,
  type AnchorEntry,
  type AnchorSpec,
} from './chronoMonthUtils'

type Nav = NativeStackNavigationProp<AppStackParamList>

interface Props {
  moduleId: string
}

function formEntriesToAnchorEntries(entries: readonly FormEntry[]): AnchorEntry[] {
  // Une form_entry = un jour. Date implicite = values.date (YYYY-MM-DD), à
  // défaut on prend created_at en tronquant à la date locale.
  const out: AnchorEntry[] = []
  for (const e of entries) {
    const rawDate = e.values['date']
    const date =
      typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : e.created_at.slice(0, 10)

    const anchors: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(e.values)) {
      if (k === 'date') continue
      anchors[k] = typeof v === 'string' && v.length > 0 ? v : null
    }
    out.push({ date, anchors })
  }
  return out
}

// Layout 'chrono_month' : visualisation mensuelle des 5 ancrages quotidiens.
// Lit form_entries, regroupe par date, affiche calendrier + bande de rythme.
// Au tap d'un jour, navigue vers ModuleContent du même module en mode entry
// (responsabilité du layout column_form qui gère la création/édition).
export function ChronoMonthLayout({ moduleId }: Props) {
  const { t, i18n } = useTranslation()
  const navigation = useNavigation<Nav>()

  const now = useMemo(() => new Date(), [])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState<readonly AnchorEntry[]>([])
  const [loading, setLoading] = useState(true)

  const todayISO = useMemo(() => now.toISOString().slice(0, 10), [now])
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const load = useCallback(() => {
    getAllFormEntries(moduleId)
      .then(rows => {
        setEntries(formEntriesToAnchorEntries(rows))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [moduleId])

  useEffect(() => {
    void load()
  }, [load])

  useFocusEffect(load)

  const entriesByDate = useMemo(() => buildEntriesByDate(entries), [entries])
  // Forme attendue par le rythmogramme partagé (date + map horaires bruts).
  const rhythmEntries = useMemo(
    () => entries.map(e => ({ date: e.date, values: e.anchors })),
    [entries],
  )

  const goToPrev = useCallback(() => {
    if (month === 1) {
      setYear(y => y - 1)
      setMonth(12)
    } else {
      setMonth(m => m - 1)
    }
  }, [month])

  const goToNext = useCallback(() => {
    if (isCurrentMonth) return
    if (month === 12) {
      setYear(y => y + 1)
      setMonth(1)
    } else {
      setMonth(m => m + 1)
    }
  }, [month, isCurrentMonth])

  const handleDayPress = useCallback(() => {
    // Re-mount du module en mode list — l'utilisateur clique ensuite sur
    // "Nouvelle saisie" ou édite l'entrée existante via le layout
    // column_form. (On ne navigue pas vers un écran custom car on est en
    // archi générique.)
    navigation.navigate('ModuleContent', { moduleType: moduleId })
  }, [navigation, moduleId])

  const anchors: readonly AnchorSpec[] = DEFAULT_ANCHORS
  const anchorKeys = useMemo(() => anchors.map(a => a.key), [anchors])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container} testID="chrono-month-layout">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.navRow}>
          <Button
            variant="ghost"
            onPress={goToPrev}
            iconLeft={<ChevronLeft size={22} color={colors.primary} />}
            accessibilityLabel={t('common.prev_month')}
            testID="chrono-prev-month"
          />
          <Text style={styles.monthTitle}>
            {(() => {
              const raw = new Date(year, month - 1, 1).toLocaleDateString(i18n.language, {
                month: 'long',
                year: 'numeric',
              })
              return raw.charAt(0).toUpperCase() + raw.slice(1)
            })()}
          </Text>
          <Button
            variant="ghost"
            onPress={goToNext}
            disabled={isCurrentMonth}
            iconLeft={<ChevronRight size={22} color={isCurrentMonth ? colors.border : colors.primary} />}
            accessibilityLabel={t('common.next_month')}
            testID="chrono-next-month"
          />
        </View>

        <CalendarGrid
          year={year}
          month={month}
          entriesByDate={entriesByDate}
          todayISO={todayISO}
          anchorKeys={anchorKeys}
          onDayPress={handleDayPress}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          {t('modules.chronobiology_tracker.rhythm_band_title')}
        </Text>

        <RhythmogramChart entries={rhythmEntries} year={year} month={month} anchors={anchors} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: { paddingBottom: spacing.xl },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
})
