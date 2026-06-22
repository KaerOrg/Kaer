import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleChips } from './ModuleChips'

describe('ModuleChips', () => {
  it('ne rend rien sans module', () => {
    const { container } = render(<ModuleChips moduleTypes={[]} />)
    expect(container.firstChild).toBeNull()
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
})
