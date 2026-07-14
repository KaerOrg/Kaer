import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChronoDataPanel } from './ChronoDataPanel'
import type { RhythmEntry } from '@kaer/shared'

const ENTRIES: RhythmEntry[] = [
  { date: '2026-05-10', values: { wake_time: '07:00' } },
  { date: '2026-06-02', values: { wake_time: '07:00', bedtime: '23:00' } },
  { date: '2026-06-09', values: { wake_time: '07:30', bedtime: '23:30' } },
]

describe('ChronoDataPanel', () => {
  it('affiche la synthèse et une ligne de tableau par repère suivi du mois', () => {
    const { container } = render(<ChronoDataPanel entries={ENTRIES} />)
    // Synthèse : 3 tuiles.
    expect(screen.getByText('modules.chronobiology_tracker.days_logged')).toBeTruthy()
    expect(screen.getByText('modules.chronobiology_tracker.anchors_tracked')).toBeTruthy()
    expect(screen.getByText('modules.chronobiology_tracker.median_gap')).toBeTruthy()
    // Repères renseignés en juin (mois le plus récent) : lever + coucher.
    expect(screen.getByText('modules.chronobiology_tracker.anchor_wake')).toBeTruthy()
    expect(screen.getByText('modules.chronobiology_tracker.anchor_bedtime')).toBeTruthy()
    // Barres de plage rendues (une par repère suivi).
    expect(container.querySelectorAll('.anchor-range-bar__segment').length).toBeGreaterThanOrEqual(2)
  })

  it('navigue vers le mois précédent (borne les flèches)', () => {
    render(<ChronoDataPanel entries={ENTRIES} />)
    const prev = screen.getByLabelText('common.previous') as HTMLButtonElement
    const next = screen.getByLabelText('common.next') as HTMLButtonElement
    expect(next.disabled).toBe(true) // mois le plus récent
    expect(prev.disabled).toBe(false)
    fireEvent.click(prev)
    // Mai : seul le lever est renseigné → un seul repère suivi.
    expect(screen.getByText('modules.chronobiology_tracker.anchor_wake')).toBeTruthy()
    expect(screen.queryByText('modules.chronobiology_tracker.anchor_bedtime')).toBeNull()
    expect((screen.getByLabelText('common.previous') as HTMLButtonElement).disabled).toBe(true)
  })

  it('sans saisie : message vide, pas de tableau', () => {
    render(<ChronoDataPanel entries={[]} />)
    expect(screen.getByText('patient.summary_empty')).toBeTruthy()
  })
})
