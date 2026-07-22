import type { ReactNode } from 'react'

interface Props {
  number: number
  caption: string
  children: ReactNode
}

/**
 * Vignette « écran mobile » d'un pas du parcours patient (aperçu praticien, lecture
 * seule) : le contenu d'écran statique + une légende « N · libellé » sous la carte.
 */
export function DefusionScreenCard({ number, caption, children }: Props) {
  return (
    <article className="dpv-screen">
      <div className="dpv-screen__frame">{children}</div>
      <div className="dpv-screen__caption">{number} · {caption}</div>
    </article>
  )
}
