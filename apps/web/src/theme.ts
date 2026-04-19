import { colors, spacing, radius, fontSize } from '@psytool/shared'

export { colors, spacing, radius, fontSize }

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.1)',
} as const

export const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export function injectTheme(): void {
  const root = document.documentElement.style
  root.setProperty('--color-primary', colors.primary)
  root.setProperty('--color-primary-light', colors.primaryLight)
  root.setProperty('--color-danger', colors.danger)
  root.setProperty('--color-danger-light', colors.dangerLight)
  root.setProperty('--color-success', colors.success)
  root.setProperty('--color-success-light', colors.successLight)
  root.setProperty('--color-warning', colors.warning)
  root.setProperty('--color-bg', colors.background)
  root.setProperty('--color-surface', colors.card)
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

  root.setProperty('--font-size-caption', `${fontSize.caption}px`)
  root.setProperty('--font-size-body', `${fontSize.body}px`)
  root.setProperty('--font-size-h3', `${fontSize.h3}px`)
  root.setProperty('--font-size-h2', `${fontSize.h2}px`)
  root.setProperty('--font-size-h1', `${fontSize.h1}px`)

  root.setProperty('--shadow-sm', shadows.sm)
  root.setProperty('--shadow-md', shadows.md)
  root.setProperty('--shadow-lg', shadows.lg)
}
