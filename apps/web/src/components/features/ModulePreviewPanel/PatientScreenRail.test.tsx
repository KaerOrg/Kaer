import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatientScreenRail, type PatientScreen, type StageFilter } from './PatientScreenRail'

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
      previousLabel="Écran précédent"
      nextLabel="Écran suivant"
      {...over}
    />
  )
  return { ...result, onFilterChange }
}

/**
 * jsdom ne fait pas de mise en page : sans dimensions simulées, un rail est toujours
 * « au bout » et les deux flèches resteraient désactivées. On pose donc une largeur
 * de contenu supérieure à la fenêtre.
 */
function simulateOverflow(rail: HTMLElement, { scrollLeft = 0 } = {}) {
  Object.defineProperty(rail, 'scrollWidth', { value: 900, configurable: true })
  Object.defineProperty(rail, 'clientWidth', { value: 300, configurable: true })
  Object.defineProperty(rail, 'scrollLeft', { value: scrollLeft, writable: true, configurable: true })
  // `fireEvent` passe par `act` : sans lui la mise à jour d'état ne serait pas vidée.
  fireEvent.scroll(rail)
}

beforeEach(() => {
  // Non implémenté par jsdom : c'est le geste qu'on veut observer.
  Element.prototype.scrollBy = vi.fn()
})

describe('PatientScreenRail', () => {
  it('rend chaque écran, numéroté et légendé', () => {
    const { container } = renderRail()
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    expect(captions).toEqual(['1 · Premier', '2 · Deuxième', '3 · Troisième'])
  })

  it('propose deux flèches, nommées pour les lecteurs d\'écran', () => {
    renderRail()
    expect(screen.getByLabelText('Écran précédent')).toBeInTheDocument()
    expect(screen.getByLabelText('Écran suivant')).toBeInTheDocument()
  })

  it('désactive les deux flèches quand tout tient à l\'écran', () => {
    renderRail()
    expect(screen.getByLabelText('Écran précédent')).toBeDisabled()
    expect(screen.getByLabelText('Écran suivant')).toBeDisabled()
  })

  it('au départ : « suivant » actif, « précédent » désactivé', () => {
    const { container } = renderRail()
    simulateOverflow(container.querySelector('.psr-rail') as HTMLElement)

    expect(screen.getByLabelText('Écran précédent')).toBeDisabled()
    expect(screen.getByLabelText('Écran suivant')).toBeEnabled()
  })

  it('en bout de rail : « précédent » actif, « suivant » désactivé', () => {
    const { container } = renderRail()
    simulateOverflow(container.querySelector('.psr-rail') as HTMLElement, { scrollLeft: 600 })

    expect(screen.getByLabelText('Écran précédent')).toBeEnabled()
    expect(screen.getByLabelText('Écran suivant')).toBeDisabled()
  })

  it('un clic fait avancer d\'UN écran, pas d\'une page entière', async () => {
    const { container } = renderRail()
    const rail = container.querySelector('.psr-rail') as HTMLElement
    simulateOverflow(rail)
    // Largeur d'une vignette, telle que le hook la mesure sur le rendu.
    const first = rail.firstElementChild as HTMLElement
    Object.defineProperty(first, 'offsetWidth', { value: 232, configurable: true })

    await userEvent.click(screen.getByLabelText('Écran suivant'))

    expect(rail.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: 232, behavior: 'smooth' })
    )
  })

  it('la flèche « précédent » recule du même pas', async () => {
    const { container } = renderRail()
    const rail = container.querySelector('.psr-rail') as HTMLElement
    simulateOverflow(rail, { scrollLeft: 600 })
    const first = rail.firstElementChild as HTMLElement
    Object.defineProperty(first, 'offsetWidth', { value: 232, configurable: true })

    await userEvent.click(screen.getByLabelText('Écran précédent'))

    expect(rail.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: -232, behavior: 'smooth' })
    )
  })

  it('filtrer réduit le rail sans renuméroter les écrans', () => {
    const { container } = renderRail({ activeFilter: 'b' })
    const captions = [...container.querySelectorAll('.psr-screen__caption')].map(c => c.textContent)
    // Le troisième écran reste le troisième, même seul.
    expect(captions).toEqual(['3 · Troisième'])
  })

  it('un clic sur une puce remonte le filtre choisi', async () => {
    const { onFilterChange } = renderRail()
    await userEvent.click(screen.getByText('Étape B'))
    expect(onFilterChange).toHaveBeenCalledWith('b')
  })
})
