import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

const base = {
  title: 'Supprimer ?',
  message: 'Action irréversible.',
  cancelLabel: 'Annuler',
  confirmLabel: 'Supprimer',
  onConfirm: () => {},
  onCancel: () => {},
}

describe('ConfirmDialog', () => {
  it('ne rend rien quand open=false', () => {
    const { container } = render(<ConfirmDialog {...base} open={false} />)
    expect(container.querySelector('.modal-overlay')).toBeNull()
  })

  it('rend titre, message et les deux boutons quand open', () => {
    render(<ConfirmDialog {...base} open />)
    expect(screen.getByText('Supprimer ?')).toBeInTheDocument()
    expect(screen.getByText('Action irréversible.')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
  })

  it('appelle onConfirm au clic sur le bouton de confirmation', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...base} open onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Supprimer'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('appelle onCancel au clic sur annuler', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...base} open onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('applique la variante danger au bouton de confirmation si destructive', () => {
    render(<ConfirmDialog {...base} open destructive />)
    expect(screen.getByText('Supprimer').className).toContain('btn--danger')
  })
})
