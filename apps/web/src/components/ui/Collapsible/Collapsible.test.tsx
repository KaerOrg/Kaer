import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Collapsible } from './Collapsible'

describe('Collapsible', () => {
  it('est replié par défaut et ne monte pas son contenu', () => {
    render(<Collapsible title="Où se passe quoi"><p>contenu lourd</p></Collapsible>)
    expect(screen.queryByText('contenu lourd')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('révèle son contenu au clic, et le replie au clic suivant', async () => {
    render(<Collapsible title="Où se passe quoi"><p>contenu lourd</p></Collapsible>)
    const head = screen.getByRole('button')
    await userEvent.click(head)
    expect(screen.getByText('contenu lourd')).toBeInTheDocument()
    expect(head).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(head)
    expect(screen.queryByText('contenu lourd')).not.toBeInTheDocument()
  })

  it('peut être ouvert d\'emblée', () => {
    render(<Collapsible title="t" defaultOpen><p>visible</p></Collapsible>)
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('relie l\'en-tête au panneau par aria-controls', () => {
    const { container } = render(<Collapsible title="t" defaultOpen><p>x</p></Collapsible>)
    const controlled = screen.getByRole('button').getAttribute('aria-controls')
    expect(controlled).toBeTruthy()
    expect(container.querySelector(`#${CSS.escape(controlled ?? '')}`)).toBeInTheDocument()
  })

  it('affiche le complément d\'en-tête quand il est fourni', () => {
    render(<Collapsible title="t" meta="41 au total"><p>x</p></Collapsible>)
    expect(screen.getByText('41 au total')).toBeInTheDocument()
  })
})
