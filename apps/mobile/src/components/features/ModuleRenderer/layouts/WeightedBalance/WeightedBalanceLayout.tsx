// ─── Layout `weighted_balance` — valeurs + balance décisionnelle pondérée ────
//
// Motif « ce qui compte pour moi, et le pour/contre du changement » : sélection
// de valeurs (chips, max configurable) + deux blocs Pour/Contre dont chaque
// raison porte un poids 1..N. Persistance via motivationalBalanceService
// (`em_values` + `em_balance_items`). Layout générique : la liste des valeurs et
// le maximum proviennent d'un field `weighted_balance_config` (clés indexées
// `value_1..`, `max_values`), les libellés du `moduleId`.
// Conformité MDR 2017/745 : pondération subjective du patient, échelle de poids
// monochrome (aucune couleur de gravité), zéro interprétation.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Plus, Trash2 } from 'lucide-react-native'
import { collectIndexed } from '@kaer/shared'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { Chip } from '@ui/Chip'
import { InputField } from '@ui/InputField'
import { RatingSelector } from '@ui/RatingSelector'
import { generateId } from '../../../../../lib/database'
import type { EMBalanceItem } from '../../../../../lib/database'
import {
  listEMValues, saveEMValues,
  listEMBalanceItems, saveEMBalanceItem, deleteEMBalanceItem,
} from '@services/motivationalBalanceService'
import type { ContentField } from '@services/moduleService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

const DEFAULT_MAX_VALUES = 3
const DEFAULT_ACCENT = '#0EA5E9'
const WEIGHT_STEPS: number[] = [1, 2, 3]

type Side = 'for' | 'against'

export interface WeightedBalanceLayoutProps {
  /** Fields du module — le `weighted_balance_config` (liste de valeurs) en est extrait. */
  fields: ContentField[]
  /** Identifiant du module — sert à dériver les clés i18n `modules.<id>.*`. */
  moduleId: string
  /** Couleur d'accent (mode ado). */
  accentColor?: string
}

export function WeightedBalanceLayout({ fields, moduleId, accentColor }: WeightedBalanceLayoutProps) {
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()
  const accent = accentColor ?? DEFAULT_ACCENT

  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])

  const config = useMemo(
    () => fields.find(f => f.field_type === 'weighted_balance_config'),
    [fields]
  )
  const valueKeys = useMemo(
    () => (config ? collectIndexed(config.props, 'value') : []),
    [config]
  )
  const maxValues = useMemo(
    () => parseInt(config?.props['max_values'] ?? String(DEFAULT_MAX_VALUES), 10),
    [config]
  )

  const [values, setValues] = useState<string[]>([])
  const [items, setItems] = useState<EMBalanceItem[]>([])
  const [newFor, setNewFor] = useState('')
  const [newAgainst, setNewAgainst] = useState('')
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const [vals, its] = await Promise.all([listEMValues(), listEMBalanceItems()])
    setValues(vals.map(v => v.value_key))
    setItems(its)
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  const toggleValue = useCallback((key: string) => {
    setValues(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= maxValues) return prev
      return [...prev, key]
    })
  }, [maxValues])

  const handleSaveValues = useCallback(async () => {
    await saveEMValues(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [values])

  const addItem = useCallback(async (side: Side) => {
    const text = (side === 'for' ? newFor : newAgainst).trim()
    if (!text) return
    const item: EMBalanceItem = {
      id: generateId(),
      behavior_target: '',
      side,
      text,
      weight: 1,
      sort_order: items.filter(i => i.side === side).length,
      created_at: new Date().toISOString(),
    }
    await saveEMBalanceItem(item)
    setItems(prev => [...prev, item])
    if (side === 'for') setNewFor('')
    else setNewAgainst('')
  }, [newFor, newAgainst, items])

  const updateWeight = useCallback(async (id: string, weight: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const updated = { ...item, weight }
    await saveEMBalanceItem(updated)
    setItems(prev => prev.map(i => (i.id === id ? updated : i)))
  }, [items])

  const removeItem = useCallback((id: string) => {
    showConfirm({
      title: lbl('rulers_delete_confirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteEMBalanceItem(id)
        setItems(prev => prev.filter(i => i.id !== id))
      },
    })
  }, [showConfirm, lbl, t])

  const renderBlock = (side: Side) => {
    const blockItems = items.filter(i => i.side === side)
    const titleKey = side === 'for' ? 'balance_for' : 'balance_against'
    const addLabelKey = side === 'for' ? 'balance_add_for' : 'balance_add_against'
    const value = side === 'for' ? newFor : newAgainst
    const setValue = side === 'for' ? setNewFor : setNewAgainst
    return (
      <View>
        <Text style={[styles.blockTitle, { color: side === 'for' ? accent : colors.textMuted }]}>
          {lbl(titleKey)}
        </Text>
        {blockItems.length === 0 ? (
          <Text style={styles.emptyText}>{lbl('balance_no_items')}</Text>
        ) : null}
        {blockItems.map(item => (
          <Card key={item.id}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.itemFooter}>
              <View style={styles.weightBox}>
                <RatingSelector
                  label={lbl('balance_weight_label')}
                  value={item.weight}
                  steps={WEIGHT_STEPS}
                  color={side === 'for' ? accent : colors.textMuted}
                  variant="track"
                  showHeader={false}
                  testIdPrefix={`weight-${item.id}`}
                  onPress={w => updateWeight(item.id, w)}
                />
              </View>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Trash2 size={16} color={colors.textMuted} />}
                onPress={() => removeItem(item.id)}
                accessibilityLabel={t('common.delete')}
                testID={`balance-delete-${item.id}`}
              />
            </View>
          </Card>
        ))}
        <View style={styles.addRow}>
          <View style={styles.addInputBox}>
            <InputField
              label={lbl(addLabelKey)}
              value={value}
              onChangeText={setValue}
              placeholder={lbl('balance_item_placeholder')}
              returnKeyType="done"
              onSubmitEditing={() => addItem(side)}
              testID={`balance-${side}-input`}
            />
          </View>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Plus size={16} color={colors.primary} />}
            onPress={() => addItem(side)}
            accessibilityLabel={lbl(addLabelKey)}
            testID={`balance-${side}-add`}
          />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" testID="weighted-balance-layout">
        {/* Valeurs */}
        <Text style={styles.sectionTitle}>{lbl('balance_values_title')}</Text>
        <Text style={styles.sectionSubtitle}>{lbl('balance_values_subtitle')}</Text>
        {valueKeys.length > 0 ? (
          <View style={styles.chipsGrid}>
            {valueKeys.map(key => (
              <Chip
                key={key}
                label={lbl(`values_${key}`)}
                selected={values.includes(key)}
                color={accent}
                onPress={() => toggleValue(key)}
                testID={`value-chip-${key}`}
              />
            ))}
          </View>
        ) : null}
        <Button
          label={lbl('balance_values_save')}
          variant="secondary"
          onPress={handleSaveValues}
          testID="values-save-btn"
        />
        {saved ? <Text style={styles.savedMsg}>{lbl('balance_saved')}</Text> : null}

        {/* Pour / Contre */}
        {renderBlock('for')}
        {renderBlock('against')}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
