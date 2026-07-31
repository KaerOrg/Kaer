import { useCallback, useEffect, useRef, useState } from 'react'

// Mécanique d'un rail horizontal parcouru à la flèche.
//
// Deux partis pris, tous deux issus d'un essai en conditions réelles :
//
// 1. On avance d'UN élément par clic. Une barre de défilement demande de viser un
//    curseur de quelques pixels puis de le faire glisser : ce n'est pas un geste
//    qu'on fait en consultation, en parlant à quelqu'un.
// 2. On ne montre JAMAIS un élément à moitié. Un bout de carte qui dépasse au bord
//    droit pollue la lecture sans rien apprendre. La largeur du rail est donc bornée
//    à un multiple exact du pas, et le reste de la place va aux flèches.
//
// Le pas est MESURÉ sur le rendu réel plutôt que codé en dur : changer la largeur
// des éléments dans le CSS n'oblige à toucher à rien ici.

/** Marge de tolérance, en pixels : un défilement ne retombe jamais pile sur l'entier. */
const EDGE_TOLERANCE = 4

export interface RailPaging {
  /** À poser sur le conteneur qui borne la place disponible. */
  readonly viewportRef: React.RefObject<HTMLDivElement | null>
  /** À poser sur la piste qui défile. */
  readonly railRef: React.RefObject<HTMLDivElement | null>
  /** Largeur maximale de la piste : un multiple exact du pas. `undefined` tant que rien n'est mesuré. */
  readonly railMaxWidth: number | undefined
  readonly canGoPrevious: boolean
  readonly canGoNext: boolean
  readonly goPrevious: () => void
  readonly goNext: () => void
}

/** Largeur d'un élément + sa gouttière, et la gouttière seule, mesurées au rendu. */
function measureStep(rail: HTMLDivElement): { step: number; gap: number } | null {
  const first = rail.firstElementChild
  if (!(first instanceof HTMLElement) || first.offsetWidth === 0) return null
  const gap = Number.parseFloat(getComputedStyle(rail).columnGap || '0') || 0
  return { step: first.offsetWidth + gap, gap }
}

/**
 * @param itemCount nombre d'éléments affichés : le rail revient au début quand la
 *   liste change, sinon on resterait à une position qui n'existe plus.
 */
export function useRailPaging(itemCount: number): RailPaging {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)
  const [railMaxWidth, setRailMaxWidth] = useState<number | undefined>(undefined)
  const [canGoPrevious, setCanGoPrevious] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)

  const refreshArrows = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const maxScroll = rail.scrollWidth - rail.clientWidth
    setCanGoPrevious(rail.scrollLeft > EDGE_TOLERANCE)
    setCanGoNext(rail.scrollLeft < maxScroll - EDGE_TOLERANCE)
  }, [])

  // Largeur de la piste = le plus grand multiple du pas qui tient dans la place
  // disponible. La mesure porte sur la BOÎTE DE CONTENU du conteneur, qui ne dépend
  // pas de la largeur qu'on va poser : pas de boucle de recalcul.
  const fitToWholeItems = useCallback(() => {
    const viewport = viewportRef.current
    const rail = railRef.current
    if (!viewport || !rail) return
    const measured = measureStep(rail)
    if (!measured) return

    const style = getComputedStyle(viewport)
    const available = viewport.clientWidth
      - (Number.parseFloat(style.paddingLeft) || 0)
      - (Number.parseFloat(style.paddingRight) || 0)

    const fitting = Math.max(1, Math.floor((available + measured.gap) / measured.step))
    setRailMaxWidth(fitting * measured.step - measured.gap)
  }, [])

  const refresh = useCallback(() => {
    fitToWholeItems()
    refreshArrows()
  }, [fitToWholeItems, refreshArrows])

  // La liste a changé (filtre, chargement) : on repart du premier élément.
  useEffect(() => {
    const rail = railRef.current
    if (rail) rail.scrollLeft = 0
    refresh()
  }, [itemCount, refresh])

  useEffect(() => {
    const rail = railRef.current
    const viewport = viewportRef.current
    if (!rail || !viewport) return
    rail.addEventListener('scroll', refreshArrows, { passive: true })
    // Le rail vit souvent dans une modale : sa largeur change à l'ouverture et au
    // redimensionnement, la taille et l'état des flèches doivent suivre.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh)
    observer?.observe(viewport)
    return () => {
      rail.removeEventListener('scroll', refreshArrows)
      observer?.disconnect()
    }
  }, [refresh, refreshArrows])

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const measured = measureStep(rail)
    rail.scrollBy({ left: direction * (measured?.step ?? rail.clientWidth), behavior: 'smooth' })
  }, [])

  const goPrevious = useCallback(() => scrollByStep(-1), [scrollByStep])
  const goNext = useCallback(() => scrollByStep(1), [scrollByStep])

  return { viewportRef, railRef, railMaxWidth, canGoPrevious, canGoNext, goPrevious, goNext }
}
