// ─── Layout `sleep_journal` — agenda du sommeil (sleep_diary) ────────────────
//
// Orchestrateur : route entre 3 vues (liste / saisie / mois), détient la liste
// des entrées et l'état du mois, construit le résolveur de libellés (`lbl`) et la
// config numérique depuis le field `sleep_journal_config`. La saisie d'une nuit
// possède son propre état (SleepEntryView). Persistance SQLite dédiée
// (`sleep_diary_entries`, UNIQUE par date), alignée Consensus Sleep Diary.
// Conformité MDR 2017/745 : côté patient, affichage neutre des valeurs brutes,
// aucune couleur de jugement.

import { useState, useCallback, useEffect, useMemo } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors } from '@theme'
import {
  getAllSleepEntries, getSleepEntriesForMonth, type SleepEntry,
} from '../../../../../lib/database'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { SleepJournalLayoutProps, SleepConfig, Lbl } from './types'
import { toYearMonth, yesterdayDateStr } from './sleepHelpers'
import { SleepListView } from './SleepListView'
import { SleepMonthView } from './SleepMonthView'
import { SleepEntryView } from './SleepEntryView'
import { styles } from './styles'

export function SleepJournalLayout({ fields, footer }: SleepJournalLayoutProps) {
  const t = useModuleTranslation()

  const configField = fields.find(f => f.field_type === 'sleep_journal_config')
  const lbl = useCallback<Lbl>((key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }, [configField, t])

  const config = useMemo<SleepConfig>(() => ({
    historyDays: parseInt(configField?.props['history_days'] ?? '14', 10),
    awakeningsMax: parseInt(configField?.props['awakenings_max'] ?? '20', 10),
    onsetMaxMinutes: parseInt(configField?.props['onset_max_minutes'] ?? '180', 10),
    awakDurationMaxMinutes: parseInt(configField?.props['awak_duration_max_minutes'] ?? '300', 10),
    napMaxMinutes: parseInt(configField?.props['nap_max_minutes'] ?? '600', 10),
    qualityMax: parseInt(configField?.props['quality_max'] ?? '5', 10),
  }), [configField])

  const now = useMemo(() => new Date(), [])

  const [mode, setMode] = useState<'list' | 'entry' | 'month'>('list')
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [targetDate, setTargetDate] = useState<string>(yesterdayDateStr())

  const [monthYear, setMonthYear] = useState(now.getFullYear())
  const [monthNum, setMonthNum] = useState(now.getMonth() + 1)
  const [monthEntries, setMonthEntries] = useState<SleepEntry[]>([])

  // Masque le header React Navigation en mode saisie (l'en-tête interne porte le titre).
  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({ headerShown: mode !== 'entry' })
  }, [navigation, mode])

  const loadEntries = useCallback(async () => {
    const data = await getAllSleepEntries()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadEntries().catch(() => setLoading(false)) }, [loadEntries])

  const loadMonth = useCallback(async (year: number, monthVal: number) => {
    const data = await getSleepEntriesForMonth(toYearMonth(year, monthVal))
    setMonthEntries(data)
  }, [])

  const handleOpenEntry = useCallback((date: string) => {
    setTargetDate(date)
    setMode('entry')
  }, [])

  const handleOpenMonth = useCallback(() => {
    void loadMonth(monthYear, monthNum)
    setMode('month')
  }, [loadMonth, monthYear, monthNum])

  const handleEntryClose = useCallback(() => {
    void loadEntries()
    setMode('list')
  }, [loadEntries])

  const handleBackToList = useCallback(() => {
    void loadEntries()
    setMode('list')
  }, [loadEntries])

  const goPrevMonth = useCallback(() => {
    let y = monthYear, m = monthNum
    if (m === 1) { y -= 1; m = 12 } else { m -= 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth])

  const goNextMonth = useCallback(() => {
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    if (monthYear > nowYear || (monthYear === nowYear && monthNum >= nowMonth)) return
    let y = monthYear, m = monthNum
    if (m === 12) { y += 1; m = 1 } else { m += 1 }
    setMonthYear(y)
    setMonthNum(m)
    void loadMonth(y, m)
  }, [monthYear, monthNum, loadMonth, now])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (mode === 'entry') {
    return <SleepEntryView targetDate={targetDate} lbl={lbl} t={t} config={config} onClose={handleEntryClose} />
  }

  if (mode === 'month') {
    return (
      <SleepMonthView
        lbl={lbl}
        t={t}
        monthYear={monthYear}
        monthNum={monthNum}
        monthEntries={monthEntries}
        now={now}
        onBack={handleBackToList}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
      />
    )
  }

  return (
    <SleepListView
      entries={entries}
      lbl={lbl}
      t={t}
      historyDays={config.historyDays}
      qualityMax={config.qualityMax}
      footer={footer}
      onOpenEntry={handleOpenEntry}
      onOpenMonth={handleOpenMonth}
    />
  )
}
