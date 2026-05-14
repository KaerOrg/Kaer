import { BrainCircuit } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { ProfileDropdown } from './ProfileDropdown'
import { MainNav } from '../MainNav/MainNav'
import { getInitials } from './Layout.utils'
import './Layout.css'
import type { LayoutProps } from './Layout.types'

export function Layout({ children }: LayoutProps) {
  const { practitioner, logout } = useAuthStore()

  const initials = getInitials(practitioner?.name || practitioner?.email || '?')

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__header-inner">
          <div className="layout__left">
            <div className="layout__logo">
              <span className="layout__logo-icon"><BrainCircuit size={22} /></span>
              <span className="layout__logo-text">PsyTool</span>
              <span className="layout__logo-badge">Praticien</span>
            </div>
            <MainNav />
          </div>
          <ProfileDropdown
            initials={initials}
            name={practitioner?.name ?? ''}
            email={practitioner?.email ?? ''}
            professionalTitle={practitioner?.professional_title ?? undefined}
            onLogout={logout}
          />
        </div>
      </header>

      <main className="layout__main">{children}</main>
    </div>
  )
}
