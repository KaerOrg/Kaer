import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BooleanWidget } from './BooleanWidget'

describe('BooleanWidget', () => {
  it('rend deux pilules Non / Oui via ui/Radio', () => {
    const { container } = render(<BooleanWidget />)
    const pills = container.querySelectorAll('.radio__pill')
    expect(pills.length).toBe(2)
    expect(pills[0].textContent).toBe('Non')
    expect(pills[1].textContent).toBe('Oui')
  })

  it('« Non » est l\'option active', () => {
    const { container } = render(<BooleanWidget />)
    const active = container.querySelectorAll('.radio__pill--active')
    expect(active.length).toBe(1)
    expect(active[0].textContent).toBe('Non')
  })

  it('aperçu non interactif : aucun bouton ni rôle radio', () => {
    const { container } = render(<BooleanWidget />)
    expect(container.querySelectorAll('button').length).toBe(0)
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
  })
})
