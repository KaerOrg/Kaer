import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { Banner } from '../../ui/Banner'
import { useAuthStore } from '../../../store/authStore'

/**
 * Bandeau de rappel (nudge) invitant un praticien sans MFA à l'activer.
 * Le statut MFA vient du store (`mfaStatus`) — partagé avec `MfaSettingsCard` —
 * donc le bandeau disparaît immédiatement dès l'activation. La fermeture est
 * persistée (`practitioners.mfa_reminder_dismissed`) → ne réapparaît plus.
 */
export function MfaReminderBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { practitioner, dismissMfaReminder, mfaStatus, refreshMfaStatus } = useAuthStore()

  const dismissed = practitioner?.mfa_reminder_dismissed ?? true

  useEffect(() => {
    if (!dismissed && mfaStatus === null) void refreshMfaStatus()
  }, [dismissed, mfaStatus, refreshMfaStatus])

  const handleActivate = useCallback(() => navigate('/profil'), [navigate])
  const handleDismiss = useCallback(() => {
    void dismissMfaReminder()
  }, [dismissMfaReminder])

  // Masqué si : pas de praticien, déjà fermé, statut en cours de chargement, ou MFA actif.
  if (!practitioner || dismissed || mfaStatus === null || mfaStatus.enabled) return null

  return (
    <Banner
      variant="warning"
      icon={<ShieldAlert size={18} />}
      action={{ label: t('auth.mfa.banner_action'), onClick: handleActivate }}
      onDismiss={handleDismiss}
      dismissLabel={t('auth.mfa.banner_dismiss')}
    >
      {t('auth.mfa.banner_text')}
    </Banner>
  )
}
