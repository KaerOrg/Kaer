import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeekRhythmLine } from './WeekRhythmLine'

const LABELS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'] as const

describe('WeekRhythmLine', () => {
  it('rend 7 arrêts (role checkbox) avec leurs libellés', () => {
    render(<WeekRhythmLine selectedDays={[]} onToggle={vi.fn()} dayLabels={LABELS} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(7)
    LABELS.forEach(l => expect(screen.getByText(l)).toBeInTheDocument())
  })

  it('marque les jours actifs via aria-checked', () => {
    render(<WeekRhythmLine selectedDays={[1, 3, 5]} onToggle={vi.fn()} dayLabels={LABELS} />)
    const dots = screen.getAllByRole('checkbox')
    expect(dots[0]).toHaveAttribute('aria-checked', 'true') // lundi
    expect(dots[1]).toHaveAttribute('aria-checked', 'false') // mardi
    expect(dots[2]).toHaveAttribute('aria-checked', 'true') // mercredi
  })

  it('appelle onToggle avec l\'ISO du jour cliqué', async () => {
    const onToggle = vi.fn()
    render(<WeekRhythmLine selectedDays={[]} onToggle={onToggle} dayLabels={LABELS} />)
    await userEvent.click(screen.getAllByRole('checkbox')[6]) // dimanche
    expect(onToggle).toHaveBeenCalledWith(7)
  })

  it('utilise dayAriaLabel quand fourni', () => {
    render(
      <WeekRhythmLine
        selectedDays={[1]}
        onToggle={vi.fn()}
        dayLabels={LABELS}
        dayAriaLabel={(iso, active) => `jour ${iso} ${active ? 'actif' : 'inactif'}`}
      />,
    )
    expect(screen.getByLabelText('jour 1 actif')).toBeInTheDocument()
    expect(screen.getByLabelText('jour 2 inactif')).toBeInTheDocument()
  })

  it('relie deux jours actifs adjacents par un fil teinté, pas les autres', () => {
    const { container } = render(
      <WeekRhythmLine selectedDays={[1, 2]} onToggle={vi.fn()} dayLabels={LABELS} accentColor="#6dbfc3" />,
    )
    const connectors = container.querySelectorAll<HTMLElement>('.wrl__connector')
    // 6 connecteurs (un par jour sauf le premier).
    expect(connectors).toHaveLength(6)
    // Mardi (vers lundi, tous deux actifs) → fil teinté ; mercredi (voisin inactif) → rail par défaut.
    expect(connectors[0].style.background).not.toBe('')
    expect(connectors[1].style.background).toBe('')
  })
})
