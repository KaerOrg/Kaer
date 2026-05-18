import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BrainCircuit, CheckCircle, TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import {
  signUpPatientFromInvitation,
  validateInvitationToken,
} from '../../services/invitationService'
import '../LoginPage/LoginPage.css'
import './PatientRegisterPage.css'

type Step = 'checking' | 'invalid' | 'form' | 'success'

export function PatientRegisterPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<Step>('checking')
  const [prefillEmail, setPrefillEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const checkToken = useCallback(async () => {
    const result = await validateInvitationToken(token)
    if (!result.valid) {
      setStep('invalid')
      return
    }
    setPrefillEmail(result.email)
    setStep('form')
  }, [token])

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    checkToken()
  }, [token, checkToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setError('')

    const result = await signUpPatientFromInvitation(prefillEmail, password, token)
    if (!result.ok) {
      setError(result.message ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    setStep('success')
    setLoading(false)
  }

  if (step === 'checking') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">PsyTool</h1>
            <p className="login-card__subtitle">Vérification de l'invitation…</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'invalid') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">PsyTool</h1>
          </div>
          <div className="patient-register__invalid">
            <div className="patient-register__invalid-icon"><TriangleAlert size={40} /></div>
            <h2>Lien invalide ou expiré</h2>
            <p>Ce lien d'invitation n'est plus valide. Contactez votre praticien pour recevoir un nouveau lien.</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">PsyTool</h1>
          </div>
          <div className="patient-register__success">
            <div className="patient-register__success-icon"><CheckCircle size={48} /></div>
            <h2>Compte créé !</h2>
            <p>Votre compte a bien été créé. Téléchargez l'application mobile PsyTool pour accéder à vos outils thérapeutiques.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo">🧠</div>
          <h1 className="login-card__title">PsyTool</h1>
          <p className="login-card__subtitle">Créer votre compte patient</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          <InputField
            label="Adresse email"
            type="email"
            value={prefillEmail}
            onChange={() => {}}
            disabled
          />
          <InputField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <InputField
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {error && (
            <div className="login-card__error" role="alert">{error}</div>
          )}

          <Button type="submit" size="lg" loading={loading} className="login-card__submit">
            Créer mon compte
          </Button>
        </form>
      </div>
    </div>
  )
}
