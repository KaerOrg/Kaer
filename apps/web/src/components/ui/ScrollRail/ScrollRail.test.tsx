import { render, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScrollRail } from './ScrollRail'

const ITEM_WIDTH = 200
const GAP = 16

// Le rail se redimensionne via un ResizeObserver, que jsdom n'implémente pas. On le
// remplace par un observateur qu'on peut déclencher à la main : c'est exactement le
// mécanisme réel, seule la source de l'événement change.
let resizeCallbacks: ResizeObserverCallback[] = []

class ResizeObserverStub implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback) }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function triggerResize() {
  act(() => {
    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver)
  })
}

function renderRail(itemCount = 3) {
  return render(
    <ScrollRail itemCount={itemCount}>
      {Array.from({ length: itemCount }, (_, i) => (
        <article key={i} data-testid={`item-${i}`}>élément {i}</article>
      ))}
    </ScrollRail>
  )
}

// Les deux flèches se ciblent par leur classe : elles n'ont pas de libellé.
function arrows(container: HTMLElement) {
  return {
    previous: container.querySelector('.scroll-rail__arrow--previous') as HTMLButtonElement,
    next: container.querySelector('.scroll-rail__arrow--next') as HTMLButtonElement,
  }
}

/**
 * jsdom ne fait aucune mise en page : sans dimensions simulées, un rail est toujours
 * « au bout » et les deux flèches resteraient désactivées. On pose donc une piste
 * plus large que sa fenêtre, et une largeur d'élément mesurable.
 */
function simulateLayout(
  container: HTMLElement,
  { scrollLeft = 0, viewportWidth = 700 } = {},
) {
  const viewport = container.querySelector('.scroll-rail') as HTMLElement
  const track = container.querySelector('.scroll-rail__track') as HTMLElement
  const first = track.firstElementChild as HTMLElement

  Object.defineProperty(viewport, 'clientWidth', { value: viewportWidth, configurable: true })
  Object.defineProperty(first, 'offsetWidth', { value: ITEM_WIDTH, configurable: true })
  Object.defineProperty(track, 'scrollWidth', { value: 900, configurable: true })
  Object.defineProperty(track, 'clientWidth', { value: 400, configurable: true })
  Object.defineProperty(track, 'scrollLeft', { value: scrollLeft, writable: true, configurable: true })
  // La place disponible a changé : c'est ce qui recalcule la largeur de la piste.
  triggerResize()
  // `fireEvent` passe par `act` : sans lui la mise à jour d'état ne serait pas vidée.
  fireEvent.scroll(track)
  return { viewport, track }
}

beforeEach(() => {
  resizeCallbacks = []
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  Element.prototype.scrollBy = vi.fn()
  // La gouttière est lue sur le style calculé, que jsdom ne résout pas depuis le CSS.
  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
    columnGap: `${GAP}px`,
    paddingLeft: '44px',
    paddingRight: '44px',
  }) as unknown as CSSStyleDeclaration)
})

describe('ScrollRail', () => {
  it('rend les éléments qu\'on lui donne', () => {
    const { getByTestId } = renderRail(3)
    expect(getByTestId('item-0')).toBeInTheDocument()
    expect(getByTestId('item-2')).toBeInTheDocument()
  })

  it('désactive les deux flèches quand tout tient dans la fenêtre', () => {
    const { container } = renderRail()
    expect(arrows(container).previous).toBeDisabled()
    expect(arrows(container).next).toBeDisabled()
  })

  it('au départ : « suivant » actif, « précédent » désactivé', () => {
    const { container } = renderRail()
    simulateLayout(container)
    expect(arrows(container).previous).toBeDisabled()
    expect(arrows(container).next).toBeEnabled()
  })

  it('en bout de piste : « précédent » actif, « suivant » désactivé', () => {
    const { container } = renderRail()
    simulateLayout(container, { scrollLeft: 500 })
    expect(arrows(container).previous).toBeEnabled()
    expect(arrows(container).next).toBeDisabled()
  })

  it('un clic avance d\'UN élément, pas d\'une page entière', async () => {
    const { container } = renderRail()
    const { track } = simulateLayout(container)

    await userEvent.click(arrows(container).next)

    expect(track.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: ITEM_WIDTH + GAP, behavior: 'smooth' })
    )
  })

  it('« précédent » recule du même pas', async () => {
    const { container } = renderRail()
    const { track } = simulateLayout(container, { scrollLeft: 500 })

    await userEvent.click(arrows(container).previous)

    expect(track.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: -(ITEM_WIDTH + GAP), behavior: 'smooth' })
    )
  })

  it('ne montre JAMAIS un élément à moitié : la piste tient un multiple exact du pas', () => {
    const { container } = renderRail()
    // 700 de large, moins 88 de flèches = 612 utiles. Pas = 216.
    // Deux éléments entiers tiennent (2 × 216 - 16 = 416), un troisième déborderait.
    const { track } = simulateLayout(container, { viewportWidth: 700 })
    expect(track.style.maxWidth).toBe('416px')
  })

  it('recalcule la largeur quand la place disponible change', () => {
    const { container } = renderRail()
    const { track } = simulateLayout(container, { viewportWidth: 1200 })
    // 1200 - 88 = 1112 utiles : cinq éléments entiers (5 × 216 - 16 = 1064).
    expect(track.style.maxWidth).toBe('1064px')
  })

  it('garde au moins un élément visible sur une fenêtre étroite', () => {
    const { container } = renderRail()
    const { track } = simulateLayout(container, { viewportWidth: 120 })
    expect(track.style.maxWidth).toBe(`${ITEM_WIDTH}px`)
  })
})
