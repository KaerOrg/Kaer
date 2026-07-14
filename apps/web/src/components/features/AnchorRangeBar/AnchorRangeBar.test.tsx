import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnchorRangeBar } from './AnchorRangeBar'

describe('AnchorRangeBar', () => {
  it('rend un segment + un point médian quand les données existent', () => {
    const { container } = render(
      <AnchorRangeBar color="#F59E0B" min={420} median={450} max={480} ariaLabel="Lever 07:00 à 08:00" />,
    )
    expect(container.querySelectorAll('.anchor-range-bar__segment')).toHaveLength(1)
    expect(container.querySelector('.anchor-range-bar__median')).not.toBeNull()
    expect(container.querySelector('[aria-label="Lever 07:00 à 08:00"]')).not.toBeNull()
  })

  it('rend deux segments quand la plage franchit minuit', () => {
    const { container } = render(<AnchorRangeBar color="#8B5CF6" min={1380} median={1425} max={1470} />)
    expect(container.querySelectorAll('.anchor-range-bar__segment')).toHaveLength(2)
  })

  it('rend une piste vide (aucun segment) pour un repère non renseigné', () => {
    const { container } = render(<AnchorRangeBar color="#F59E0B" min={null} median={null} max={null} />)
    expect(container.querySelectorAll('.anchor-range-bar__segment')).toHaveLength(0)
    expect(container.querySelector('.anchor-range-bar__median')).toBeNull()
  })
})
