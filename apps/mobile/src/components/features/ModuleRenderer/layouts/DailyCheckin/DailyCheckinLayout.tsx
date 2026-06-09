// ─── Layout `daily_checkin` — saisie quotidienne (medication_adherence…) ─────
//
// Pattern « 1 statut par jour, persistance UPSERT par (module_id, date) ».
// 2 onglets internes : today | history. Le statut, les notes et la liste 30j
// sont gérés en interne. Persistance SQLite locale via `daily_entries`.
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// déclarations brutes du patient + pastilles de couleur fournies par la base.

import { useState, useCallback, useEffect, useMemo, type ComponentProps } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import {
  getDailyEntry, getAllDailyEntries, generateId, type DailyEntry,
} from '../../../../../lib/database'
import { saveDailyEntry, deleteDailyEntry } from '../../../../../services/dailyEntryService'
import { formatDateFull, formatDateNumeric } from '../../../../../lib/dateUtils'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

export interface DailyCheckinLayoutProps {
  /** Fields du module (config + options de statut). */
  fields: ContentField[]
  /** Identifiant du module — clé de persistance des `daily_entries`. */
  moduleId: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DailyCheckinLayout({ fields, moduleId }: DailyCheckinLayoutProps) {
  const t = useModuleT()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  // ── Résolution des champs DB-driven
  const configField = fields.find(f => f.field_type === 'daily_checkin_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }

  const statusOptions = useMemo(
    () => fields
      .filter(f => f.field_type === 'daily_status_option')
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields]
  )

  // ── State
  const todayDate = useMemo(() => todayISO(), [])
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [todayEntry, history] = await Promise.all([
      getDailyEntry(moduleId, todayDate),
      getAllDailyEntries(moduleId, 30),
    ])
    if (todayEntry) {
      setExistingId(todayEntry.id)
      setSelectedValue(todayEntry.status)
      setNotes(todayEntry.notes ?? '')
    } else {
      setExistingId(null)
      setSelectedValue(null)
      setNotes('')
    }
    setEntries(history)
    setLoading(false)
  }, [moduleId, todayDate])

  useEffect(() => { loadData().catch(() => setLoading(false)) }, [loadData])

  const handleSave = useCallback(async () => {
    if (!selectedValue) {
      showToast(lbl('status_missing_msg') || t('common.error'), 'info')
      return
    }
    setSaving(true)
    try {
      const entry: Omit<DailyEntry, 'created_at'> = {
        id: existingId ?? generateId(),
        module_id: moduleId,
        date: todayDate,
        status: selectedValue,
        reason: null,
        notes: notes.trim() || null,
      }
      await saveDailyEntry(entry)
      setExistingId(entry.id)
      await loadData()
      const savedMsg = lbl('saved_message')
      if (savedMsg) showToast(savedMsg, 'success')
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [selectedValue, existingId, notes, moduleId, todayDate, loadData, lbl, t, showToast])

  const handleDelete = useCallback((entry: DailyEntry) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteDailyEntry(entry.id)
        setEntries(prev => prev.filter(e => e.id !== entry.id))
        if (entry.date === todayDate) {
          setExistingId(null)
          setSelectedValue(null)
          setNotes('')
        }
      },
    })
  }, [lbl, t, todayDate, showConfirm])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  const saveLabel = existingId
    ? (lbl('update_label') || t('common.update'))
    : (lbl('save_label') || t('common.save'))
  const tabTodayLabel = lbl('tab_today_label')
  const tabHistoryLabel = lbl('tab_history_label')

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {/* Onglets */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'today' && styles.tabActive]}
          onPress={() => setTab('today')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'today' }}
          testID="tab-today"
        >
          <Text style={[styles.tabText, tab === 'today' && styles.tabTextActive]}>{tabTodayLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'history' }}
          testID="tab-history"
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>{tabHistoryLabel}</Text>
          {entries.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{entries.length}</Text></View>
          )}
        </Pressable>
      </View>

      {tab === 'today' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date du jour */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateLabel}>{lbl('today_label')}</Text>
            <Text style={styles.dateValue}>{formatDateFull(todayDate)}</Text>
          </View>

          {/* Indicateur saisie déjà effectuée */}
          {existingId && lbl('already_saved_label') ? (
            <View style={styles.savedBadge} testID="already-saved-badge">
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
              <Text style={styles.savedBadgeText}>{lbl('already_saved_label')}</Text>
            </View>
          ) : null}

          {/* Question + boutons de statut */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{lbl('question')}</Text>
            <View style={styles.statusRow}>
              {statusOptions.map(opt => {
                const value = opt.props['value'] ?? ''
                const iconName = (opt.props['icon'] ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
                const color = opt.props['color'] ?? colors.textMuted
                const bgColor = opt.props['bg_color'] ?? colors.background
                const selected = selectedValue === value
                const label = opt.text_code ? t(opt.text_code) : value
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.statusBtn,
                      selected && { backgroundColor: bgColor, borderColor: color },
                    ]}
                    onPress={() => setSelectedValue(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={label}
                    testID={`status-${value}`}
                  >
                    <MaterialCommunityIcons name={iconName} size={22} color={selected ? color : colors.border} />
                    <Text style={[styles.statusLabel, selected && { color }]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>{lbl('notes_label') || t('common.notes_optional')}</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={lbl('notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {entries.length === 0 ? (
            <View style={styles.empty} testID="history-empty">
              <Text style={styles.emptyText}>{lbl('history_empty_text')}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {entries.map(entry => {
                const meta = statusOptions.find(o => (o.props['value'] ?? '') === (entry.status ?? ''))
                const iconName = (meta?.props['icon'] ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
                const color = meta?.props['color'] ?? colors.textMuted
                const bgColor = meta?.props['bg_color'] ?? colors.background
                const label = meta?.text_code ? t(meta.text_code) : (entry.status ?? '')
                return (
                  <View key={entry.id} style={styles.histCard} testID={`history-${entry.id}`}>
                    <View style={styles.histMain}>
                      <Text style={styles.histDate}>{formatDateNumeric(entry.date)}</Text>
                      <View style={[styles.histBadge, { backgroundColor: bgColor }]}>
                        <MaterialCommunityIcons name={iconName} size={13} color={color} />
                        <Text style={[styles.histBadgeText, { color }]}>{label}</Text>
                      </View>
                      {entry.notes ? (
                        <Text style={styles.histNotes} numberOfLines={1}>{entry.notes}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(entry)}
                      hitSlop={8}
                      accessibilityLabel={t('common.delete')}
                      testID={`delete-${entry.id}`}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Footer bouton sauvegarder — uniquement sur l'onglet Aujourd'hui */}
      {tab === 'today' && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            testID="save-button"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>{saveLabel}</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
