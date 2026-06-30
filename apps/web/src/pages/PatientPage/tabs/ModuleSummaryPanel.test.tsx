import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' },
  }),
}))

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ModuleSummaryPanel } from './ModuleSummaryPanel'
import type { ModuleSummary } from '@services/engagementService'

describe('ModuleSummaryPanel', () => {
  it('affiche le message de chargement quand loading', () => {
    const { container } = render(
      <ModuleSummaryPanel summary={undefined} moduleType="phq9" loading />
    )
    expect(container.querySelector('.summary-panel__message')?.textContent).toBe('common.loading')
    expect(container.querySelector('.summary-panel__stats')).toBeNull()
  })

  it('affiche le message vide quand 0 entrée', () => {
    const summary: ModuleSummary = { lastDate: null, count: 0, lastPayload: null }
    const { container } = render(
      <ModuleSummaryPanel summary={summary} moduleType="phq9" loading={false} />
    )
    expect(container.querySelector('.summary-panel__message')?.textContent).toBe('patient.summary_empty')
  })

  it('affiche date, compte et score total pour une échelle', () => {
    const summary: ModuleSummary = {
      lastDate: '2026-03-01T10:00:00Z',
      count: 4,
      lastPayload: { total_score: 14, subscale_scores: { foo: 3 } },
    }
    const { container } = render(
      <ModuleSummaryPanel summary={summary} moduleType="phq9" loading={false} />
    )
    const values = [...container.querySelectorAll('.summary-panel__value')].map(n => n.textContent)
    // date, compte, score total — les sous-échelles ne sont PAS affichées pour une échelle
    expect(values).toContain('4')
    expect(values).toContain('14')
    expect(container.querySelector('.summary-panel__dimensions')).toBeNull()
  })

  it('affiche les valeurs brutes par dimension pour un tracker', () => {
    const summary: ModuleSummary = {
      lastDate: '2026-03-01T10:00:00Z',
      count: 2,
      lastPayload: { subscale_scores: { humeur: 7, energie: 6 } },
    }
    const { container } = render(
      <ModuleSummaryPanel summary={summary} moduleType="mood_tracker" loading={false} />
    )
    const dims = [...container.querySelectorAll('.summary-panel__dimension')]
    expect(dims).toHaveLength(2)
    expect(dims[0].querySelector('.summary-panel__dim-label')?.textContent).toBe('evolution.mood_humeur')
    expect(dims[0].querySelector('.summary-panel__dim-value')?.textContent).toBe('7')
    // pas de score total affiché pour un tracker
    const labels = [...container.querySelectorAll('.summary-panel__label')].map(n => n.textContent)
    expect(labels).not.toContain('patient.summary_total_score')
  })
})
