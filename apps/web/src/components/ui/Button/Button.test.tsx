import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('affiche le label', () => {
    render(<Button>Envoyer</Button>)
    expect(screen.getByText('Envoyer')).toBeInTheDocument()
  })

  it('déclenche onClick au clic', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clic</Button>)
    await userEvent.click(screen.getByText('Clic'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('est désactivé quand disabled=true', () => {
    render(<Button disabled>Clic</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('est désactivé et affiche le spinner quand loading=true', () => {
    render(<Button loading>Clic</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.btn__spinner')).toBeTruthy()
  })

  it('applique la variante CSS', () => {
    render(<Button variant="danger">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--danger')
  })

  it('applique la taille CSS', () => {
    render(<Button size="lg">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--lg')
  })

  it('ne déclenche pas onClick quand disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Clic</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('rend une icône à gauche du label quand icon + children', () => {
    render(<Button icon={<svg data-testid="ic" />}>Ajouter</Button>)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveClass('btn--icon-only')
    expect(screen.getByTestId('ic')).toBeInTheDocument()
    expect(screen.getByText('Ajouter')).toBeInTheDocument()
  })

  it('passe en icône-seule (btn--icon-only) quand icon sans children', () => {
    render(<Button icon={<svg data-testid="ic" />} aria-label="Notifier" />)
    const btn = screen.getByRole('button', { name: 'Notifier' })
    expect(btn).toHaveClass('btn--icon-only')
    expect(screen.getByTestId('ic')).toBeInTheDocument()
  })

  it('masque l\'icône au profit du spinner quand loading', () => {
    render(<Button icon={<svg data-testid="ic" />} loading aria-label="X" />)
    const btn = screen.getByRole('button')
    expect(btn.querySelector('.btn__spinner')).toBeTruthy()
    expect(screen.queryByTestId('ic')).not.toBeInTheDocument()
  })

  it('expose l\'état bascule via aria-pressed (variante outline)', () => {
    render(<Button variant="outline" aria-pressed>X</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('applique la catégorie sémantique (btn--cat-*)', () => {
    render(<Button variant="ghost" category="danger" icon={<svg />} aria-label="Supprimer" />)
    expect(screen.getByRole('button')).toHaveClass('btn--cat-danger')
  })

  it('est neutre par défaut (btn--cat-neutral)', () => {
    render(<Button>X</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--cat-neutral')
  })
})
