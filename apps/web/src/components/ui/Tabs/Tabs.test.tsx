import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'
import { parseColor, contrastRatio } from '../../../lib/accessibleColor'
import type { TabItem } from './Tabs.types'

const TABS: TabItem[] = [
  { id: 'preview', label: 'Vue patient' },
  { id: 'sources', label: 'Sources' },
]

describe('Tabs', () => {
  it('rend un onglet par item avec les rôles ARIA', () => {
    render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('marque aria-selected sur l’onglet actif uniquement', () => {
    render(<Tabs tabs={TABS} activeTab="sources" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Sources' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Vue patient' })).toHaveAttribute('aria-selected', 'false')
  })

  it('déclenche onChange avec l’id de l’onglet cliqué', async () => {
    const onChange = vi.fn()
    render(<Tabs tabs={TABS} activeTab="preview" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Sources' }))
    expect(onChange).toHaveBeenCalledWith('sources')
  })

  it('applique accentColor en style inline sur l’onglet actif seulement', () => {
    // Accent qui passe déjà AA sur blanc : le libellé le porte tel quel.
    render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} accentColor="#2C6E72" />)
    const active = screen.getByRole('tab', { name: 'Vue patient' })
    const inactive = screen.getByRole('tab', { name: 'Sources' })
    expect(active).toHaveStyle({ color: '#2C6E72' })
    expect(inactive).not.toHaveStyle({ color: '#2C6E72' })
  })

  it('garde l’accent sur le filet mais assombrit le LIBELLÉ sous AA', () => {
    // #F97316 sur blanc plafonne à 2,8:1 : illisible en petit corps.
    render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} accentColor="#F97316" />)
    const active = screen.getByRole('tab', { name: 'Vue patient' })
    expect(active).toHaveStyle({ borderColor: '#F97316' })
    expect(active).not.toHaveStyle({ color: '#F97316' })
    const color = parseColor(active.style.color)
    expect(color).not.toBeNull()
    expect(contrastRatio(color!, { r: 255, g: 255, b: 255 })).toBeGreaterThanOrEqual(4.5)
  })

  it('n’ajoute aucun style inline sans accentColor (rétro-compatibilité)', () => {
    render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Vue patient' })).not.toHaveAttribute('style')
  })

  it('applique la classe de variante (horizontal par défaut, compact à la demande)', () => {
    const { rerender, container } = render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} />)
    expect(container.querySelector('.tabs--horizontal')).toBeInTheDocument()
    rerender(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} variant="compact" />)
    expect(container.querySelector('.tabs--compact')).toBeInTheDocument()
  })

  it('en mode iconOnly, masque le label visible et le garde comme nom accessible', () => {
    render(
      <Tabs
        tabs={[{ id: 'a', label: 'Actions', icon: <svg data-testid="ic" /> }]}
        activeTab="a"
        onChange={vi.fn()}
        iconOnly
      />,
    )
    // le label n'est plus un nœud texte visible, mais reste le nom accessible (aria-label + title)
    const tab = screen.getByRole('tab', { name: 'Actions' })
    expect(tab).toHaveAttribute('title', 'Actions')
    expect(tab.querySelector('[data-testid="ic"]')).not.toBeNull()
    expect(tab).not.toHaveTextContent('Actions')
  })

  it('affiche le badge quand > 0, le masque sinon', () => {
    render(
      <Tabs
        tabs={[
          { id: 'a', label: 'A', badge: 3 },
          { id: 'b', label: 'B', badge: 0 },
        ]}
        activeTab="a"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.queryByText('0')).toBeNull()
  })
})
