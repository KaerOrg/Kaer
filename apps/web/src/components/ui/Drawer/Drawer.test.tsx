import { render, screen, fireEvent } from '@testing-library/react'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('affiche le titre, le sous-titre et le contenu', () => {
    render(
      <Drawer title="Bernard Hugo" subtitle="Dossier" onClose={() => {}}>
        <p>Contenu du panneau</p>
      </Drawer>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Bernard Hugo')).toBeInTheDocument()
    expect(screen.getByText('Dossier')).toBeInTheDocument()
    expect(screen.getByText('Contenu du panneau')).toBeInTheDocument()
  })

  it('ferme via la croix : animation de sortie puis onClose à la fin', () => {
    const onClose = vi.fn()
    render(<Drawer title="T" onClose={onClose}>x</Drawer>)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(screen.getByLabelText('Fermer'))
    // L'onClose n'est pas immédiat : on attend la fin de l'animation de sortie.
    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toHaveClass('drawer--closing')
    fireEvent.animationEnd(dialog)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ferme via Échap', () => {
    const onClose = vi.fn()
    render(<Drawer title="T" onClose={onClose}>x</Drawer>)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.animationEnd(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("ferme au clic sur l'overlay mais pas sur le panneau", () => {
    const onClose = vi.fn()
    const { container } = render(<Drawer title="T" onClose={onClose}>x</Drawer>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(container.querySelector('.drawer-overlay')!)
    fireEvent.animationEnd(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ferme immédiatement en prefers-reduced-motion (sans attendre l\'animation)', () => {
    const onClose = vi.fn()
    const reducedMotion: MediaQueryList = {
      matches: true, media: '', onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(reducedMotion)
    render(<Drawer title="T" onClose={onClose}>x</Drawer>)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('affiche le footer quand fourni', () => {
    render(<Drawer title="T" onClose={() => {}} footer={<button>OK</button>}>x</Drawer>)
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })

  it('applique la largeur initiale et affiche la poignée de redimensionnement', () => {
    render(<Drawer title="T" onClose={() => {}} width={500}>x</Drawer>)
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '500px' })
    expect(screen.getByLabelText('Redimensionner le panneau')).toBeInTheDocument()
  })

  it('élargit le panneau au glissement de la poignée vers la gauche', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    render(<Drawer title="T" onClose={() => {}} width={460}>x</Drawer>)
    const handle = screen.getByLabelText('Redimensionner le panneau')
    fireEvent.mouseDown(handle)
    fireEvent.mouseMove(document, { clientX: 560 }) // 1200 - 560 = 640px
    fireEvent.mouseUp(document)
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '640px' })
  })

  it('borne la largeur entre minWidth et maxWidth', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    render(<Drawer title="T" onClose={() => {}} width={460} minWidth={400} maxWidth={700}>x</Drawer>)
    const handle = screen.getByLabelText('Redimensionner le panneau')
    fireEvent.mouseDown(handle)
    fireEvent.mouseMove(document, { clientX: 100 }) // 1100px demandés → borné à 700
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '700px' })
    fireEvent.mouseMove(document, { clientX: 1190 }) // 10px demandés → borné à 400
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '400px' })
    fireEvent.mouseUp(document)
  })

  it('redimensionne au clavier (flèches) quand la poignée a le focus', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    render(<Drawer title="T" onClose={() => {}} width={460}>x</Drawer>)
    const handle = screen.getByLabelText('Redimensionner le panneau')
    fireEvent.keyDown(handle, { key: 'ArrowLeft' }) // +24
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '484px' })
    fireEvent.keyDown(handle, { key: 'ArrowRight' }) // -24
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '460px' })
  })

  it('sans resizable, aucune poignée', () => {
    render(<Drawer title="T" onClose={() => {}} resizable={false}>x</Drawer>)
    expect(screen.queryByLabelText('Redimensionner le panneau')).toBeNull()
  })

  it('affiche les actions d\'en-tête fournies', () => {
    render(
      <Drawer title="T" onClose={() => {}} headerActions={<button>Favori</button>}>
        x
      </Drawer>
    )
    expect(screen.getByRole('button', { name: 'Favori' })).toBeInTheDocument()
  })

  it('affiche le titleAccessory à côté du titre', () => {
    render(
      <Drawer title="Thomas R." onClose={() => {}} titleAccessory={<button>★</button>}>
        x
      </Drawer>
    )
    expect(screen.getByRole('button', { name: '★' })).toBeInTheDocument()
  })

  it('décale le haut de l\'overlay avec topOffset', () => {
    const { container } = render(<Drawer title="T" onClose={() => {}} topOffset={60}>x</Drawer>)
    expect(container.querySelector('.drawer-overlay')).toHaveStyle({ top: '60px' })
  })

  it('mémorise et restaure la largeur via storageKey', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    localStorage.clear()
    const { unmount } = render(<Drawer title="T" onClose={() => {}} width={460} storageKey="k-drawer">x</Drawer>)
    const handle = screen.getByLabelText('Redimensionner le panneau')
    fireEvent.mouseDown(handle)
    fireEvent.mouseMove(document, { clientX: 560 }) // → 640px
    fireEvent.mouseUp(document)
    expect(localStorage.getItem('k-drawer')).toBe('640')
    unmount()

    // Remontage : la largeur mémorisée est restaurée
    render(<Drawer title="T" onClose={() => {}} width={460} storageKey="k-drawer">x</Drawer>)
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '640px' })
  })
})
