import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, LayoutGrid, CalendarDays, ClipboardList, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import './MainNav.css'

export function MainNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const isAdmin = useAuthStore(s => s.practitioner?.is_admin ?? false)
  const isPatientsActive = location.pathname === '/' || location.pathname.startsWith('/patient/')
  const isModulesActive = location.pathname === '/modules' || location.pathname.startsWith('/modules/')
  const isAgendaActive = location.pathname === '/agenda'
  const isFileActiveActive = location.pathname === '/file-active'
  const isAdminActive = location.pathname.startsWith('/admin')

  return (
    <nav className="main-nav">
      <Link
        to="/"
        className={`main-nav__link ${isPatientsActive ? 'main-nav__link--active' : ''}`}
      >
        <Users size={15} />
        {t('dashboard.title')}
      </Link>
      <Link
        to="/file-active"
        className={`main-nav__link ${isFileActiveActive ? 'main-nav__link--active' : ''}`}
      >
        <ClipboardList size={15} />
        {t('file_active.nav_link')}
      </Link>
      <Link
        to="/agenda"
        className={`main-nav__link ${isAgendaActive ? 'main-nav__link--active' : ''}`}
      >
        <CalendarDays size={15} />
        {t('agenda.nav_link')}
      </Link>
      <Link
        to="/modules"
        className={`main-nav__link ${isModulesActive ? 'main-nav__link--active' : ''}`}
      >
        <LayoutGrid size={15} />
        {t('modules.nav_link')}
      </Link>
      {isAdmin ? (
        <Link
          to="/admin/users"
          className={`main-nav__link ${isAdminActive ? 'main-nav__link--active' : ''}`}
        >
          <ShieldCheck size={15} />
          {t('admin_users.nav_link')}
        </Link>
      ) : null}
    </nav>
  )
}
