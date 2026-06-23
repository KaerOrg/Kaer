import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './Tooltip.css'

/** Délai avant apparition au survol, bien plus court que l'attribut `title` natif. */
const SHOW_DELAY_MS = 120

type TooltipPosition = { readonly x: number; readonly y: number }

interface TooltipProps {
  /** Texte affiché dans l'infobulle. */
  readonly label: string
  /** Élément déclencheur (survolé ou focalisé). */
  readonly children: ReactNode
}

/**
 * Infobulle légère rendue en **portail** (`document.body`) : elle échappe ainsi au
 * `overflow` des conteneurs scrollables (ex. la matrice « Ma file active ») qui
 * couperaient un tooltip CSS classique. Apparaît après un court délai
 * (`SHOW_DELAY_MS`) au survol ou au focus du déclencheur, contrairement à l'attribut
 * `title` natif (~1 s, non configurable).
 *
 * L'accessibilité reste portée par le déclencheur lui-même (`aria-label`) : ce
 * composant n'est qu'une aide visuelle rapide, jamais l'unique nom accessible.
 */
export function Tooltip({ label, children }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [coords, setCoords] = useState<TooltipPosition | null>(null)

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Coordonnées viewport → l'infobulle est positionnée en `position: fixed`.
      setCoords({ x: rect.left + rect.width / 2, y: rect.top })
    }, SHOW_DELAY_MS)
  }, [])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCoords(null)
  }, [])

  // Purge du timer en attente si le composant se démonte pendant le délai.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const style = coords ? { left: coords.x, top: coords.y } : undefined

  return (
    <span
      ref={triggerRef}
      className="tooltip-trigger"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {coords
        ? createPortal(
            <span className="tooltip" role="tooltip" style={style}>
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  )
}
