import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Trash2, ShieldAlert } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { InputField } from '../../ui/InputField'
import { useToast } from '../../../contexts/ToastContext'
import { exportPatientData, erasePatientData } from '../../../services/patientDataRightsService'

interface PatientDataRightsProps {
  patientId: string
  /** Nom affiché du patient — sert de saisie de confirmation pour l'effacement. */
  displayName: string
  /** Appelé après un effacement réussi : la fiche n'existe plus → quitter la page. */
  onErased: () => void
}

/**
 * Bloc « Données & RGPD » de la fiche patient : exercice des droits patient
 * (accès art. 15 → export JSON brut, oubli art. 17 → effacement complet).
 * Toute opération réseau passe par `patientDataRightsService` et est tracée en base.
 * L'effacement exige une confirmation explicite (re-saisie du nom).
 */
export function PatientDataRights({ patientId, displayName, onErased }: PatientDataRightsProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Contrôlé : la saisie pilote l'activation du bouton de confirmation.
  const [confirmText, setConfirmText] = useState('')
  const [erasing, setErasing] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    const result = await exportPatientData(patientId)
    setExporting(false)
    if (!result.ok) {
      toast.error(t('patient_rights.export_error'))
      return
    }
    // Téléchargement impératif du miroir JSON brut (calcul ponctuel, hors render).
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kaer-export-${patientId}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t('patient_rights.export_success'))
  }, [patientId, t, toast])

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false)
    setConfirmText('')
  }, [])

  const handleErase = useCallback(async () => {
    setErasing(true)
    const result = await erasePatientData(patientId)
    setErasing(false)
    if (!result.ok) {
      toast.error(t('patient_rights.erase_error'))
      return
    }
    toast.success(t('patient_rights.erase_success'))
    closeConfirm()
    onErased()
  }, [patientId, t, toast, closeConfirm, onErased])

  const confirmMatches = confirmText.trim() === displayName.trim()

  const cardActions = (
    <>
      <Button variant="secondary" loading={exporting} onClick={() => void handleExport()}>
        <Download size={16} /> {t('patient_rights.export_button')}
      </Button>
      <Button variant="danger" onClick={() => setConfirmOpen(true)}>
        <Trash2 size={16} /> {t('patient_rights.erase_button')}
      </Button>
    </>
  )

  return (
    <>
      <Card
        header={{
          icon: <ShieldAlert size={18} />,
          title: t('patient_rights.title'),
          subtitle: t('patient_rights.subtitle'),
        }}
        actions={cardActions}
      >
        <p>{t('patient_rights.description')}</p>
      </Card>

      {confirmOpen ? (
        <Modal
          title={t('patient_rights.erase_confirm_title')}
          icon={<ShieldAlert size={20} />}
          onClose={closeConfirm}
          maxWidth={460}
          footer={
            <>
              <Button variant="ghost" onClick={closeConfirm}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                loading={erasing}
                disabled={!confirmMatches}
                onClick={() => void handleErase()}
              >
                {t('patient_rights.erase_confirm_button')}
              </Button>
            </>
          }
        >
          <p>{t('patient_rights.erase_confirm_warning')}</p>
          <InputField
            label={t('patient_rights.erase_confirm_label', { name: displayName })}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={displayName}
          />
        </Modal>
      ) : null}
    </>
  )
}
