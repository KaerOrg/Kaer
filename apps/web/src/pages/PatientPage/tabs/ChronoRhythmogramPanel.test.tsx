import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

// Stub du graphe recharts (non rendu en jsdom) : expose mois affiché + repères.
vi.mock('../../../components/features/ChronoRhythmogram', () => ({
  ChronoRhythmogram: ({
    year,
    month,
    anchors,
  }: {
    year: number
    month: number
    anchors: { key: string; count: number }[]
  }) => (
    <div
      data-testid="rhythmogram"
      data-ym={`${year}-${month}`}
      data-logged={anchors.filter(a => a.count > 0).map(a => a.key).join(',')}
    />
  ),
}))

import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChronoRhythmogramPanel } from './ChronoRhythmogramPanel'
import type { RhythmEntry } from '@psytool/shared'

const TWO_MONTHS: RhythmEntry[] = [
  { date: '2026-05-10', values: { wake_time: '07:00' } },
  { date: '2026-06-02', values: { wake_time: '07:30', bedtime: '23:00' } },
  { date: '2026-06-09', values: { wake_time: '06:45', bedtime: '23:30' } },
]

describe('ChronoRhythmogramPanel', () => {
  it('affiche par défaut le mois le plus récent saisi', () => {
    const { getByTestId } = render(<ChronoRhythmogramPanel entries={TWO_MONTHS} />)
    const chart = getByTestId('rhythmogram')
    expect(chart.getAttribute('data-ym')).toBe('2026-6')
    // Repères renseignés en juin : lever + coucher.
    expect(chart.getAttribute('data-logged')).toBe('wake_time,bedtime')
  })

  it('navigue vers le mois précédent et borne les flèches', () => {
    const { getByTestId, getByLabelText } = render(<ChronoRhythmogramPanel entries={TWO_MONTHS} />)
    // Au mois le plus récent : « suivant » désactivé, « précédent » actif.
    expect((getByLabelText('common.next') as HTMLButtonElement).disabled).toBe(true)
    expect((getByLabelText('common.previous') as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(getByLabelText('common.previous'))

    expect(getByTestId('rhythmogram').getAttribute('data-ym')).toBe('2026-5')
    // Au mois le plus ancien : « précédent » désactivé.
    expect((getByLabelText('common.previous') as HTMLButtonElement).disabled).toBe(true)
  })

  it('sans saisie : message vide, pas de graphe', () => {
    const { container, queryByTestId } = render(<ChronoRhythmogramPanel entries={[]} />)
    expect(queryByTestId('rhythmogram')).toBeNull()
    expect(container.querySelector('.module-data-panel__message')?.textContent).toBe('patient.summary_empty')
  })
})
