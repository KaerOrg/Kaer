import { useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/Button'
import { InputField } from '../components/InputField'
import './LoginPage.css'

export function LoginPage() {
  const { login, register, loading, error, clearError } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [registered, setRegistered] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, name, title)
      // Si pas d'erreur après register, l'email de confirmation a été envoyé
      if (!useAuthStore.getState().error) {
        setRegistered(true)
      }
    }
  }

  const switchMode = () => {
    clearError()
    setMode(m => m === 'login' ? 'register' : 'login')
  }

  if (registered) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__logo"><BrainCircuit size={36} /></div>
            <h1 className="login-card__title">PsyTool</h1>
          </div>
          <div className="login-card__confirm-email">
            <div className="login-card__confirm-icon">📧</div>
            <h2>Vérifiez votre email</h2>
            <p>Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez sur ce lien pour activer votre compte, puis revenez vous connecter.</p>
            <button type="button" className="login-card__link" onClick={() => { setRegistered(false); setMode('login') }}>
              Retour à la connexion
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
          <h1 className="login-card__title">PsyTool</h1>
          <p className="login-card__subtitle">
            {mode === 'login' ? 'Connexion — Espace praticien' : 'Créer votre compte praticien'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {mode === 'register' && (
            <>
              <InputField
                label="Votre nom complet"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Marie Dupont"
                required
              />
              <InputField
                label="Titre professionnel"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Infirmier en pratique avancée"
              />
            </>
          )}

          <InputField
            label="Adresse email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            autoComplete="email"
            required
          />

          <InputField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
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
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </Button>
        </form>

        <div className="login-card__footer">
          {mode === 'login' ? (
            <p>Pas encore de compte ?{' '}
              <button type="button" className="login-card__link" onClick={switchMode}>
                Créer un compte
              </button>
            </p>
          ) : (
            <p>Déjà un compte ?{' '}
              <button type="button" className="login-card__link" onClick={switchMode}>
                Se connecter
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
