import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanStateHeader } from './PlanStateHeader'

type Props = React.ComponentProps<typeof PlanStateHeader>

const LABELS: Props['labels'] = {
  title: 'État du plan',
  reviewToday: 'Nous avons revu le plan aujourd\'hui',
  readNotMeasured: 'La lecture du plan par le patient n\'est pas mesurée.',
}

const BASE: Props = {
  createdWith: 'Élaboré le 12 mars',
  lastReviewed: 'revu avec vous le 4 juin',
  filled: '5 étapes remplies sur 6',
  labels: LABELS,
  reviewing: false,
  onReviewToday: vi.fn(),
}

function renderHeader(over: Partial<Props> = {}) {
  const props = { ...BASE, ...over, onReviewToday: over.onReviewToday ?? vi.fn() }
  render(<PlanStateHeader {...props} />)
  return props
}

describe('PlanStateHeader', () => {
  it('affiche les deux dates et le décompte des étapes remplies', () => {
    renderHeader()
    expect(screen.getByText('Élaboré le 12 mars')).toBeTruthy()
    expect(screen.getByText('revu avec vous le 4 juin')).toBeTruthy()
    expect(screen.getByText('5 étapes remplies sur 6')).toBeTruthy()
  })

  it('un plan jamais élaboré n\'invente pas de date', () => {
    renderHeader({ createdWith: null, lastReviewed: 'pas encore revu ensemble' })
    expect(screen.getByText('pas encore revu ensemble')).toBeTruthy()
    expect(screen.queryByText(/Élaboré le/)).toBeNull()
  })

  it('sépare les trois notions : la lecture par le patient n\'est pas mesurée', () => {
    renderHeader()
    expect(screen.getByText(LABELS.readNotMeasured)).toBeTruthy()
  })

  it('un appui date la revue du jour', () => {
    const props = renderHeader()
    fireEvent.click(screen.getByText(LABELS.reviewToday))
    expect(props.onReviewToday).toHaveBeenCalledTimes(1)
  })

  it('l\'appui est indisponible tant que l\'état du plan n\'est pas connu', () => {
    renderHeader({ reviewing: true })
    expect(screen.getByText(LABELS.reviewToday).closest('button')).toBeDisabled()
  })

  // MDR 2017/745 : la date est affichée, jamais surveillée. Un plan revu il y a deux ans
  // et un plan revu hier doivent produire EXACTEMENT le même rendu : aucune alerte
  // d'ancienneté, aucun badge « à revoir », aucune couleur qui change.
  it('rend une revue ancienne exactement comme une revue récente', () => {
    const { container: old } = render(
      <PlanStateHeader {...BASE} lastReviewed="revu avec vous le 4 juin 2024" />,
    )
    const { container: fresh } = render(
      <PlanStateHeader {...BASE} lastReviewed="revu avec vous hier" />,
    )
    const classesOf = (root: HTMLElement) =>
      [...root.querySelectorAll('*')].map(el => el.className).join('|')
    expect(classesOf(old)).toBe(classesOf(fresh))
  })

  // « 5 étapes remplies sur 6 » est un décompte. « Plan complété à 83 % » serait une
  // évaluation de l'état du patient.
  it('n\'affiche aucun pourcentage de complétion', () => {
    const { container } = render(<PlanStateHeader {...BASE} />)
    expect(container.textContent).not.toMatch(/%/)
  })
})
