import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'
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
    render(<Tabs tabs={TABS} activeTab="preview" onChange={vi.fn()} accentColor="rgb(255, 0, 0)" />)
    const active = screen.getByRole('tab', { name: 'Vue patient' })
    const inactive = screen.getByRole('tab', { name: 'Sources' })
    expect(active).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(inactive).not.toHaveStyle({ color: 'rgb(255, 0, 0)' })
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
