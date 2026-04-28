import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'dashboard.title': 'Mes patients',
      'modules.nav_link': 'Modules',
    }[key] ?? key),
  }),
}))

import { useLocation } from 'react-router-dom'
import { MainNav } from './MainNav'

function renderNav(pathname: string) {
  vi.mocked(useLocation).mockReturnValue({ pathname } as ReturnType<typeof useLocation>)
  return render(<MainNav />)
}

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe('MainNav — rendu', () => {
  it('affiche le lien Mes patients', () => {
    renderNav('/')
    expect(screen.getByText('Mes patients')).toBeInTheDocument()
  })

  it('affiche le lien Modules', () => {
    renderNav('/')
    expect(screen.getByText('Modules')).toBeInTheDocument()
  })

  it('le lien Mes patients pointe vers /', () => {
    renderNav('/')
    expect(screen.getByText('Mes patients')).toHaveAttribute('href', '/')
  })

  it('le lien Modules pointe vers /modules', () => {
    renderNav('/')
    expect(screen.getByText('Modules')).toHaveAttribute('href', '/modules')
  })
})

// ── Lien actif ────────────────────────────────────────────────────────────────

describe('MainNav — état actif', () => {
  it('chemin "/" : Mes patients a la classe --active', () => {
    renderNav('/')
    expect(screen.getByText('Mes patients')).toHaveClass('main-nav__link--active')
  })

  it('chemin "/" : Modules n\'a pas la classe --active', () => {
    renderNav('/')
    expect(screen.getByText('Modules')).not.toHaveClass('main-nav__link--active')
  })

  it('chemin "/modules" : Modules a la classe --active', () => {
    renderNav('/modules')
    expect(screen.getByText('Modules')).toHaveClass('main-nav__link--active')
  })

  it('chemin "/modules" : Mes patients n\'a pas la classe --active', () => {
    renderNav('/modules')
    expect(screen.getByText('Mes patients')).not.toHaveClass('main-nav__link--active')
  })

  it('chemin inconnu : aucun lien n\'est actif', () => {
    renderNav('/patient/123')
    expect(screen.getByText('Mes patients')).not.toHaveClass('main-nav__link--active')
    expect(screen.getByText('Modules')).not.toHaveClass('main-nav__link--active')
  })
})
