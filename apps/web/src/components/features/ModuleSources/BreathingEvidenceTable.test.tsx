import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BreathingEvidenceTable } from './BreathingEvidenceTable'

const technique = (key: string, props: Record<string, string>) => ({
  field_type: 'breathing_technique', sort_order: 100,
  props: { technique_key: key, color: '#4A9EA3', recommended_duration_min: '5', ...props },
  children: [],
})

const fields: unknown[] = []
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: () => Promise.resolve({ preview_kind: 'breathing_pacer', fields }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function renderTable(rows: unknown[]) {
  fields.length = 0
  fields.push(...rows)
  render(<BreathingEvidenceTable />, { wrapper })
}

describe('BreathingEvidenceTable : W4', () => {
  it('liste les techniques graduées, avec leur grade et leurs références', async () => {
    renderTable([
      technique('coherence_cardiaque', { evidence_grade: 'B' }),
      technique('carree', { evidence_grade: 'C' }),
    ])
    await screen.findByTestId('breathing-evidence-table')
    expect(screen.getByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.getByText(/Lehrer & Gevirtz/)).toBeTruthy()
    expect(screen.getByText('Respiration carrée')).toBeTruthy()
  })

  it('précise le périmètre quand le grade ne vaut que pour une indication', async () => {
    renderTable([technique('pleine_conscience', {
      evidence_grade: 'A', evidence_scope: 'modules.breathing_techniques.evidence_scope_relapse',
    })])
    await screen.findByTestId('breathing-evidence-table')
    expect(screen.getByText(/rechute dépressive/)).toBeTruthy()
  })

  it('distingue visuellement un accord d’experts d’un grade établi', async () => {
    renderTable([
      technique('coherence_cardiaque', { evidence_grade: 'B' }),
      technique('carree', { evidence_grade: 'C' }),
    ])
    const table = await screen.findByTestId('breathing-evidence-table')
    expect(table.querySelectorAll('.breathing-evidence__grade--established')).toHaveLength(1)
    expect(table.querySelectorAll('.breathing-evidence__grade--consensus')).toHaveLength(1)
  })

  it('écarte une technique sans grade déclaré plutôt que d’afficher une case vide', async () => {
    renderTable([
      technique('coherence_cardiaque', { evidence_grade: 'B' }),
      technique('diaphragmatique', {}),
    ])
    await screen.findByTestId('breathing-evidence-table')
    expect(screen.queryByText('Respiration diaphragmatique')).toBeNull()
  })

  it('ne rend rien du tout si aucune technique n’est graduée', async () => {
    renderTable([technique('coherence_cardiaque', {})])
    // Laisse le temps à la requête de répondre avant de conclure à l'absence.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(screen.queryByTestId('breathing-evidence-table')).toBeNull()
  })

  it('rappelle que les grades restent à valider par le référent clinique', async () => {
    renderTable([technique('coherence_cardiaque', { evidence_grade: 'B' })])
    await screen.findByTestId('breathing-evidence-table')
    expect(screen.getByText(/valider par le référent clinique/)).toBeTruthy()
  })
})
