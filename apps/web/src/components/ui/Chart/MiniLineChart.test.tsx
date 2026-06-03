import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MiniLineChart } from './MiniLineChart'

describe('MiniLineChart (web)', () => {
  it('rend un SVG', () => {
    const { container } = render(<MiniLineChart data={[1, 2, null, 3, 2]} color="#8B5CF6" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('rend sans erreur avec une série entièrement nulle', () => {
    const { container } = render(<MiniLineChart data={[null, null, null]} color="#EC4899" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('rend sans erreur avec un seul point', () => {
    const { container } = render(<MiniLineChart data={[2]} color="#3B82F6" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('accepte maxY personnalisé', () => {
    const { container } = render(<MiniLineChart data={[5, 8, 10]} color="#F97316" maxY={10} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
