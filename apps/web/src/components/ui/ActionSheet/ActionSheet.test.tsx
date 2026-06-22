import { render, screen, fireEvent } from '@testing-library/react'
import { ActionSheet } from './ActionSheet'

function makeProps(over: Partial<React.ComponentProps<typeof ActionSheet>> = {}) {
  return {
    open: true,
    title: 'Actions',
    cancelLabel: 'Annuler',
    onClose: () => {},
    options: [
      { label: 'Modifier', onClick: () => {} },
      { label: 'Supprimer', onClick: () => {}, destructive: true },
    ],
    ...over,
  }
}

describe('ActionSheet', () => {
  it('ne rend rien quand open=false', () => {
    const { container } = render(<ActionSheet {...makeProps({ open: false })} />)
    expect(container.querySelector('.action-sheet')).toBeNull()
  })

  it('rend le titre, les options et le bouton annuler', () => {
    render(<ActionSheet {...makeProps()} />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Modifier')).toBeInTheDocument()
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('ferme puis exécute l’action au clic sur une option', () => {
    const onClose = vi.fn()
    const onClick = vi.fn()
    render(<ActionSheet {...makeProps({ onClose, options: [{ label: 'Modifier', onClick }] })} />)
    fireEvent.click(screen.getByText('Modifier'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applique le style destructif', () => {
    render(<ActionSheet {...makeProps()} />)
    expect(screen.getByText('Supprimer').className).toContain('action-sheet__option--destructive')
  })

  it('appelle onClose au clic sur annuler', () => {
    const onClose = vi.fn()
    render(<ActionSheet {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
