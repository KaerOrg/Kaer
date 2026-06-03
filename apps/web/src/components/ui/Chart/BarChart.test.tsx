import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BarChart } from './BarChart'

describe('BarChart (web)', () => {
  it('rend une colonne par point (enfants directs du conteneur flex)', () => {
    const { container } = render(<BarChart data={[1, 2, null, 3]} color="#8B5CF6" />)
    // Le conteneur flex racine contient exactement 4 colonnes (une par point)
    const columns = container.firstElementChild?.children
    expect(columns?.length).toBe(4)
  })

  it('rend sans erreur avec données nulles uniquement', () => {
    const { container } = render(<BarChart data={[null, null]} color="#EC4899" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('accepte maxY personnalisé', () => {
    const { container } = render(<BarChart data={[5, 8, 10]} color="#F97316" maxY={10} />)
    expect(container.firstChild).toBeTruthy()
  })
})
