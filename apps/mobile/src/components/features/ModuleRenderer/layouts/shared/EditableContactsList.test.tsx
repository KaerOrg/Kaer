jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { EditableContactsList, type EditableContact } from './EditableContactsList'

const LABELS = {
  addLabel: 'Ajouter', importLabel: 'Importer', namePlaceholder: 'Nom',
  phonePlaceholder: 'Numéro', validateLabel: 'Valider', cancelLabel: 'Annuler', deleteLabel: 'Supprimer',
}

function setup(over: Partial<React.ComponentProps<typeof EditableContactsList>> = {}) {
  const onAdd = jest.fn().mockResolvedValue(undefined)
  const onEdit = jest.fn().mockResolvedValue(undefined)
  const onDelete = jest.fn()
  const onImport = jest.fn().mockResolvedValue(null)
  const contacts: EditableContact[] = over.contacts as EditableContact[] ?? []
  render(
    <EditableContactsList
      contacts={contacts}
      accentColor="#9333EA"
      {...LABELS}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onImport={onImport}
      testIdPrefix="step-4"
      {...over}
    />,
  )
  return { onAdd, onEdit, onDelete, onImport }
}

beforeEach(() => jest.clearAllMocks())

describe('EditableContactsList', () => {
  it('ajoute un contact saisi à la main (nom + numéro, source null)', async () => {
    const { onAdd } = setup()
    fireEvent.press(screen.getByTestId('step-4-add'))
    fireEvent.changeText(screen.getByTestId('step-4-new-name'), 'Marie')
    fireEvent.changeText(screen.getByTestId('step-4-new-phone'), '0102030405')
    fireEvent.press(screen.getByTestId('step-4-validate-new'))
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('Marie', '0102030405', null))
  })

  it('n\'ajoute pas si le nom est vide', () => {
    const { onAdd } = setup()
    fireEvent.press(screen.getByTestId('step-4-add'))
    fireEvent.press(screen.getByTestId('step-4-validate-new'))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('importe un contact du répertoire et pré-remplit le formulaire (source phonebook)', async () => {
    const { onImport, onAdd } = setup()
    onImport.mockResolvedValueOnce({ name: 'Dr Martin', phone: '0600000000' })
    fireEvent.press(screen.getByTestId('step-4-import'))
    await waitFor(() => expect(screen.getByTestId('step-4-new-name').props.value).toBe('Dr Martin'))
    expect(screen.getByTestId('step-4-new-phone').props.value).toBe('0600000000')
    fireEvent.press(screen.getByTestId('step-4-validate-new'))
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('Dr Martin', '0600000000', 'phonebook'))
  })

  it('ne pré-remplit rien si l\'import est annulé', async () => {
    const { onImport } = setup()
    onImport.mockResolvedValueOnce(null)
    fireEvent.press(screen.getByTestId('step-4-import'))
    await waitFor(() => expect(onImport).toHaveBeenCalled())
    expect(screen.queryByTestId('step-4-new-name')).toBeNull()
  })

  it('édite un contact existant', async () => {
    const { onEdit } = setup({ contacts: [{ id: 'c1', name: 'Marie', phone: '0102030405' }] })
    fireEvent.press(screen.getByTestId('step-4-item-c1'))
    fireEvent.changeText(screen.getByTestId('step-4-edit-name-c1'), 'Marie D.')
    fireEvent.press(screen.getByTestId('step-4-validate-edit-c1'))
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('c1', 'Marie D.', '0102030405'))
  })

  it('supprime un contact', () => {
    const { onDelete } = setup({ contacts: [{ id: 'c1', name: 'Marie', phone: '0102030405' }] })
    fireEvent.press(screen.getByTestId('step-4-delete-c1'))
    expect(onDelete).toHaveBeenCalledWith({ id: 'c1', name: 'Marie', phone: '0102030405' })
  })
})
