import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { StatusBadge } from '../../ui/StatusBadge'
import { useToast } from '../../../contexts/ToastContext'
import { useAuthStore } from '../../../store/authStore'
import { unenrollMfa } from '../../../services/authService'
import { MfaEnrollModal } from './MfaEnrollModal'

/**
 * Carte de réglage MFA dans le profil praticien : affiche l'état (activé/désactivé),
 * ouvre l'enrôlement (QR) ou désactive après confirmation. Opt-in — chaque praticien
 * gère son propre second facteur. Le statut vient du store (`mfaStatus`) et est
 * rafraîchi après chaque action → le bandeau de rappel réagit immédiatement.
 */
export function MfaSettingsCard() {
  const { t } = useTranslation()
  const toast = useToast()
  const { mfaStatus: status, refreshMfaStatus } = useAuthStore()
  const [enrolling, setEnrolling] = useState(false)
  const [confirmingDisable, setConfirmingDisable] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void refreshMfaStatus()
  }, [refreshMfaStatus])

  const handleEnrolled = useCallback(() => {
    setEnrolling(false)
    toast.success(t('auth.mfa.enrolled_success'))
    void refreshMfaStatus()
  }, [toast, t, refreshMfaStatus])

  const handleDisable = useCallback(async () => {
    if (!status?.factorId) return
    setBusy(true)
    const result = await unenrollMfa(status.factorId)
    setBusy(false)
    setConfirmingDisable(false)
    if (result.ok) {
      toast.success(t('auth.mfa.disabled_success'))
      void refreshMfaStatus()
    } else {
      toast.error(t('auth.mfa.error_generic'))
    }
  }, [status, toast, t, refreshMfaStatus])

  return (
    <Card
      header={{
        icon: <ShieldCheck size={18} />,
        title: t('auth.mfa.section_title'),
        subtitle: t('auth.mfa.section_desc'),
        right: status ? (
          <StatusBadge
            variant={status.enabled ? 'success' : 'neutral'}
            label={status.enabled ? t('auth.mfa.status_enabled') : t('auth.mfa.status_disabled')}
          />
        ) : undefined,
      }}
      actions={
        status?.enabled ? (
          <Button variant="danger" onClick={() => setConfirmingDisable(true)}>
            {t('auth.mfa.disable_button')}
          </Button>
        ) : (
          <Button onClick={() => setEnrolling(true)} disabled={!status}>
            {t('auth.mfa.enable_button')}
          </Button>
        )
      }
    >
      {enrolling ? <MfaEnrollModal onClose={() => setEnrolling(false)} onEnrolled={handleEnrolled} /> : null}

      {confirmingDisable ? (
        <Modal
          title={t('auth.mfa.disable_confirm_title')}
          onClose={() => setConfirmingDisable(false)}
          maxWidth={420}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmingDisable(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" loading={busy} onClick={() => void handleDisable()}>
                {t('auth.mfa.disable_confirm_button')}
              </Button>
            </>
          }
        >
          <p>{t('auth.mfa.disable_confirm_text')}</p>
        </Modal>
      ) : null}
    </Card>
  )
}
