import { BrainCircuit } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { ProfileDropdown } from './ProfileDropdown'
import { MainNav } from '../MainNav/MainNav'
import { ActivityFeedPanel } from '../ActivityFeedPanel/ActivityFeedPanel'
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
          <div className="layout__right">
            {practitioner ? <ActivityFeedPanel practitionerId={practitioner.id} /> : null}
            <ProfileDropdown
              initials={initials}
              avatarUrl={practitioner?.avatar_url ?? undefined}
              name={practitioner?.name ?? ''}
              onLogout={logout}
            />
          </div>
        </div>
      </header>

      <main className="layout__main">{children}</main>
    </div>
  )
}
