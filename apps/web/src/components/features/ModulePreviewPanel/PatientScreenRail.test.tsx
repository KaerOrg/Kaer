import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PatientScreenRail, type PatientScreen, type StageFilter } from './PatientScreenRail'

// La mécanique du rail (flèches, pas d'un élément, largeur sans demi-carte) est
// couverte par `ui/ScrollRail`. Ici on vérifie ce qui appartient à la coquille :
// la numérotation et le filtrage.

type Stage = 'a' | 'b'

const SCREENS: PatientScreen<Stage>[] = [
  { id: 's1', stage: 'a', caption: 'Premier', body: <p>corps 1</p> },
  { id: 's2', stage: 'a', caption: 'Deuxième', body: <p>corps 2</p> },
  { id: 's3', stage: 'b', caption: 'Troisième', body: <p>corps 3</p> },
]

const FILTERS: StageFilter<Stage>[] = [
  { value: 'all', label: 'Tout' },
  { value: 'a', label: 'Étape A' },
  { value: 'b', label: 'Étape B' },
]

function renderRail(over: Partial<React.ComponentProps<typeof PatientScreenRail<Stage>>> = {}) {
  const onFilterChange = vi.fn()
  const result = render(
    <PatientScreenRail
      screens={SCREENS}
      filters={FILTERS}
      activeFilter="all"
      onFilterChange={onFilterChange}
      bannerLabel="Aperçu"
      footerLabel="3 écrans"
      {...over}
    />
  )
  return { ...result, onFilterChange }
}

describe('PatientScreenRail', () => {
  it('rend chaque écran, numéroté et légendé', () => {
    const { container } = renderRail()
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    expect(captions).toEqual(['1 · Premier', '2 · Deuxième', '3 · Troisième'])
  })

  it('confie la navigation au rail : deux flèches encadrent la piste', () => {
    const { container } = renderRail()
    expect(container.querySelector('.scroll-rail__arrow--previous')).toBeInTheDocument()
    expect(container.querySelector('.scroll-rail__arrow--next')).toBeInTheDocument()
  })

  it('filtrer réduit le rail SANS renuméroter les écrans', () => {
    const { container } = renderRail({ activeFilter: 'b' })
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    // Le troisième écran reste le troisième, même seul dans le rail.
    expect(captions).toEqual(['3 · Troisième'])
  })

  it('un clic sur une puce remonte le filtre choisi', async () => {
    const { onFilterChange } = renderRail()
    await userEvent.click(screen.getByText('Étape B'))
    expect(onFilterChange).toHaveBeenCalledWith('b')
  })

  it('rend le bandeau de lecture seule et le pied', () => {
    renderRail()
    expect(screen.getByText('Aperçu')).toBeInTheDocument()
    expect(screen.getByText('3 écrans')).toBeInTheDocument()
  })
})
