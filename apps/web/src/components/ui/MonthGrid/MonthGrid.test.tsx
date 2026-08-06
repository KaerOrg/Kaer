import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthGrid } from './MonthGrid'

describe('MonthGrid', () => {
  it('rend tous les jours du mois', () => {
    const { container } = render(<MonthGrid year={2026} month={3} locale="fr" cells={[]} />)
    expect(container.querySelectorAll('.month-grid__day')).toHaveLength(31)
    expect(screen.getByText('31')).toBeTruthy()
  })

  it('decale le 1er du mois sur son jour de semaine, lundi en tete', () => {
    // 1er mars 2026 = un dimanche, donc six cases vides avant lui.
    const { container } = render(<MonthGrid year={2026} month={3} locale="fr" cells={[]} />)
    const slots = container.querySelectorAll('.month-grid__slot')
    expect(slots[6].querySelector('.month-grid__day')?.textContent).toBe('1')
    expect(slots[0].querySelector('.month-grid__day')).toBeNull()
  })

  it('gere un mois de fevrier bissextile', () => {
    const { container } = render(<MonthGrid year={2028} month={2} locale="fr" cells={[]} />)
    expect(container.querySelectorAll('.month-grid__day')).toHaveLength(29)
  })

  it('applique le fond et le point des jours fournis', () => {
    const { container } = render(
      <MonthGrid year={2026} month={3} locale="fr" cells={[
        { day: 4, background: 'rgb(1, 2, 3)', dotColor: 'rgb(4, 5, 6)', label: 'quatre' },
      ]} />,
    )
    const day = screen.getByLabelText('quatre')
    expect(day.style.background).toBe('rgb(1, 2, 3)')
    expect(container.querySelectorAll('.month-grid__dot')).toHaveLength(1)
  })

  it('ne pose pas de point quand le jour n en porte pas', () => {
    const { container } = render(
      <MonthGrid year={2026} month={3} locale="fr" cells={[{ day: 4, background: 'red' }]} />,
    )
    expect(container.querySelectorAll('.month-grid__dot')).toHaveLength(0)
  })

  it('estompe les jours posterieurs a la date fournie', () => {
    const { container } = render(
      <MonthGrid year={2026} month={3} locale="fr" cells={[]} dimAfter="2026-03-10" />,
    )
    // 31 jours, dont 21 apres le 10.
    expect(container.querySelectorAll('.month-grid__day--dimmed')).toHaveLength(21)
  })

  it('n estompe rien sans date de coupure', () => {
    const { container } = render(<MonthGrid year={2026} month={3} locale="fr" cells={[]} />)
    expect(container.querySelectorAll('.month-grid__day--dimmed')).toHaveLength(0)
  })

  it('tire les initiales de jours de la locale', () => {
    const { container } = render(<MonthGrid year={2026} month={3} locale="en" cells={[]} />)
    const initials = [...container.querySelectorAll('.month-grid__weekday')].map(n => n.textContent)
    expect(initials).toHaveLength(7)
    expect(initials[0]).toBe('M')
    expect(initials[6]).toBe('S')
  })
})
