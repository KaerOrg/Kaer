import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import './Drawer.css'

interface DrawerProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Élément affiché juste après le titre, dans l'en-tête (ex. bouton favoris). */
  titleAccessory?: ReactNode
  /** Actions affichées dans l'en-tête, avant la croix de fermeture (slot générique). */
  headerActions?: ReactNode
  footer?: ReactNode
  noPadding?: boolean
  /** Largeur initiale du panneau en px. */
  width?: number
  /** Largeur minimale au redimensionnement. */
  minWidth?: number
  /** Largeur maximale au redimensionnement. */
  maxWidth?: number
  /** Désactive la poignée de redimensionnement. */
  resizable?: boolean
  /** Clé `localStorage` : si fournie, la largeur redimensionnée est mémorisée et restaurée. */
  storageKey?: string
  /** Décale le haut de l'overlay (px) : laisse visible/cliquable un header fixe au-dessus. */
  topOffset?: number
}

const DEFAULT_WIDTH = 460
const DEFAULT_MIN_WIDTH = 360
const DEFAULT_MAX_WIDTH = 900
const KEYBOARD_STEP = 24

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.min(max, window.innerWidth - 80))

function readStoredWidth(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeStoredWidth(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(Math.round(value)))
  } catch {
    // localStorage indisponible (mode privé, quota) : on ignore silencieusement.
  }
}

/**
 * Panneau latéral coulissant (côté droit) du design system — overlay assombri,
 * fermeture sur `Échap`, clic sur l'overlay ou la croix. Même grammaire que
 * `Modal` (titre, sous-titre, icône, footer) mais ancré pleine hauteur à droite,
 * pour afficher le détail d'un élément sans quitter la vue d'ensemble.
 *
 * Redimensionnable par défaut : poignée sur le bord gauche (drag souris) ou flèches
 * gauche/droite au clavier quand la poignée a le focus.
 *
 * Animé à l'ouverture (glissement depuis la droite) et à la fermeture (animation de
 * sortie puis `onClose` à la fin via `animationend`) ; `prefers-reduced-motion` ferme
 * immédiatement.
 */
export function Drawer({
  title,
  subtitle,
  icon,
  onClose,
  children,
  titleAccessory,
  headerActions,
  footer,
  noPadding,
  width = DEFAULT_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  resizable = true,
  storageKey,
  topOffset,
}: DrawerProps) {
  // Largeur initiale : valeur mémorisée si `storageKey` fourni, sinon la prop `width`.
  const [panelWidth, setPanelWidth] = useState(() => {
    if (storageKey) {
      const saved = readStoredWidth(storageKey)
      if (saved !== null) return clamp(saved, minWidth, maxWidth)
    }
    return width
  })
  const draggingRef = useRef(false)
  // Dernière largeur connue, pour persister en fin d'interaction sans closure périmée.
  // Synchronisé en effet (jamais pendant le render : on ne mute pas une ref au render).
  const widthRef = useRef(panelWidth)
  useEffect(() => { widthRef.current = panelWidth }, [panelWidth])

  const persist = useCallback(() => {
    if (storageKey) writeStoredWidth(storageKey, widthRef.current)
  }, [storageKey])

  // Fermeture animée : on joue l'animation de sortie, puis on notifie le parent
  // (qui démonte) à la fin de l'animation. En `prefers-reduced-motion`, l'animation
  // est désactivée (donc `animationend` ne se déclenche pas) → on ferme tout de suite.
  const [closing, setClosing] = useState(false)
  const requestClose = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
  }, [onClose])

  const handleAnimationEnd = useCallback(() => {
    if (closing) onClose()
  }, [closing, onClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [requestClose])

  // Le drag se gère via des listeners document (le curseur peut sortir du panneau
  // pendant le glissement) ; `draggingRef` évite de recalculer hors session de drag.
  // La largeur n'est persistée qu'au relâchement (pas à chaque frame de glissement).
  useEffect(() => {
    if (!resizable) return
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      setPanelWidth(clamp(window.innerWidth - e.clientX, minWidth, maxWidth))
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.classList.remove('drawer-resizing')
      persist()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [resizable, minWidth, maxWidth, persist])

  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.classList.add('drawer-resizing')
  }, [])

  const onHandleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const delta = e.key === 'ArrowLeft' ? KEYBOARD_STEP : e.key === 'ArrowRight' ? -KEYBOARD_STEP : 0
      if (delta === 0) return
      e.preventDefault()
      setPanelWidth(prev => {
        const next = clamp(prev + delta, minWidth, maxWidth)
        if (storageKey) writeStoredWidth(storageKey, next)
        return next
      })
    },
    [minWidth, maxWidth, storageKey]
  )

  return (
    <div
      className={`drawer-overlay${closing ? ' drawer-overlay--closing' : ''}`}
      style={topOffset !== undefined ? { top: topOffset } : undefined}
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`drawer${closing ? ' drawer--closing' : ''}`}
        style={{ width: panelWidth }}
        onClick={stopPropagation}
        onAnimationEnd={handleAnimationEnd}
      >
        {resizable && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionner le panneau"
            tabIndex={0}
            className="drawer__resize-handle"
            onMouseDown={startResize}
            onKeyDown={onHandleKeyDown}
          />
        )}

        <div className="drawer__header">
          <div className="drawer__header-left">
            {icon && <span className="drawer__icon">{icon}</span>}
            <div className="drawer__title-block">
              <h2 id="drawer-title" className="drawer__title">{title}</h2>
              {subtitle && <p className="drawer__subtitle">{subtitle}</p>}
            </div>
            {titleAccessory}
          </div>
          <div className="drawer__header-right">
            {headerActions}
            <button className="drawer__close" onClick={requestClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={`drawer__body${noPadding ? ' drawer__body--no-padding' : ''}`}>
          {children}
        </div>

        {footer && (
          <div className="drawer__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
