import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanStateHeader } from './PlanStateHeader'

type Labels = React.ComponentProps<typeof PlanStateHeader>['labels']

const LABELS: Labels = {
  title: 'État du plan',
  createdWith: date => `Élaboré le ${date}`,
  reviewedWith: date => `revu avec vous le ${date}`,
  neverReviewed: 'pas encore revu ensemble',
  filled: (filled, total) => `${filled} étapes remplies sur ${total}`,
  reviewToday: 'Nous avons revu le plan aujourd\'hui',
  readNotMeasured: 'La lecture du plan par le patient n\'est pas mesurée.',
}

function renderHeader(over: Partial<React.ComponentProps<typeof PlanStateHeader>> = {}) {
  const props = {
    createdWith: '12 mars',
    lastReviewed: '4 juin',
    filledSteps: 5,
    totalSteps: 6,
    labels: LABELS,
    reviewing: false,
    onReviewToday: vi.fn(),
    ...over,
  }
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

  it('un plan jamais revu le dit, sans reproche ni date inventée', () => {
    renderHeader({ createdWith: null, lastReviewed: null })
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

  // MDR 2017/745 : la date est affichée, jamais surveillée. Un plan revu il y a deux ans
  // et un plan revu hier doivent produire EXACTEMENT le même rendu : aucune alerte
  // d'ancienneté, aucun badge « à revoir », aucune couleur qui change.
  it('rend une revue ancienne exactement comme une revue récente', () => {
    const { container: old } = render(
      <PlanStateHeader
        createdWith="12 mars 2024" lastReviewed="4 juin 2024"
        filledSteps={5} totalSteps={6} labels={LABELS} reviewing={false} onReviewToday={vi.fn()}
      />,
    )
    const { container: fresh } = render(
      <PlanStateHeader
        createdWith="12 mars 2024" lastReviewed="hier"
        filledSteps={5} totalSteps={6} labels={LABELS} reviewing={false} onReviewToday={vi.fn()}
      />,
    )
    const classesOf = (root: HTMLElement) =>
      [...root.querySelectorAll('*')].map(el => el.className).join('|')
    expect(classesOf(old)).toBe(classesOf(fresh))
  })

  // « 5 étapes remplies sur 6 » est un décompte. « Plan complété à 83 % » serait une
  // évaluation de l'état du patient.
  it('n\'affiche aucun pourcentage de complétion', () => {
    const { container } = render(
      <PlanStateHeader
        createdWith="12 mars" lastReviewed="4 juin"
        filledSteps={5} totalSteps={6} labels={LABELS} reviewing={false} onReviewToday={vi.fn()}
      />,
    )
    expect(container.textContent).not.toMatch(/%/)
  })
})
