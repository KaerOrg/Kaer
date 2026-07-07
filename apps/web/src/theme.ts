import { colors, spacing, radius, fontSize } from '@kaer/shared'

export { colors, spacing, radius, fontSize }

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.1)',
} as const

export const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

/**
 * Métriques partagées de tous les contrôles de formulaire (InputField, Dropdown,
 * SearchInput). Source unique : un champ et une liste déroulante côte à côte doivent
 * avoir la MÊME hauteur. Deux tailles seulement — défaut et `sm` (barres de filtres) —
 * pilotées par ces tokens, jamais redéfinies en dur dans un CSS de composant.
 * `iconRoom` = espace horizontal réservé à un ornement (loupe, chevron) au-delà du
 * padding texte.
 */
export const control = {
  paddingY: 10,
  paddingX: 14,
  fontSize: 15,
  paddingYSm: 7,
  paddingXSm: 12,
  fontSizeSm: 14,
  iconRoom: 22,
} as const

export function injectTheme(): void {
  const root = document.documentElement.style
  root.setProperty('--color-primary', colors.primary)
  root.setProperty('--color-primary-light', colors.primaryLight)
  root.setProperty('--color-danger', colors.danger)
  root.setProperty('--color-danger-light', colors.dangerLight)
  root.setProperty('--color-success', colors.success)
  root.setProperty('--color-success-light', colors.successLight)
  root.setProperty('--color-warning', colors.warning)
  root.setProperty('--color-warning-light', colors.warningLight)
  root.setProperty('--color-stars', colors.stars)
  root.setProperty('--color-bg', colors.background)
  root.setProperty('--color-surface', colors.card)
  root.setProperty('--color-card', colors.card)
  root.setProperty('--color-border', colors.border)
  root.setProperty('--color-text', colors.text)
  root.setProperty('--color-text-muted', colors.textMuted)

  root.setProperty('--spacing-xs', `${spacing.xs}px`)
  root.setProperty('--spacing-sm', `${spacing.sm}px`)
  root.setProperty('--spacing-md', `${spacing.md}px`)
  root.setProperty('--spacing-lg', `${spacing.lg}px`)
  root.setProperty('--spacing-xl', `${spacing.xl}px`)

  root.setProperty('--radius-sm', `${radius.sm}px`)
  root.setProperty('--radius-md', `${radius.md}px`)
  root.setProperty('--radius-lg', `${radius.lg}px`)
  root.setProperty('--radius-full', `${radius.full}px`)

  root.setProperty('--font-size-caption', `${fontSize.caption}px`)
  root.setProperty('--font-size-body', `${fontSize.body}px`)
  root.setProperty('--font-size-h3', `${fontSize.h3}px`)
  root.setProperty('--font-size-h2', `${fontSize.h2}px`)
  root.setProperty('--font-size-h1', `${fontSize.h1}px`)

  root.setProperty('--shadow-sm', shadows.sm)
  root.setProperty('--shadow-md', shadows.md)
  root.setProperty('--shadow-lg', shadows.lg)

  root.setProperty('--control-pad-y', `${control.paddingY}px`)
  root.setProperty('--control-pad-x', `${control.paddingX}px`)
  root.setProperty('--control-font-size', `${control.fontSize}px`)
  root.setProperty('--control-pad-y-sm', `${control.paddingYSm}px`)
  root.setProperty('--control-pad-x-sm', `${control.paddingXSm}px`)
  root.setProperty('--control-font-size-sm', `${control.fontSizeSm}px`)
  root.setProperty('--control-icon-room', `${control.iconRoom}px`)
}
