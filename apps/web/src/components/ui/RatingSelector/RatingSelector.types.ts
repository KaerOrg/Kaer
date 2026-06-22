/** Habillages disponibles — pendant web exact du `RatingSelector` mobile. */
export type RatingSelectorVariant = 'numbered' | 'track' | 'icon' | 'bar'

/** Icônes de la variante `icon`. */
export type RatingSelectorIcon = 'star' | 'sun'

/** Disposition de la variante `bar`. */
export type RatingSelectorBarLayout = 'stacked' | 'inline'

interface RatingSelectorCommon {
  /** Libellé de la dimension — sert aussi de base à l'accessibilité. */
  label: string
  /** Sous-libellé optionnel (ex. « 0 = aucun effort »). */
  sublabel?: string
  /** Couleur d'accent (token CSS). Défaut : var(--color-primary). */
  color?: string
  /** false → masque l'en-tête label/valeur. Défaut true. */
  showHeader?: boolean
  /** Repères textuels d'extrémité (bas / haut). */
  lowHint?: string
  highHint?: string
  /** Suffixe collé à la valeur dans l'en-tête (ex. '%', '/10'). */
  valueSuffix?: string
  className?: string
}

/**
 * Variantes discrètes (`numbered` / `track` / `icon`) : sélection sur un jeu de
 * pas. `onChange` optionnel — absent = affichage en lecture seule.
 */
export interface RatingSelectorSteppedProps extends RatingSelectorCommon {
  variant?: 'numbered' | 'track' | 'icon'
  /** Valeurs disponibles, dans l'ordre d'affichage. */
  steps: number[]
  /** Valeur sélectionnée. null = aucune sélection visible. */
  value: number | null
  /** Icône de la variante `icon` (défaut 'star'). */
  icon?: RatingSelectorIcon
  /** Taille des icônes de la variante `icon` en px (défaut 28). */
  iconSize?: number
  /** Sélection. Absent → rendu non interactif (lecture seule). */
  onChange?: (value: number) => void
  /** Préfixe de testId : chaque pas expose `${testIdPrefix}-${valeur}`. */
  testIdPrefix?: string
}

/**
 * Variante continue (`bar`) : jauge remplie dans [min, max]. Absorbe l'ancien
 * `ValueBar`. Présentationnelle — pas de saisie.
 */
export interface RatingSelectorBarProps extends RatingSelectorCommon {
  variant: 'bar'
  /** Valeur affichée et positionnée sur la jauge. */
  value: number
  /** Bornes de l'échelle (défaut 1–10). */
  min?: number
  max?: number
  /** Repère textuel central optionnel (entre lowHint et highHint). */
  midHint?: string
  /** 'stacked' (défaut) : en-tête au-dessus, jauge dessous. 'inline' : label, jauge et valeur sur une ligne. */
  layout?: RatingSelectorBarLayout
}

export type RatingSelectorProps = RatingSelectorSteppedProps | RatingSelectorBarProps

/** Garde de type — évite tout cast pour discriminer l'union. */
export function isBarProps(props: RatingSelectorProps): props is RatingSelectorBarProps {
  return props.variant === 'bar'
}
