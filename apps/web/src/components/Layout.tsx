import { useAuthStore } from '../store/authStore'
import { Button } from './Button'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { practitioner, logout } = useAuthStore()

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__header-inner">
          <div className="layout__logo">
            <span className="layout__logo-icon">🧠</span>
            <span className="layout__logo-text">PsyTool</span>
            <span className="layout__logo-badge">Praticien</span>
          </div>
          <div className="layout__header-right">
            <span className="layout__user-name">{practitioner?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      <main className="layout__main">
        {children}
      </main>
    </div>
  )
}
