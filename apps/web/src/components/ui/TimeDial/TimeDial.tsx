import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import './TimeDial.css'
import {
  clampInt,
  joinMinutes,
  markerPosition,
  minutesToHHMM,
  minutesToTurn,
  pad2,
  pointerToMinutes,
  splitMinutes,
} from './time'

export interface TimeDialProps {
  /** Heure en minutes depuis minuit (0–1439). Source de vérité unique, contrôlé. */
  minutes: number
  onChange: (minutes: number) => void
  /**
   * Pas d'aimantation appliqué au **glisser** du repère et aux flèches clavier sur
   * le repère (défaut 15 min). La saisie clavier dans les champs reste libre (00–59).
   */
  dragStepMinutes?: number
  /** Petit titre au-dessus des chiffres (ex. « Rappel à »). */
  title?: ReactNode
  /** Légende sous les chiffres, dérivée de l'heure par l'appelant (ex. « du matin »). */
  caption?: ReactNode
  /** Indice sous le cadran (ex. « Glissez le repère, pas de 15 min »). */
  hint?: ReactNode
  /** Libellé accessible du champ heures. */
  hoursLabel: string
  /** Libellé accessible du champ minutes. */
  minutesLabel: string
  /** Libellé accessible du repère (rôle slider). */
  markerLabel: string
  /** Couleur d'accent de l'arc et du repère. Défaut : accent primaire du thème. */
  accentColor?: string
  /** Diamètre du cadran en px (défaut 240). */
  size?: number
  className?: string
}

const DEFAULT_ACCENT = 'var(--color-primary)'
/** Épaisseur de l'anneau, en px. DOIT rester égale à `inset` de `.time-dial__hole`. */
const RING_THICKNESS = 16

/**
 * Cadran horaire radial 24 h : un anneau dont l'arc teal est proportionnel à l'heure,
 * un repère déplaçable au pointeur (aimanté au pas) et deux champs saisissables au
 * centre (heures `:` minutes). Source de vérité unique : les minutes depuis minuit —
 * l'arc, l'angle du repère et les champs en dérivent.
 *
 * Primitive pur du design system : ne connaît aucun métier ni i18n. Tous les libellés
 * (titre, légende, indice, libellés a11y) sont fournis déjà traduits par l'appelant.
 */
export function TimeDial({
  minutes,
  onChange,
  dragStepMinutes = 15,
  title,
  caption,
  hint,
  hoursLabel,
  minutesLabel,
  markerLabel,
  accentColor = DEFAULT_ACCENT,
  size = 240,
  className = '',
}: TimeDialProps) {
  const radius = size / 2
  const dialRef = useRef<HTMLDivElement>(null)
  const minutesInputRef = useRef<HTMLInputElement>(null)

  // Champs affichés en texte libre pendant la frappe ; resynchronisés depuis `minutes`
  // uniquement quand la valeur change de l'EXTÉRIEUR (glisser, parent), pas quand c'est
  // notre propre émission — `lastEmitted` distingue les deux et évite le reformatage
  // du texte en cours de saisie.
  const [hoursText, setHoursText] = useState(() => pad2(splitMinutes(minutes).hours))
  const [minutesText, setMinutesText] = useState(() => pad2(splitMinutes(minutes).minutes))
  const lastEmitted = useRef(minutes)

  useEffect(() => {
    if (minutes === lastEmitted.current) return
    lastEmitted.current = minutes
    const p = splitMinutes(minutes)
    setHoursText(pad2(p.hours))
    setMinutesText(pad2(p.minutes))
  }, [minutes])

  // Émission depuis la FRAPPE : marque `lastEmitted` pour que l'effet NE reformate PAS
  // le texte en cours de saisie (l'utilisateur garde son texte brut jusqu'au blur).
  const emitTyped = useCallback((m: number) => {
    lastEmitted.current = m
    onChange(m)
  }, [onChange])

  const handleHoursChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2)
      setHoursText(digits)
      const h = clampInt(Number(digits || 0), 0, 23)
      emitTyped(joinMinutes(h, Number(minutesText || 0)))
      // Passage auto aux minutes dès 2 chiffres, ou dès un 1er chiffre > 2 (qui ne
      // peut être qu'une heure complète : 3–9).
      if (digits.length === 2 || (digits.length === 1 && Number(digits) > 2)) {
        minutesInputRef.current?.focus()
        minutesInputRef.current?.select()
      }
    },
    [emitTyped, minutesText],
  )

  const handleMinutesChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 2)
      setMinutesText(digits)
      const m = clampInt(Number(digits || 0), 0, 59)
      emitTyped(joinMinutes(Number(hoursText || 0), m))
    },
    [emitTyped, hoursText],
  )

  // À la perte de focus, refléter la valeur committée, complétée à deux chiffres.
  const handleBlur = useCallback(() => {
    const p = splitMinutes(minutes)
    setHoursText(pad2(p.hours))
    setMinutesText(pad2(p.minutes))
  }, [minutes])

  const selectOnFocus = useCallback((e: { currentTarget: HTMLInputElement }) => {
    e.currentTarget.select()
  }, [])

  // Glisser du repère : écoute pointermove/up au niveau document (pour ne pas perdre
  // le geste si le pointeur sort du cadran). L'AbortController retire les deux écouteurs
  // d'un coup au relâchement (pointerup) ou au démontage — sans handler auto-référent.
  const dragAbort = useRef<AbortController | null>(null)

  // Glisser et flèches : `onChange` direct SANS marquer `lastEmitted`, pour que l'effet
  // resynchronise les champs texte (l'heure affichée suit le geste en direct).
  const handlePointerMove = useCallback(
    (e: globalThis.PointerEvent) => {
      const el = dialRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      onChange(pointerToMinutes(e.clientX - cx, e.clientY - cy, dragStepMinutes))
    },
    [onChange, dragStepMinutes],
  )

  const handleMarkerPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragAbort.current?.abort()
      const ctrl = new AbortController()
      dragAbort.current = ctrl
      document.addEventListener('pointermove', handlePointerMove, { signal: ctrl.signal })
      document.addEventListener('pointerup', () => ctrl.abort(), { signal: ctrl.signal })
    },
    [handlePointerMove],
  )

  useEffect(() => () => dragAbort.current?.abort(), [])

  const handleMarkerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let next: number | null = null
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = minutes + dragStepMinutes
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = minutes - dragStepMinutes
      else if (e.key === 'Home') next = 0
      if (next === null) return
      e.preventDefault()
      onChange(((next % 1440) + 1440) % 1440)
    },
    [onChange, minutes, dragStepMinutes],
  )

  const turn = minutesToTurn(minutes)
  // Repère centré sur la bande de l'anneau : rayon d'orbite = rayon extérieur moins la
  // moitié de l'épaisseur de l'anneau (le hole a `inset: RING_THICKNESS` en CSS).
  const marker = markerPosition(minutes, radius, radius - RING_THICKNESS / 2)

  const ringStyle: CSSProperties = {
    background: `conic-gradient(from 0deg, ${accentColor} 0 ${turn}turn, var(--color-border) ${turn}turn 1turn)`,
  }
  const markerStyle: CSSProperties = {
    left: marker.x,
    top: marker.y,
    borderColor: accentColor,
  }

  return (
    <div className={`time-dial ${className}`} style={{ width: size, height: size }}>
      <div ref={dialRef} className="time-dial__ring" style={ringStyle}>
        <div className="time-dial__hole">
          {title != null ? <span className="time-dial__title">{title}</span> : null}
          <span className="time-dial__inputs">
            <input
              className="time-dial__input"
              inputMode="numeric"
              maxLength={2}
              value={hoursText}
              onChange={e => handleHoursChange(e.target.value)}
              onFocus={selectOnFocus}
              onBlur={handleBlur}
              aria-label={hoursLabel}
            />
            <span className="time-dial__colon" aria-hidden>:</span>
            <input
              ref={minutesInputRef}
              className="time-dial__input"
              inputMode="numeric"
              maxLength={2}
              value={minutesText}
              onChange={e => handleMinutesChange(e.target.value)}
              onFocus={selectOnFocus}
              onBlur={handleBlur}
              aria-label={minutesLabel}
            />
          </span>
          {caption != null ? (
            <span className="time-dial__caption" style={{ color: accentColor }}>{caption}</span>
          ) : null}
        </div>
        <div
          className="time-dial__marker"
          style={markerStyle}
          role="slider"
          tabIndex={0}
          aria-label={markerLabel}
          aria-valuemin={0}
          aria-valuemax={1439}
          aria-valuenow={minutes}
          aria-valuetext={minutesToHHMM(minutes)}
          onPointerDown={handleMarkerPointerDown}
          onKeyDown={handleMarkerKeyDown}
        />
      </div>
      {hint != null ? <p className="time-dial__hint">{hint}</p> : null}
    </div>
  )
}
