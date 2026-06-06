import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './SegmentedControl'
import type { SegmentOption } from './SegmentedControl.types'

type Range = '3m' | '6m' | '1y'

const OPTIONS: readonly SegmentOption<Range>[] = [
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
]

describe('SegmentedControl', () => {
  it('affiche un segment par option', () => {
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByText('6 mois')).toBeInTheDocument()
  })

  it('marque le segment sélectionné via aria-checked', () => {
    render(<SegmentedControl options={OPTIONS} value="6m" onChange={vi.fn()} />)
    expect(screen.getByText('6 mois')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('3 mois')).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('6 mois')).toHaveClass('segmented__btn--active')
  })

  it('appelle onChange avec la valeur du segment cliqué', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={onChange} />)
    await userEvent.click(screen.getByText('1 an'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('1y')
  })

  it('applique la variante CSS demandée', () => {
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={vi.fn()} variant="pills" />)
    expect(screen.getByRole('radiogroup')).toHaveClass('segmented--pills')
  })

  it('utilise la variante "track" par défaut', () => {
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={vi.fn()} />)
    expect(screen.getByRole('radiogroup')).toHaveClass('segmented--track')
  })

  it('applique la couleur d\'accent au seul segment actif', () => {
    render(<SegmentedControl options={OPTIONS} value="6m" onChange={vi.fn()} accentColor="#F97316" />)
    expect(screen.getByText('6 mois')).toHaveStyle({ background: '#F97316' })
    expect(screen.getByText('3 mois')).not.toHaveStyle({ background: '#F97316' })
  })

  it('expose le libellé accessible du groupe', () => {
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={vi.fn()} ariaLabel="Période" />)
    expect(screen.getByRole('radiogroup', { name: 'Période' })).toBeInTheDocument()
  })
})
