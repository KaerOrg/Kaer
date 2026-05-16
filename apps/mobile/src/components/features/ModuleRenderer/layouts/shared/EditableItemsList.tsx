import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { colors, radius, spacing } from '../../../../../theme'
import { WeightPicker } from './WeightPicker'

export interface EditableItem {
  id: string
  text: string
  weight: number | null
}

export interface WeightConfig {
  min: number
  max: number
  /** Optional default for new items (defaults to midpoint of min/max). */
  defaultValue?: number
  /** Label rendered above the picker in the form (e.g. "Importance :"). */
  label?: string
}

export interface EditableItemsListProps<TItem extends EditableItem> {
  items: ReadonlyArray<TItem>
  accentColor: string
  /** When set, each item carries a weight rated through a stars widget. Null disables it. */
  weightConfig: WeightConfig | null
  /** Label for the "+ add" trigger (e.g. "Ajouter un argument"). */
  addLabel: string
  /** Placeholder for the new/edit text input. */
  placeholder: string
  onAdd: (text: string, weight: number | null) => Promise<void> | void
  onEdit: (item: TItem, text: string, weight: number | null) => Promise<void> | void
  onDelete: (item: TItem) => void
  /** Optional testID prefix — items get `${prefix}-item-${id}`, etc. */
  testIdPrefix?: string
}

/**
 * Renders a dynamic list of items, each with an optional weight rating, plus an
 * add/edit/delete UI. Pure presentational shell — persistence is delegated to
 * the parent through the callbacks.
 *
 * Used by:
 *   - editable_steps (no weight)
 *   - decision_grid (stars 1–5)
 */
export function EditableItemsList<TItem extends EditableItem>({
  items,
  accentColor,
  weightConfig,
  addLabel,
  placeholder,
  onAdd,
  onEdit,
  onDelete,
  testIdPrefix,
}: EditableItemsListProps<TItem>) {
  const { t } = useTranslation()
  const defaultWeight = weightConfig
    ? weightConfig.defaultValue ?? Math.round((weightConfig.min + weightConfig.max) / 2)
    : null

  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newWeight, setNewWeight] = useState<number | null>(defaultWeight)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editWeight, setEditWeight] = useState<number | null>(null)

  const resetAddForm = useCallback(() => {
    setAdding(false)
    setNewText('')
    setNewWeight(defaultWeight)
  }, [defaultWeight])

  const resetEditForm = useCallback(() => {
    setEditingId(null)
    setEditText('')
    setEditWeight(null)
  }, [])

  const handleStartAdd = useCallback(() => {
    setAdding(true)
    setNewText('')
    setNewWeight(defaultWeight)
    setEditingId(null)
  }, [defaultWeight])

  const handleSaveNew = useCallback(async () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    await onAdd(trimmed, weightConfig ? newWeight : null)
    resetAddForm()
  }, [newText, newWeight, weightConfig, onAdd, resetAddForm])

  const handleStartEdit = useCallback((item: TItem) => {
    setEditingId(item.id)
    setEditText(item.text)
    setEditWeight(item.weight)
    setAdding(false)
  }, [])

  const handleSaveEdit = useCallback(async (item: TItem) => {
    const trimmed = editText.trim()
    if (!trimmed) return
    await onEdit(item, trimmed, weightConfig ? editWeight : null)
    resetEditForm()
  }, [editText, editWeight, weightConfig, onEdit, resetEditForm])

  const tid = testIdPrefix ?? 'edit-list'

  return (
    <View style={styles.root}>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          {editingId === item.id ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.textInput}
                value={editText}
                onChangeText={setEditText}
                autoFocus
                multiline
                placeholderTextColor={colors.textMuted}
                testID={`${tid}-edit-input-${item.id}`}
              />
              {weightConfig && (
                <>
                  {weightConfig.label ? (
                    <Text style={styles.weightLabel}>{weightConfig.label}</Text>
                  ) : null}
                  <WeightPicker
                    value={editWeight ?? defaultWeight ?? weightConfig.min}
                    min={weightConfig.min}
                    max={weightConfig.max}
                    accentColor={accentColor}
                    onChange={setEditWeight}
                    testIdPrefix={`${tid}-edit-weight-${item.id}`}
                  />
                </>
              )}
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: accentColor }]}
                  onPress={() => handleSaveEdit(item)}
                  testID={`${tid}-validate-edit-${item.id}`}
                >
                  <Text style={styles.validateBtnText}>{t('common.validate')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={resetEditForm}
                  testID={`${tid}-cancel-edit-${item.id}`}
                >
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <MaterialCommunityIcons name="circle-small" size={20} color={accentColor} />
              <Pressable
                style={styles.itemTextArea}
                onPress={() => handleStartEdit(item)}
                testID={`${tid}-item-${item.id}`}
              >
                <Text style={styles.itemContent}>{item.text}</Text>
                {weightConfig && item.weight != null && (
                  <WeightPicker
                    value={item.weight}
                    min={weightConfig.min}
                    max={weightConfig.max}
                    accentColor={accentColor}
                    onChange={async (newW) => {
                      // Inline weight tap: persist directly without entering edit mode.
                      await onEdit(item, item.text, newW)
                    }}
                    testIdPrefix={`${tid}-weight-${item.id}`}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => onDelete(item)}
                hitSlop={8}
                accessibilityLabel={`${t('common.delete')} : ${item.text}`}
                testID={`${tid}-delete-${item.id}`}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </View>
      ))}

      {adding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={newText}
            onChangeText={setNewText}
            autoFocus
            multiline
            testID={`${tid}-new-input`}
          />
          {weightConfig && (
            <>
              {weightConfig.label ? (
                <Text style={styles.weightLabel}>{weightConfig.label}</Text>
              ) : null}
              <WeightPicker
                value={newWeight ?? defaultWeight ?? weightConfig.min}
                min={weightConfig.min}
                max={weightConfig.max}
                accentColor={accentColor}
                onChange={setNewWeight}
                testIdPrefix={`${tid}-new-weight`}
              />
            </>
          )}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: accentColor }]}
              onPress={handleSaveNew}
              testID={`${tid}-validate-new`}
            >
              <Text style={styles.validateBtnText}>{t('common.validate')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={resetAddForm}
              testID={`${tid}-cancel-new`}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.addBtn}
          onPress={handleStartAdd}
          testID={`${tid}-add`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={18} color={accentColor} />
          <Text style={[styles.addBtnText, { color: accentColor }]}>{addLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:            { gap: spacing.sm },
  itemRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  itemTextArea:    { flex: 1, gap: 0 },
  itemContent:     { fontSize: 15, color: colors.text, lineHeight: 22 },
  editContainer:   { flex: 1, gap: spacing.xs },
  addForm:         { gap: spacing.xs, marginTop: spacing.xs },
  textInput:       { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, padding: spacing.sm, fontSize: 15, color: colors.text, minHeight: 44 },
  weightLabel:     { fontSize: 11, color: colors.textMuted },
  actionRow:       { flexDirection: 'row', gap: spacing.sm },
  actionBtn:       { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  cancelBtn:       { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  validateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtnText:   { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  addBtn:          { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, marginTop: spacing.xs },
  addBtnText:      { fontSize: 14, fontWeight: '500' },
})
