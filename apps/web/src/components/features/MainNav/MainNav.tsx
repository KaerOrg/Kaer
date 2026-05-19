import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, LayoutGrid, CalendarDays } from 'lucide-react'
import './MainNav.css'

export function MainNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const isPatientsActive = location.pathname === '/' || location.pathname.startsWith('/patient/')
  const isModulesActive = location.pathname === '/modules' || location.pathname.startsWith('/modules/')
  const isAgendaActive = location.pathname === '/agenda'

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
        to="/modules"
        className={`main-nav__link ${isModulesActive ? 'main-nav__link--active' : ''}`}
      >
        <LayoutGrid size={15} />
        {t('modules.nav_link')}
      </Link>
      <Link
        to="/agenda"
        className={`main-nav__link ${isAgendaActive ? 'main-nav__link--active' : ''}`}
      >
        <CalendarDays size={15} />
        {t('agenda.nav_link')}
      </Link>
    </nav>
  )
}
