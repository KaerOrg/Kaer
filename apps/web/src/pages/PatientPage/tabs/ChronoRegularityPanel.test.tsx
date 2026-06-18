import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { render, screen } from '@testing-library/react'
import { ChronoRegularityPanel } from './ChronoRegularityPanel'

describe('ChronoRegularityPanel', () => {
  it('affiche une ligne par ancre avec l’écart-type brut', () => {
    render(
      <ChronoRegularityPanel
        anchors={[
          { key: 'wake_time', count: 12, sdMinutes: 28 },
          { key: 'bedtime', count: 10, sdMinutes: 41 },
        ]}
        entryCount={12}
      />,
    )
    expect(screen.getByText('modules.chrono_bio.wake_time')).toBeTruthy()
    expect(screen.getByText('modules.chrono_bio.bedtime')).toBeTruthy()
    expect(screen.getByText(/28/)).toBeTruthy()
    expect(screen.getByText(/41/)).toBeTruthy()
    // Note MDR « valeurs brutes » présente.
    expect(screen.getByText('modules.chronobiology_tracker.regularity_note')).toBeTruthy()
  })

  it('rend le titre même sans ancre (liste vide)', () => {
    render(<ChronoRegularityPanel anchors={[]} entryCount={0} />)
    expect(screen.getByText('modules.chronobiology_tracker.regularity_title')).toBeTruthy()
  })
})
