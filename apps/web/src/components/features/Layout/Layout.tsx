import { HeartPlus } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { ProfileDropdown } from './ProfileDropdown'
import { MainNav } from '../MainNav/MainNav'
import { ActivityFeedPanel } from '../ActivityFeedPanel/ActivityFeedPanel'
import { MfaReminderBanner } from '../MfaReminderBanner'
import { getInitials } from './Layout.utils'
import './Layout.css'
import type { LayoutProps } from './Layout.types'

export function Layout({ children, sidebar, wide = false }: LayoutProps) {
  const { practitioner, logout } = useAuthStore()

  const initials = getInitials(practitioner?.name || practitioner?.email || '?')

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__header-inner">
          <div className="layout__left">
            <div className="layout__logo">
              <span className="layout__logo-icon"><HeartPlus size={30} /></span>
              <span className="layout__logo-text">Kær</span>
            </div>
          </div>
          <div className="layout__center">
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

      <div className={`layout__body${sidebar ? ' layout__body--with-sidebar' : ''}`}>
        {sidebar && <aside className="layout__sidebar">{sidebar}</aside>}
        <main className={`layout__main${wide ? ' layout__main--wide' : ''}`}>
          <MfaReminderBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
