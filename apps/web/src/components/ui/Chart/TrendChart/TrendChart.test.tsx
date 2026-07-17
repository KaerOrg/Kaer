import { render } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'

// Recharts ne se rend pas en jsdom (ResponsiveContainer = 0×0) : on stube la lib
// tierce pour inspecter le câblage de TrendChart (séries, ligne de moyenne, marqueurs).
vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Mark = (testid: string) => (props: Record<string, unknown>) =>
    <div data-testid={testid} data-key={String(props.dataKey ?? props.x ?? '')} />
  return {
    ResponsiveContainer: Stub,
    LineChart: Stub,
    Line: Mark('line'),
    XAxis: Mark('xaxis'),
    YAxis: Mark('yaxis'),
    CartesianGrid: Mark('grid'),
    Tooltip: Mark('tooltip'),
    ReferenceLine: Mark('refline'),
    ReferenceDot: Mark('refdot'),
    ReferenceArea: Mark('refarea'),
  }
})

import { TrendChart } from './TrendChart'
import type { TrendPoint } from './trendMath'

const DATA: TrendPoint[] = [
  { date: '2026-03-01', value: 80 },
  { date: '2026-03-02', value: null, event: true },
  { date: '2026-03-03', value: 90 },
]

describe('TrendChart', () => {
  it('trace une seule série sans comparaison', () => {
    const { getAllByTestId } = render(<TrendChart data={DATA} yDomain={[0, 100]} />)
    expect(getAllByTestId('line')).toHaveLength(1)
  })

  it('ajoute la série de comparaison (2 lignes) quand fournie', () => {
    const { getAllByTestId } = render(
      <TrendChart data={DATA} yDomain={[0, 100]} comparison={{ data: DATA, label: 'Réf.' }} />,
    )
    expect(getAllByTestId('line')).toHaveLength(2)
  })

  it('affiche la ligne de moyenne quand meanLabel est fourni', () => {
    const { getAllByTestId } = render(<TrendChart data={DATA} yDomain={[0, 100]} meanLabel="moy." />)
    expect(getAllByTestId('refline')).toHaveLength(1)
  })

  it('ne trace pas de ligne de moyenne sans meanLabel', () => {
    const { queryByTestId } = render(<TrendChart data={DATA} yDomain={[0, 100]} />)
    expect(queryByTestId('refline')).toBeNull()
  })

  it('marque la dernière valeur et chaque événement (cauchemar)', () => {
    const { getAllByTestId } = render(<TrendChart data={DATA} yDomain={[0, 100]} />)
    // 1 marqueur « dernière valeur » + 1 marqueur événement
    expect(getAllByTestId('refdot')).toHaveLength(2)
  })

  it('trace une ligne verticale par repère daté (markers)', () => {
    const { getAllByTestId } = render(
      <TrendChart
        data={DATA}
        yDomain={[0, 100]}
        markers={[
          { date: '2026-03-01', label: 'Traitement', color: '#4FA5A9' },
          { date: '2026-03-03', label: 'Événement', color: '#9C89D6' },
        ]}
      />,
    )
    const reflines = getAllByTestId('refline').map(el => el.getAttribute('data-key'))
    // Pas de meanLabel ici → seuls les 2 repères sont des reflines.
    expect(reflines).toEqual(['2026-03-01', '2026-03-03'])
  })

  it('politique des trous : bande grise (2+ vides) + pont pointillé (1 vide)', () => {
    const data: TrendPoint[] = [
      { date: '2026-03-01', value: 5 },
      { date: '2026-03-03', value: 8 }, // encadre un pont
    ]
    const { getAllByTestId, queryAllByTestId } = render(
      <TrendChart
        data={data}
        yDomain={[0, 10]}
        gaps={{
          bands: [{ from: '2026-03-10', to: '2026-03-17' }],
          bridges: [{ from: '2026-03-01', to: '2026-03-03' }],
        }}
        noDataLabel="aucune saisie"
      />,
    )
    // Une bande « aucune saisie ».
    expect(getAllByTestId('refarea')).toHaveLength(1)
    // Un pont (refline sans meanLabel/markers → uniquement le segment de pont).
    expect(queryAllByTestId('refline')).toHaveLength(1)
  })
})
