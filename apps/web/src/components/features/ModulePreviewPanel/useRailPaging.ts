import { useCallback, useEffect, useRef, useState } from 'react'

// Défilement du rail écran par écran.
//
// Une barre de défilement horizontale est un mauvais contrôle ici : en séance, le
// praticien veut avancer d'un écran, pas viser un curseur de quelques pixels. Deux
// flèches font le travail, et le geste à la souris ou au pavé tactile reste possible
// pour qui le préfère.
//
// Le pas est MESURÉ sur la première vignette plutôt que codé en dur : si la largeur
// des cartes change dans le CSS, le défilement suit sans qu'on y pense.

/** Marge de tolérance, en pixels : un scroll ne retombe jamais pile sur l'entier. */
const EDGE_TOLERANCE = 4

export interface RailPaging {
  readonly railRef: React.RefObject<HTMLDivElement | null>
  readonly canGoPrevious: boolean
  readonly canGoNext: boolean
  readonly goPrevious: () => void
  readonly goNext: () => void
}

/**
 * @param itemCount nombre d'écrans affichés : le défilement se remet à zéro quand le
 *   filtre change, sinon on resterait à une position qui n'existe plus.
 */
export function useRailPaging(itemCount: number): RailPaging {
  const railRef = useRef<HTMLDivElement | null>(null)
  const [canGoPrevious, setCanGoPrevious] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)

  const refresh = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const maxScroll = rail.scrollWidth - rail.clientWidth
    setCanGoPrevious(rail.scrollLeft > EDGE_TOLERANCE)
    setCanGoNext(rail.scrollLeft < maxScroll - EDGE_TOLERANCE)
  }, [])

  // Le filtre a changé : on repart du premier écran du sous-ensemble.
  useEffect(() => {
    const rail = railRef.current
    if (rail) rail.scrollLeft = 0
    refresh()
  }, [itemCount, refresh])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    rail.addEventListener('scroll', refresh, { passive: true })
    // Le rail vit dans une modale : sa largeur change quand elle s'ouvre ou se
    // redimensionne, et l'état des flèches doit suivre.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh)
    observer?.observe(rail)
    return () => {
      rail.removeEventListener('scroll', refresh)
      observer?.disconnect()
    }
  }, [refresh])

  /** Largeur d'un écran + sa gouttière, mesurée sur le rendu réel. */
  const stepWidth = useCallback((rail: HTMLDivElement): number => {
    const first = rail.firstElementChild
    if (!(first instanceof HTMLElement)) return rail.clientWidth
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || '0') || 0
    return first.offsetWidth + gap
  }, [])

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * stepWidth(rail), behavior: 'smooth' })
  }, [stepWidth])

  const goPrevious = useCallback(() => scrollByStep(-1), [scrollByStep])
  const goNext = useCallback(() => scrollByStep(1), [scrollByStep])

  return { railRef, canGoPrevious, canGoNext, goPrevious, goNext }
}
