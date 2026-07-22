import type { ReactNode } from 'react'

interface Props {
  number: number
  caption: string
  children: ReactNode
}

/**
 * Cadre « écran mobile » d'un pas du parcours patient (aperçu praticien, lecture
 * seule) : une vignette numérotée et légendée, contenu statique de démonstration.
 */
export function DefusionScreenCard({ number, caption, children }: Props) {
  return (
    <article className="dpv-screen">
      <div className="dpv-screen__frame">{children}</div>
      <div className="dpv-screen__caption">
        <span className="dpv-screen__num">{number}</span>
        <span className="dpv-screen__label">{caption}</span>
      </div>
    </article>
  )
}
