import { useMemo, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../Button'
import { useRailPaging } from './useRailPaging'
import './ScrollRail.css'

/**
 * Rangée horizontale parcourue à la **flèche**, jamais à la barre de défilement.
 *
 * Une barre de défilement demande de viser un curseur de quelques pixels puis de le
 * faire glisser : ce n'est pas un geste qu'on fait en consultation. Deux flèches
 * encadrent la piste, avancent d'un élément par clic et se désactivent aux
 * extrémités. Le glissement souris et pavé tactile reste actif, il n'est simplement
 * plus le contrôle principal.
 *
 * La piste est bornée à un **multiple exact** de la largeur d'un élément : aucun
 * élément n'est jamais montré à moitié.
 *
 * Présentationnel : aucune connaissance métier. Les éléments viennent de l'appelant.
 */
export interface ScrollRailProps {
  readonly children: ReactNode
  /**
   * Nombre d'éléments rendus. Sert à revenir au début quand la liste change
   * (filtre, chargement) : rester à une position qui n'existe plus n'a aucun sens.
   */
  readonly itemCount: number
  /** Classe posée sur le conteneur, pour scoper gouttière et calage des flèches. */
  readonly className?: string
}

export function ScrollRail({
  children, itemCount, className = '',
}: ScrollRailProps) {
  const { viewportRef, railRef, railMaxWidth, canGoPrevious, canGoNext, goPrevious, goNext } =
    useRailPaging(itemCount)

  // Calcul dynamique : la largeur dépend de la place réellement disponible.
  const trackStyle = useMemo(
    () => (railMaxWidth != null ? { maxWidth: railMaxWidth } : undefined),
    [railMaxWidth],
  )

  return (
    <div className={`scroll-rail ${className}`} ref={viewportRef}>
      <Button
        variant="ghost"
        className="scroll-rail__arrow scroll-rail__arrow--previous"
        icon={<ChevronLeft size={18} />}
        onClick={goPrevious}
        disabled={!canGoPrevious}
      />

      <div className="scroll-rail__track" ref={railRef} style={trackStyle}>
        {children}
      </div>

      <Button
        variant="ghost"
        className="scroll-rail__arrow scroll-rail__arrow--next"
        icon={<ChevronRight size={18} />}
        onClick={goNext}
        disabled={!canGoNext}
      />
    </div>
  )
}
