import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EvolutionSection } from './EvolutionSection'

function setup(overrides: Partial<React.ComponentProps<typeof EvolutionSection>> = {}) {
  const onToggle = vi.fn()
  const onViewData = vi.fn()
  render(
    <EvolutionSection
      sectionKey="sleep_diary"
      title="Sommeil"
      badge="12 saisies"
      expanded
      onToggle={onToggle}
      viewDataLabel="Voir les données"
      onViewData={onViewData}
      {...overrides}
    >
      <div data-testid="body">corps</div>
    </EvolutionSection>,
  )
  return { onToggle, onViewData }
}

describe('EvolutionSection', () => {
  it('affiche titre, pastille et corps quand dépliée', () => {
    setup()
    expect(screen.getByText('Sommeil')).toBeTruthy()
    expect(screen.getByText('12 saisies')).toBeTruthy()
    expect(screen.getByTestId('body')).toBeTruthy()
  })

  it('en-tête = contrôle de dévoilement (aria-expanded) et déclenche onToggle', () => {
    const { onToggle } = setup({ expanded: true })
    const toggle = screen.getByRole('button', { name: /Sommeil/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledWith('sleep_diary')
  })

  it('masque le corps quand repliée', () => {
    setup({ expanded: false })
    expect(screen.queryByTestId('body')).toBeNull()
    expect(screen.getByRole('button', { name: /Sommeil/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('« Voir les données » appelle onViewData sans toggler', () => {
    const { onViewData, onToggle } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Voir les données/ }))
    expect(onViewData).toHaveBeenCalledWith('sleep_diary')
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('sans onViewData : pas de lien', () => {
    setup({ onViewData: undefined, viewDataLabel: undefined })
    expect(screen.queryByText('Voir les données')).toBeNull()
  })

  it('affiche le rappel métrique et le badge archivé', () => {
    setup({ metricReminder: '85 %', archivedLabel: 'Archivé' })
    expect(screen.getByText('85 %')).toBeTruthy()
    expect(screen.getByText('Archivé')).toBeTruthy()
  })
})
