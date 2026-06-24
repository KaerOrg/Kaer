import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { InputField } from '../../ui/InputField'
import { Dropdown, type DropdownOption } from '../../ui/Dropdown'
import { useToast } from '../../../contexts/ToastContext'
import {
  submitSupportRequest,
  reasonRequiresDescription,
  SUPPORT_REASONS,
  SUPPORT_DESCRIPTION_MAX,
  type SupportReason,
} from '../../../services/supportService'
import './SupportRequestModal.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SupportRequestModalProps {
  onClose: () => void
  /** Motif pré-sélectionné (ex. `mfa_lost` depuis le challenge MFA). */
  presetReason?: SupportReason
  /** Déconnecté (écran de login) : demande un email de contact (pas d'identité JWT). */
  requireEmail?: boolean
}

/**
 * Formulaire BORNÉ de demande de support : le praticien choisit un motif dans une
 * liste fermée (aucune saisie libre). Soumet via `submitSupportRequest` (table +
 * email Resend côté Edge Function). Utilisé depuis le challenge MFA (perte de code,
 * demi-connecté en aal1) et depuis le profil.
 */
export function SupportRequestModal({ onClose, presetReason, requireEmail = false }: SupportRequestModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  // Contrôlés : motif, email et description pilotent l'UI (validation, désactivation).
  const [reason, setReason] = useState<SupportReason>(presetReason ?? 'password_forgotten')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const needsDescription = reasonRequiresDescription(reason)
  const emailValid = !requireEmail || EMAIL_RE.test(email.trim())
  const descriptionValid = !needsDescription || description.trim().length > 0
  const canSubmit = emailValid && descriptionValid

  const handleChange = (value: string) => {
    const found = SUPPORT_REASONS.find(r => r === value)
    if (found) setReason(found)
  }

  const reasonOptions = useMemo<DropdownOption[]>(
    () => SUPPORT_REASONS.map(r => ({ value: r, label: t(`support.reason.${r}`) })),
    [t]
  )

  const handleSubmit = async () => {
    setSubmitting(true)
    const { ok } = await submitSupportRequest(reason, {
      email: requireEmail ? email.trim() : undefined,
      description: needsDescription ? description.trim() : undefined,
    })
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
          <Button loading={submitting} disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {t('support.submit')}
          </Button>
        </>
      }
    >
      <div className="support-request">
        <p className="support-request__intro">{t('support.intro')}</p>
        {requireEmail ? (
          <InputField
            label={t('support.email_label')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('support.email_placeholder')}
            autoComplete="email"
            required
          />
        ) : null}
        <Dropdown
          searchable={false}
          label={t('support.reason_label')}
          value={reason}
          onChange={handleChange}
          options={reasonOptions}
        />
        {needsDescription ? (
          <InputField
            label={t('support.description_label')}
            multiline
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('support.description_placeholder')}
            maxLength={SUPPORT_DESCRIPTION_MAX}
            rows={4}
            required
          />
        ) : null}
      </div>
    </Modal>
  )
}
