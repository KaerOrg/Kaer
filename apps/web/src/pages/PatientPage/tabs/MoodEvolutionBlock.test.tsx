import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MoodEvolutionBlock } from './MoodEvolutionBlock'
import type { MoodPoint, MoodMarkerRow } from '@services/engagementService'

const DAY = 86_400_000
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString()

const POINTS: MoodPoint[] = [
  { date: iso(2), humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
  { date: iso(10), humeur: 5, energie: 4, anxiete: 6, plaisir: 4, sommeil: 6, alimentation: 5 },
]
const MARKERS: MoodMarkerRow[] = [{ id: 'm1', date: '2026-06-14', label: 'X', type: 'treatment' }]

describe('MoodEvolutionBlock', () => {
  it('carte d’aperçu : empreinte 6 dimensions (30 j) + assiduité', () => {
    const { container } = render(<MoodEvolutionBlock points={POINTS} markers={MARKERS} locale="fr" periodDays={365} />)
    expect(container.querySelectorAll('.mood-frise__overview .dim-fingerprint__col').length).toBe(6)
    expect(screen.getByText('evolution.mood_days_logged')).toBeTruthy()
  })

  it('frise : une ligne repliable par dimension', () => {
    const { container } = render(<MoodEvolutionBlock points={POINTS} markers={MARKERS} locale="fr" periodDays={365} />)
    expect(container.querySelectorAll('.mood-frise__line').length).toBe(6)
  })

  it('déplie une dimension au clic (comparateur visible)', () => {
    render(<MoodEvolutionBlock points={POINTS} markers={MARKERS} locale="fr" periodDays={365} />)
    expect(screen.queryByText('evolution.mood_compare_prev')).toBeNull()
    // Le premier chevron = dimension Humeur.
    fireEvent.click(screen.getByLabelText('evolution.mood_humeur'))
    expect(screen.getByText('evolution.mood_compare_prev')).toBeTruthy()
  })
})
