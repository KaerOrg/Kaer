import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { Tooltip } from '@ui/Tooltip'
import type { useMedicationListEditor } from '../hooks/useMedicationListEditor'
import { MedicationAddForm } from './MedicationAddForm'

type MedListEditor = ReturnType<typeof useMedicationListEditor>

interface Props {
  medList: MedListEditor
  /** Ferme la modale d'actions. L'enregistrement est implicite (à chaque ajout/retrait). */
  onClose: () => void
}

/**
 * Onglet Configuration du module Observance : liste de médicaments co-éditée avec le
 * patient. L'enregistrement est implicite (chaque ajout/retrait persiste) ; « Terminé »
 * ferme simplement la modale.
 */
export function MedicationListConfigPanel({ medList, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('modules.medication_adherence.config_title')}</p>
      <p className="med-config-hint">{t('modules.medication_adherence.config_hint')}</p>

      {medList.medications.length === 0 ? (
        <p className="med-empty">{t('modules.medication_adherence.meds_empty')}</p>
      ) : (
        <div className="med-list">
          {medList.medications.map(med => (
            <div key={med.id} className="med-row">
              <div className="med-row__main">
                <div className="med-row__name">{med.name}</div>
                {med.posology ? <div className="med-row__poso">{med.posology}</div> : null}
              </div>
              <Chip
                label={t(`modules.medication_adherence.${med.kind === 'prn' ? 'kind_prn' : 'kind_maintenance'}`)}
                tone="neutral"
                size="sm"
              />
              <Tooltip label={t('common.delete')}>
                <button
                  type="button"
                  className="med-row__remove"
                  aria-label={t('common.delete')}
                  onClick={() => medList.removeMedication(med.id)}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      <MedicationAddForm onAdd={medList.addMedication} />

      <div className="psycho-card-picker__actions med-actions">
        <Button size="sm" loading={medList.saving} onClick={onClose}>
          {t('common.done')}
        </Button>
      </div>
    </div>
  )
}
