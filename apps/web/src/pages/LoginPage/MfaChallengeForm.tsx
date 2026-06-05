import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { SupportRequestModal } from '../../components/features/SupportRequestModal'

/**
 * Étape de saisie du code TOTP affichée après un login mot de passe réussi
 * lorsqu'un facteur MFA est actif (session aal1 → aal2). Rendue par LoginPage
 * dans le wrapper `.login-card`.
 */
export function MfaChallengeForm() {
  const { t } = useTranslation()
  const { verifyMfa, cancelMfa, loading } = useAuthStore()
  // Contrôlé : la valeur conditionne l'UI (sanitisation live + désactivation du bouton).
  const [code, setCode] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvalid(false)
    const ok = await verifyMfa(code)
    if (!ok) {
      setInvalid(true)
      setCode('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-card__form">
      <InputField
        label={t('auth.mfa.code_label')}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder={t('auth.mfa.code_placeholder')}
        autoFocus
        required
        error={invalid ? t('auth.mfa.invalid_code') : undefined}
      />

      <Button
        type="submit"
        size="lg"
        loading={loading}
        disabled={code.length !== 6}
        className="login-card__submit"
      >
        {t('auth.mfa.verify_button')}
      </Button>

      <button type="button" className="login-card__link" onClick={() => void cancelMfa()}>
        {t('auth.mfa.cancel')}
      </button>

      <button type="button" className="login-card__link" onClick={() => setSupportOpen(true)}>
        {t('auth.mfa.lost_access_link')}
      </button>

      {supportOpen ? (
        <SupportRequestModal presetReason="mfa_lost" onClose={() => setSupportOpen(false)} />
      ) : null}
    </form>
  )
}
