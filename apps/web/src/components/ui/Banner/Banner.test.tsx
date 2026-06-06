import { render, screen, fireEvent } from '@testing-library/react'
import { Banner } from './Banner'

describe('Banner', () => {
  it('affiche le contenu et applique la variante', () => {
    const { container } = render(<Banner variant="warning">Attention</Banner>)
    expect(screen.getByText('Attention')).toBeInTheDocument()
    expect(container.querySelector('.banner--warning')).not.toBeNull()
  })

  it("déclenche l'action au clic", () => {
    const onClick = vi.fn()
    render(<Banner action={{ label: 'Activer', onClick }}>Texte</Banner>)
    fireEvent.click(screen.getByText('Activer'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('affiche la fermeture et déclenche onDismiss', () => {
    const onDismiss = vi.fn()
    render(
      <Banner onDismiss={onDismiss} dismissLabel="Fermer">
        Texte
      </Banner>
    )
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('sans onDismiss, aucun bouton de fermeture', () => {
    const { container } = render(<Banner>Texte</Banner>)
    expect(container.querySelector('.banner__dismiss')).toBeNull()
  })
})
