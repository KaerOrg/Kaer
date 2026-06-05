import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { Banner } from '../../ui/Banner'
import { useAuthStore } from '../../../store/authStore'
import { getMfaStatus } from '../../../services/authService'

/**
 * Bandeau de rappel (nudge) invitant un praticien sans MFA à l'activer.
 * Affiché tant que : MFA non activé ET bandeau non fermé. La fermeture est
 * persistée (`practitioners.mfa_reminder_dismissed`) → ne réapparaît plus.
 * Le bouton d'action redirige vers le profil (écran d'activation).
 */
export function MfaReminderBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { practitioner, dismissMfaReminder } = useAuthStore()
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)

  const dismissed = practitioner?.mfa_reminder_dismissed ?? true

  useEffect(() => {
    if (dismissed) return
    let active = true
    void getMfaStatus().then(status => {
      if (active) setMfaEnabled(status.enabled)
    })
    return () => {
      active = false
    }
  }, [dismissed])

  const handleActivate = useCallback(() => navigate('/profil'), [navigate])
  const handleDismiss = useCallback(() => {
    void dismissMfaReminder()
  }, [dismissMfaReminder])

  // Masqué si : pas de praticien, déjà fermé, statut en cours de chargement, ou MFA actif.
  if (!practitioner || dismissed || mfaEnabled !== false) return null

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
