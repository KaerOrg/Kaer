import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { SelectField } from '../../ui/SelectField/SelectField'
import { useToast } from '../../../contexts/ToastContext'
import { submitSupportRequest, SUPPORT_REASONS, type SupportReason } from '../../../services/supportService'
import './SupportRequestModal.css'

interface SupportRequestModalProps {
  onClose: () => void
  /** Motif pré-sélectionné (ex. `mfa_lost` depuis le challenge MFA). */
  presetReason?: SupportReason
}

/**
 * Formulaire BORNÉ de demande de support : le praticien choisit un motif dans une
 * liste fermée (aucune saisie libre). Soumet via `submitSupportRequest` (table +
 * email Resend côté Edge Function). Utilisé depuis le challenge MFA (perte de code,
 * demi-connecté en aal1) et depuis le profil.
 */
export function SupportRequestModal({ onClose, presetReason }: SupportRequestModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  // Contrôlé : la valeur sélectionnée pilote le champ et la soumission.
  const [reason, setReason] = useState<SupportReason>(presetReason ?? 'account_issue')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = SUPPORT_REASONS.find(r => r === e.target.value)
    if (found) setReason(found)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const { ok } = await submitSupportRequest(reason)
    setSubmitting(false)
    if (ok) {
      toast.success(t('support.success'))
      onClose()
    } else {
      toast.error(t('support.error'))
    }
  }

  return (
    <Modal
      title={t('support.title')}
      onClose={onClose}
      maxWidth={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            {t('support.submit')}
          </Button>
        </>
      }
    >
      <div className="support-request">
        <p className="support-request__intro">{t('support.intro')}</p>
        <SelectField label={t('support.reason_label')} value={reason} onChange={handleChange}>
          {SUPPORT_REASONS.map(r => (
            <option key={r} value={r}>
              {t(`support.reason.${r}`)}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  )
}
