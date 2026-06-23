import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleChips } from './ModuleChips'

describe('ModuleChips', () => {
  it('ne rend rien sans module', () => {
    const { container } = render(<ModuleChips moduleTypes={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('trie les chips par titre de module', () => {
    const { container } = render(
      <ModuleChips moduleTypes={['sleep_diary', 'beck_columns', 'gad7', 'phq9']} />
    )
    const labels = Array.from(container.querySelectorAll('.module-chips .chip')).map(c => c.textContent ?? '')
    const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b))
    expect(labels).toEqual(sortedLabels)
  })

  it('affiche la vraie icône du module quand iconByModule la fournit', () => {
    const { container } = render(
      <ModuleChips moduleTypes={['phq9']} iconByModule={{ phq9: 'brain' }} />
    )
    expect(container.querySelector('.chip svg')).not.toBeNull()
  })

  it('sans icône connue, rend la puce sans svg', () => {
    const { container } = render(<ModuleChips moduleTypes={['phq9']} iconByModule={{}} />)
    expect(container.querySelector('.chip')).not.toBeNull()
    expect(container.querySelector('.chip svg')).toBeNull()
  })

  it('sous le plafond, affiche tous les modules sans « +N »', () => {
    const { container } = render(
      <ModuleChips moduleTypes={['phq9', 'gad7', 'sleep_diary']} max={3} onOverflowClick={vi.fn()} />
    )
    expect(container.querySelectorAll('.module-chips .chip')).toHaveLength(3)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('avec un plafond, replie le surplus derrière un « +N » qui appelle onOverflowClick', () => {
    const onOverflowClick = vi.fn()
    render(
      <ModuleChips
        moduleTypes={['phq9', 'gad7', 'sleep_diary', 'beck_columns', 'mood_tracker']}
        max={3}
        onOverflowClick={onOverflowClick}
      />
    )
    // 3 modules visibles + 1 puce d'action « +2 »
    const overflow = screen.getByRole('button', { name: '+2' })
    expect(overflow).toBeInTheDocument()
    fireEvent.click(overflow)
    expect(onOverflowClick).toHaveBeenCalledTimes(1)
  })

  it('sans plafond, liste tous les modules sans « +N » (usage drawer)', () => {
    const { container } = render(
      <ModuleChips moduleTypes={['phq9', 'gad7', 'sleep_diary', 'beck_columns', 'mood_tracker']} />
    )
    expect(container.querySelectorAll('.module-chips .chip')).toHaveLength(5)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('applique la classe colonne avec column', () => {
    const { container } = render(<ModuleChips column moduleTypes={['phq9']} />)
    expect(container.firstChild).toHaveClass('module-chips--column')
  })

  it('reste en flux horizontal par défaut (sans column)', () => {
    const { container } = render(<ModuleChips moduleTypes={['phq9']} />)
    expect(container.firstChild).not.toHaveClass('module-chips--column')
  })
})
