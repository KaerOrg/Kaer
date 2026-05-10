import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './MainNav.css'

export function MainNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const isPatientsActive = location.pathname === '/' || location.pathname.startsWith('/patient/')

  return (
    <nav className="main-nav">
      <Link
        to="/"
        className={`main-nav__link ${isPatientsActive ? 'main-nav__link--active' : ''}`}
      >
        {t('dashboard.title')}
      </Link>
      <Link
        to="/modules"
        className={`main-nav__link ${location.pathname === '/modules' ? 'main-nav__link--active' : ''}`}
      >
        {t('modules.nav_link')}
      </Link>
    </nav>
  )
}
