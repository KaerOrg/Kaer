import { useCallback, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CollapsibleProps } from './Collapsible.types'
import './Collapsible.css'

/**
 * Section repliable du design system : un en-tête cliquable qui révèle son contenu.
 *
 * Le `<button>` natif de l'en-tête est celui du primitive lui-même : c'est un
 * contrôle de divulgation (`aria-expanded` + `aria-controls`), pas un bouton
 * d'action, et il porte une surface entière (titre + complément + chevron) que
 * `ui/Button` ne sait pas exprimer.
 *
 * Le contenu n'est pas monté tant que la section est repliée : une section lourde
 * (table de croisement, longue liste) ne coûte rien tant qu'on ne l'ouvre pas.
 */
export function Collapsible({
  title,
  meta,
  children,
  defaultOpen = false,
  className = '',
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const toggle = useCallback(() => setOpen(previous => !previous), [])

  return (
    <section className={`collapsible ${open ? 'collapsible--open' : ''} ${className}`}>
      <button
        type="button"
        className="collapsible__head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className="collapsible__title">{title}</span>
        {meta ? <span className="collapsible__meta">{meta}</span> : null}
        <ChevronDown className="collapsible__chevron" size={18} aria-hidden="true" />
      </button>
      <div className="collapsible__panel" id={panelId} hidden={!open}>
        {open ? children : null}
      </div>
    </section>
  )
}
