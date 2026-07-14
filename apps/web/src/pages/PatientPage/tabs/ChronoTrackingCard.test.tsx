import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChronoTrackingCard } from './ChronoTrackingCard'
import type { RhythmEntry } from '@kaer/shared'

const ENTRIES: RhythmEntry[] = [
  { date: '2026-06-02', values: { wake_time: '07:00', bedtime: '23:00' } },
  { date: '2026-06-09', values: { wake_time: '07:30', bedtime: '23:30' } },
]

describe('ChronoTrackingCard', () => {
  it('rend une barre de plage + écart par repère suivi', () => {
    const { container } = render(<ChronoTrackingCard entries={ENTRIES} />)
    expect(screen.getByText('modules.chronobiology_tracker.regularity_title')).toBeTruthy()
    expect(screen.getByText('modules.chronobiology_tracker.tracking_legend')).toBeTruthy()
    expect(container.querySelectorAll('.chrono-tracking__row')).toHaveLength(2)
    expect(container.querySelectorAll('.anchor-range-bar__segment').length).toBeGreaterThanOrEqual(2)
  })

  it('ne rend rien quand aucune saisie', () => {
    const { container } = render(<ChronoTrackingCard entries={[]} />)
    expect(container.querySelector('.chrono-tracking')).toBeNull()
  })
})
