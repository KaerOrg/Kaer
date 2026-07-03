import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BrainCircuit } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { referenceQueries } from '../../hooks/queries'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Dropdown, type DropdownOption } from '../../components/ui/Dropdown'
import { MfaChallengeForm } from './MfaChallengeForm'
import { SupportRequestModal } from '../../components/features/SupportRequestModal'
import './LoginPage.css'

export function LoginPage() {
  const { login, register, loading, error, clearError, mfaRequired } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [registered, setRegistered] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const { data: professionalTitles = [] } = useQuery(referenceQueries.professionalTitles())

  const titleOptions = useMemo<DropdownOption[]>(
    () =>
      professionalTitles.map(pt => ({
        value: pt.code,
        label: i18n.language.startsWith('fr') ? pt.label_fr : pt.label_en,
      })),
    [professionalTitles, i18n.language]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, name, title)
      if (!useAuthStore.getState().error) {
        setRegistered(true)
      }
    }
  }

  const switchMode = () => {
    clearError()
    setMode(m => m === 'login' ? 'register' : 'login')
  }

  if (mfaRequired) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">Kær</h1>
            <p className="login-card__subtitle">{t('auth.mfa.challenge_subtitle')}</p>
          </div>
          <MfaChallengeForm />
        </div>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">Kær</h1>
          </div>
          <div className="login-card__confirm-email">
            <div className="login-card__confirm-icon">📧</div>
            <h2>{t('auth.confirm_email_title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('auth.confirm_email_text', { email }) }} />
            <button type="button" className="login-card__link" onClick={() => { setRegistered(false); setMode('login') }}>
              {t('auth.back_to_login')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo"><BrainCircuit size={36} /></div>
          <h1 className="login-card__title">Kær</h1>
          <p className="login-card__subtitle">
            {mode === 'login' ? t('auth.login_subtitle') : t('auth.register_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {mode === 'register' && (
            <>
              <InputField
                label={t('auth.full_name_label')}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('auth.full_name_placeholder')}
                required
              />
              <Dropdown
                clearable
                clearLabel={t('common.clear_selection')}
                label={t('auth.professional_title_label')}
                value={title}
                onChange={setTitle}
                options={titleOptions}
                placeholder={t('auth.professional_title_placeholder')}
              />
            </>
          )}

          <InputField
            label={t('auth.email_label')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('auth.email_placeholder')}
            autoComplete="email"
            required
          />

          <InputField
            label={t('auth.password_label')}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('auth.password_placeholder')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            required
          />

          {error && (
            <div className="login-card__error" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="login-card__submit">
            {mode === 'login' ? t('auth.login_button') : t('auth.register_button')}
          </Button>
        </form>

        <div className="login-card__footer">
          {mode === 'login' ? (
            <p>{t('auth.no_account')}{' '}
              <button type="button" className="login-card__link" onClick={switchMode}>
                {t('auth.create_account')}
              </button>
            </p>
          ) : (
            <p>{t('auth.already_account')}{' '}
              <button type="button" className="login-card__link" onClick={switchMode}>
                {t('auth.sign_in')}
              </button>
            </p>
          )}
          <p>
            <button type="button" className="login-card__link" onClick={() => setSupportOpen(true)}>
              {t('support.contact_link')}
            </button>
          </p>
        </div>
      </div>

      {supportOpen ? (
        <SupportRequestModal requireEmail onClose={() => setSupportOpen(false)} />
      ) : null}
    </div>
  )
}
