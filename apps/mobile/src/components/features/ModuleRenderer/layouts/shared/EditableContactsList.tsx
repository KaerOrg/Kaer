// ─── EditableContactsList : édition des contacts appelables du plan ──────────
//
// Liste éditable des contacts d'une étape « contactable » (proches/pros, étapes 4
// & 5 du plan de crise) : chaque contact porte un nom + un numéro. Le patient peut
// saisir un contact à la main OU l'importer depuis le répertoire du téléphone
// (`onImport`), l'éditer et le supprimer. Coque présentationnelle : la persistance
// est déléguée au parent via les callbacks (comme `EditableItemsList`).
//
// Construit uniquement avec les primitives du design system (`@ui/Button`,
// `@ui/InputField`). Conformité MDR 2017/745 : journal libre du patient.

import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, radius, spacing } from '@theme'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'

export interface EditableContact {
  id: string
  /** Nom du contact (mappé sur `PlanItem.text`). */
  name: string
  /** Numéro de téléphone ('' si absent). */
  phone: string
}

export interface EditableContactsListProps {
  contacts: ReadonlyArray<EditableContact>
  accentColor: string
  /** Libellés i18n fournis par le parent (zéro texte en dur ici). */
  addLabel: string
  importLabel: string
  namePlaceholder: string
  phonePlaceholder: string
  validateLabel: string
  cancelLabel: string
  deleteLabel: string
  onAdd: (name: string, phone: string, source: string | null) => Promise<void> | void
  onEdit: (id: string, name: string, phone: string) => Promise<void> | void
  onDelete: (contact: EditableContact) => void
  /** Ouvre le répertoire du téléphone ; renvoie le contact choisi ou null. */
  onImport: () => Promise<{ name: string; phone: string } | null>
  testIdPrefix?: string
}

export function EditableContactsList({
  contacts,
  accentColor,
  addLabel,
  importLabel,
  namePlaceholder,
  phonePlaceholder,
  validateLabel,
  cancelLabel,
  deleteLabel,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  testIdPrefix,
}: EditableContactsListProps) {
  const tid = testIdPrefix ?? 'contacts'

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  // Provenance : 'phonebook' si le contact a été importé, null s'il est saisi à la main.
  const [newSource, setNewSource] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const resetAddForm = useCallback(() => {
    setAdding(false)
    setNewName('')
    setNewPhone('')
    setNewSource(null)
  }, [])

  const resetEditForm = useCallback(() => {
    setEditingId(null)
    setEditName('')
    setEditPhone('')
  }, [])

  const handleStartAdd = useCallback(() => {
    setAdding(true)
    setNewName('')
    setNewPhone('')
    setNewSource(null)
    setEditingId(null)
  }, [])

  const handleImport = useCallback(async () => {
    const picked = await onImport()
    if (picked == null) return
    setAdding(true)
    setEditingId(null)
    setNewName(picked.name)
    setNewPhone(picked.phone)
    setNewSource('phonebook')
  }, [onImport])

  const handleSaveNew = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    await onAdd(name, newPhone.trim(), newSource)
    resetAddForm()
  }, [newName, newPhone, newSource, onAdd, resetAddForm])

  const handleStartEdit = useCallback((contact: EditableContact) => {
    setEditingId(contact.id)
    setEditName(contact.name)
    setEditPhone(contact.phone)
    setAdding(false)
  }, [])

  const handleSaveEdit = useCallback(async (id: string) => {
    const name = editName.trim()
    if (!name) return
    await onEdit(id, name, editPhone.trim())
    resetEditForm()
  }, [editName, editPhone, onEdit, resetEditForm])

  return (
    <View style={styles.root}>
      {contacts.map(contact => (
        <View key={contact.id} style={styles.itemRow}>
          {editingId === contact.id ? (
            <View style={styles.form}>
              <InputField
                value={editName}
                onChangeText={setEditName}
                placeholder={namePlaceholder}
                autoFocus
                testID={`${tid}-edit-name-${contact.id}`}
              />
              <InputField
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder={phonePlaceholder}
                keyboardType="phone-pad"
                testID={`${tid}-edit-phone-${contact.id}`}
              />
              <View style={styles.actionRow}>
                <Button variant="primary" size="sm" style={styles.action} label={validateLabel} onPress={() => handleSaveEdit(contact.id)} testID={`${tid}-validate-edit-${contact.id}`} />
                <Button variant="secondary" size="sm" style={styles.action} label={cancelLabel} onPress={resetEditForm} testID={`${tid}-cancel-edit-${contact.id}`} />
              </View>
            </View>
          ) : (
            <>
              <MaterialCommunityIcons name="account-circle-outline" size={20} color={accentColor} />
              <Pressable
                style={styles.textArea}
                onPress={() => handleStartEdit(contact)}
                testID={`${tid}-item-${contact.id}`}
              >
                <Text style={styles.name}>{contact.name}</Text>
                {contact.phone !== '' ? <Text style={styles.phone}>{contact.phone}</Text> : null}
              </Pressable>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />}
                onPress={() => onDelete(contact)}
                accessibilityLabel={`${deleteLabel} : ${contact.name}`}
                testID={`${tid}-delete-${contact.id}`}
              />
            </>
          )}
        </View>
      ))}

      {adding ? (
        <View style={styles.form}>
          <InputField value={newName} onChangeText={setNewName} placeholder={namePlaceholder} autoFocus testID={`${tid}-new-name`} />
          <InputField value={newPhone} onChangeText={setNewPhone} placeholder={phonePlaceholder} keyboardType="phone-pad" testID={`${tid}-new-phone`} />
          <View style={styles.actionRow}>
            <Button variant="primary" size="sm" style={styles.action} label={validateLabel} onPress={handleSaveNew} testID={`${tid}-validate-new`} />
            <Button variant="secondary" size="sm" style={styles.action} label={cancelLabel} onPress={resetAddForm} testID={`${tid}-cancel-new`} />
          </View>
        </View>
      ) : (
        <View style={styles.triggers}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<MaterialCommunityIcons name="plus" size={18} color={accentColor} />}
            label={addLabel}
            onPress={handleStartAdd}
            testID={`${tid}-add`}
          />
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<MaterialCommunityIcons name="contacts-outline" size={18} color={accentColor} />}
            label={importLabel}
            onPress={handleImport}
            testID={`${tid}-import`}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:      { gap: spacing.sm },
  itemRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  textArea:  { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.sm },
  name:      { fontSize: 15, color: colors.text, lineHeight: 22 },
  phone:     { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  form:      { flex: 1, gap: spacing.xs, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  action:    { flex: 1 },
  triggers:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
})
