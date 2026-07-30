import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EvolutionOverviewCard } from './EvolutionOverviewCard'
import type { OverviewCard } from '../../../pages/PatientPage/tabs/overviewMetrics'

const metric: OverviewCard = {
  kind: 'metric', moduleType: 'sleep_diary', labelKey: 'evolution.sleep_section_title',
  color: '#0EA5E9', metricLabelKey: 'evolution.sleep_avg_efficiency', value: 85, unit: '%',
  sparkline: [80, 82, null, 88], domain: [0, 100],
}
const fingerprint: OverviewCard = {
  kind: 'fingerprint', moduleType: 'mood_tracker', labelKey: 'evolution.mood_title',
  color: '#6366F1', daysLogged: 12,
  bars: [{ key: 'humeur', label: 'H', value: 7, color: '#C4B8ED' }],
}
const empty: OverviewCard = {
  kind: 'empty', moduleType: 'fear_thermometer', labelKey: 'evolution.fear_title', color: '#F59E0B',
}
const counts: OverviewCard = {
  kind: 'counts', moduleType: 'emotion_wheel', labelKey: 'modules.emotion_wheel.label',
  color: '#7C3AED', lines: ['41 saisies', '13 nuances sur 37'],
}

describe('EvolutionOverviewCard', () => {
  it('carte métrique : valeur + unité + libellé fenêtre + sparkline', () => {
    render(<EvolutionOverviewCard card={metric} active={false} onNavigate={vi.fn()} />)
    expect(screen.getByText('85')).toBeTruthy()
    expect(screen.getByText('%')).toBeTruthy()
    expect(screen.getByText('evolution.overview_window')).toBeTruthy()
  })

  it('carte empreinte : pas de sparkline, empreinte rendue', () => {
    const { container } = render(<EvolutionOverviewCard card={fingerprint} active={false} onNavigate={vi.fn()} />)
    expect(container.querySelector('.dim-fingerprint')).toBeTruthy()
  })

  it('carte d\'effectifs : les lignes de comptage, AUCUN sparkline ni empreinte', () => {
    const { container } = render(<EvolutionOverviewCard card={counts} active={false} onNavigate={vi.fn()} />)
    expect(screen.getByText('41 saisies')).toBeTruthy()
    expect(screen.getByText('13 nuances sur 37')).toBeTruthy()
    expect(container.querySelector('.evo-ov-card__spark')).toBeNull()
    expect(container.querySelector('.dim-fingerprint')).toBeNull()
    expect(container.querySelector('.evo-ov-card__value')).toBeNull()
  })

  it('carte vide : « en attente de saisies »', () => {
    render(<EvolutionOverviewCard card={empty} active={false} onNavigate={vi.fn()} />)
    expect(screen.getByText('evolution.overview_empty')).toBeTruthy()
  })

  it('clic → onNavigate(moduleType) ; badge « en lecture » quand active', () => {
    const onNavigate = vi.fn()
    const { rerender } = render(<EvolutionOverviewCard card={metric} active={false} onNavigate={onNavigate} />)
    expect(screen.queryByText('evolution.overview_reading')).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    expect(onNavigate).toHaveBeenCalledWith('sleep_diary')
    rerender(<EvolutionOverviewCard card={metric} active onNavigate={onNavigate} />)
    expect(screen.getByText('evolution.overview_reading')).toBeTruthy()
  })
})
