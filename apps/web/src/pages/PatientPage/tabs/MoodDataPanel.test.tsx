import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MoodDataPanel } from './MoodDataPanel'
import type { MoodPoint, MoodMarkerRow } from '@services/engagementService'

const DAY = 86_400_000
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString()

const POINTS: MoodPoint[] = [
  { date: iso(1), humeur: 7, energie: 6, anxiete: 4, plaisir: 5, sommeil: 8, alimentation: 6 },
  { date: iso(3), humeur: 5, energie: 4, anxiete: 6, plaisir: 4, sommeil: 6, alimentation: 5 },
]

const MARKERS: MoodMarkerRow[] = [
  { id: 'm1', date: '2026-06-14', label: 'Passage à 150 mg', type: 'treatment' },
]

describe('MoodDataPanel', () => {
  it('affiche les moyennes récentes (empreinte 6 dimensions) et l’assiduité', () => {
    const { container } = render(<MoodDataPanel points={POINTS} markers={[]} locale="fr" />)
    expect(screen.getByText('evolution.mood_recents_title')).toBeTruthy()
    expect(screen.getByText('evolution.mood_days_logged')).toBeTruthy()
    // Empreinte : une barre par dimension.
    expect(container.querySelectorAll('.dim-fingerprint__col').length).toBe(6)
  })

  it('rend un petit multiple par dimension', () => {
    const { container } = render(<MoodDataPanel points={POINTS} markers={[]} locale="fr" />)
    expect(container.querySelectorAll('.mood-data__multiple').length).toBe(6)
    expect(screen.getByText('evolution.mood_multiples_hint')).toBeTruthy()
  })

  it('« Agrandir » ouvre le détail avec les statistiques', () => {
    render(<MoodDataPanel points={POINTS} markers={[]} locale="fr" />)
    expect(screen.queryByText('evolution.mood_detail_title')).toBeNull()
    fireEvent.click(screen.getAllByLabelText('evolution.mood_expand')[0])
    expect(screen.getByText('evolution.mood_detail_title')).toBeTruthy()
    expect(screen.getByText('evolution.mood_stat_min')).toBeTruthy()
    expect(screen.getByText('evolution.mood_stat_n')).toBeTruthy()
  })

  it('liste les repères posés par le patient', () => {
    render(<MoodDataPanel points={POINTS} markers={MARKERS} locale="fr" />)
    expect(screen.getByText('Passage à 150 mg')).toBeTruthy()
    expect(screen.getByText('evolution.marker_type_treatment')).toBeTruthy()
  })

  it('affiche l’état vide des repères quand il n’y en a pas', () => {
    render(<MoodDataPanel points={POINTS} markers={[]} locale="fr" />)
    expect(screen.getByText('evolution.mood_markers_empty')).toBeTruthy()
  })
})
