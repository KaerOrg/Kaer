import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Dropdown, type DropdownOption } from '../../ui/Dropdown'

export interface AddEntryFormProps {
  open: boolean
  /** Patients de l'app pas encore dans la file, proposés à l'ajout. */
  patients: readonly { id: string; name: string }[]
  onAdd: (patientId: string) => void
  onClose: () => void
  loading?: boolean
}

/**
 * Modale d'ajout d'un dossier à « Mes suivis » : une dropdown des patients existants.
 * Pas de saisie libre — la file ne contient que de vrais patients reliés à un compte app.
 */
export function AddEntryForm({ open, patients, onAdd, onClose, loading = false }: AddEntryFormProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState('')

  // Repart d'une sélection vierge à chaque ouverture.
  useEffect(() => {
    if (open) setSelected('')
  }, [open])

  const handleConfirm = useCallback(() => {
    if (selected) onAdd(selected)
  }, [selected, onAdd])

  const options = useMemo<DropdownOption[]>(
    () => patients.map(p => ({ value: p.id, label: p.name })),
    [patients]
  )

  if (!open) return null

  const noneAvailable = patients.length === 0

  return (
    <Modal
      title={t('file_active.add.modal_title')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!selected || noneAvailable}>
            {t('file_active.add.confirm')}
          </Button>
        </>
      }
    >
      <Dropdown
        label={t('file_active.add.patient_label')}
        value={selected}
        onChange={setSelected}
        options={options}
        disabled={noneAvailable}
        placeholder={
          noneAvailable ? t('file_active.add.none_available') : t('file_active.add.patient_placeholder')
        }
        emptyText={t('file_active.add.none_available')}
      />
    </Modal>
  )
}
