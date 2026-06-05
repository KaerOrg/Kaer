import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { InputField } from '../../ui/InputField'
import { enrollMfaTotp, verifyMfaCode, unenrollMfa } from '../../../services/authService'
import './MfaSettingsCard.css'

interface MfaEnrollModalProps {
  onClose: () => void
  onEnrolled: () => void
}

interface EnrollData {
  factorId: string
  qrCode: string
  secret: string
}

/**
 * Modale d'enrôlement TOTP : affiche le QR code + secret, puis vérifie le 1er code.
 * Si la modale est fermée sans confirmation, le facteur non vérifié est désenrôlé
 * pour ne pas laisser d'enrôlement orphelin côté Supabase.
 */
export function MfaEnrollModal({ onClose, onEnrolled }: MfaEnrollModalProps) {
  const { t } = useTranslation()
  const [enroll, setEnroll] = useState<EnrollData | null>(null)
  const [code, setCode] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [failed, setFailed] = useState(false)
  const factorIdRef = useRef<string | null>(null)
  const verifiedRef = useRef(false)

  useEffect(() => {
    let active = true
    void enrollMfaTotp().then(res => {
      if (!active) return
      if (res.ok) {
        factorIdRef.current = res.factorId
        setEnroll({ factorId: res.factorId, qrCode: res.qrCode, secret: res.secret })
      } else {
        setFailed(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const handleClose = useCallback(() => {
    // Facteur créé mais non confirmé → nettoyage pour éviter un enrôlement orphelin.
    if (factorIdRef.current && !verifiedRef.current) {
      void unenrollMfa(factorIdRef.current)
    }
    onClose()
  }, [onClose])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enroll) return
    setInvalid(false)
    setVerifying(true)
    const res = await verifyMfaCode(enroll.factorId, code)
    setVerifying(false)
    if (res.ok) {
      verifiedRef.current = true
      onEnrolled()
    } else {
      setInvalid(true)
      setCode('')
    }
  }

  return (
    <Modal title={t('auth.mfa.enroll_title')} onClose={handleClose} maxWidth={440}>
      {failed ? (
        <p className="mfa-enroll__error">{t('auth.mfa.error_generic')}</p>
      ) : !enroll ? (
        <p className="mfa-enroll__loading">{t('common.loading')}</p>
      ) : (
        <form onSubmit={handleVerify} className="mfa-enroll">
          <p className="mfa-enroll__intro">{t('auth.mfa.enroll_intro')}</p>

          <p className="mfa-enroll__step">{t('auth.mfa.enroll_step1')}</p>

          <p className="mfa-enroll__step">{t('auth.mfa.enroll_step2')}</p>
          <img src={enroll.qrCode} alt="" className="mfa-enroll__qr" />

          <p className="mfa-enroll__secret-label">{t('auth.mfa.enroll_secret_label')}</p>
          <code className="mfa-enroll__secret">{enroll.secret}</code>

          <p className="mfa-enroll__step">{t('auth.mfa.enroll_step3')}</p>
          <InputField
            label={t('auth.mfa.code_label')}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('auth.mfa.code_placeholder')}
            error={invalid ? t('auth.mfa.invalid_code') : undefined}
            required
          />

          <div className="mfa-enroll__actions">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={verifying} disabled={code.length !== 6}>
              {t('auth.mfa.confirm_button')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
