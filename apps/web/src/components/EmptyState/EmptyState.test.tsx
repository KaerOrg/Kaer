import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('affiche le titre', () => {
    render(<EmptyState title="Rien ici" />)
    expect(screen.getByText('Rien ici')).toBeInTheDocument()
  })

  it('affiche la description si fournie', () => {
    render(<EmptyState title="T" description="Description" />)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it("n'affiche pas la description si absente", () => {
    render(<EmptyState title="T" />)
    expect(document.querySelector('.empty-state__description')).toBeNull()
  })

  it('affiche l'icône si fournie', () => {
    render(<EmptyState title="T" icon="📭" />)
    expect(screen.getByText('📭')).toBeInTheDocument()
  })

  it('déclenche le callback action au clic', async () => {
    const onAction = vi.fn()
    render(<EmptyState title="T" action={{ label: 'Créer', onClick: onAction }} />)
    await userEvent.click(screen.getByText('Créer'))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it("n'affiche pas le bouton action si absent", () => {
    render(<EmptyState title="T" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
