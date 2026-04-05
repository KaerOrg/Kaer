import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, LogOut, UserPen } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from './Button'
import { InputField } from './InputField'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { practitioner, logout, updateProfile } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openModal = () => {
    setName(practitioner?.name ?? '')
    setTitle(practitioner?.professional_title ?? '')
    setSaveError('')
    setSaveSuccess(false)
    setMenuOpen(false)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const err = await updateProfile(name, title)
    setSaving(false)
    if (err) { setSaveError(err); return }
    setSaveSuccess(true)
    setTimeout(() => { setSaveSuccess(false); setModalOpen(false) }, 1500)
  }

  const initials = (practitioner?.name || practitioner?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__header-inner">
          <div className="layout__logo">
            <span className="layout__logo-icon"><BrainCircuit size={22} /></span>
            <span className="layout__logo-text">PsyTool</span>
            <span className="layout__logo-badge">Praticien</span>
          </div>

          <div className="layout__header-right" ref={menuRef}>
            <button className="layout__avatar" onClick={() => setMenuOpen(o => !o)} aria-label="Menu profil">
              {initials}
            </button>

            {menuOpen && (
              <div className="layout__dropdown">
                <div className="layout__dropdown-info">
                  <div className="layout__dropdown-name">{practitioner?.name || '—'}</div>
                  <div className="layout__dropdown-email">{practitioner?.email}</div>
                  {practitioner?.professional_title && (
                    <div className="layout__dropdown-title">{practitioner.professional_title}</div>
                  )}
                </div>
                <div className="layout__dropdown-divider" />
                <button className="layout__dropdown-item" onClick={openModal}>
                  <UserPen size={15} />
                  Modifier le profil
                </button>
                <button className="layout__dropdown-item layout__dropdown-item--danger" onClick={() => logout()}>
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="layout__main">
        {children}
      </main>

      {modalOpen && (
        <div className="layout__modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="layout__modal" onClick={e => e.stopPropagation()}>
            <h2 className="layout__modal-title">Modifier le profil</h2>
            <form onSubmit={handleSave} className="layout__modal-form">
              <InputField
                label="Nom complet"
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
              {saveError && <div className="layout__modal-error">{saveError}</div>}
              {saveSuccess && <div className="layout__modal-success">✓ Profil mis à jour</div>}
              <div className="layout__modal-actions">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={saving}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
