import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  badge?: number
  icon?: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  /**
   * - `horizontal` : barre d'onglets pleine taille (navigation praticien).
   * - `vertical` : navigation latérale (sidebar).
   * - `compact` : barre d'onglets dense pour les aperçus mobile-mock du panneau
   *   module (13px, soulignement fin) — remplace les onglets faits main des layouts.
   */
  variant?: 'horizontal' | 'vertical' | 'compact'
  className?: string
  /** Couleur d'accent de l'onglet actif (texte + bordure). Défaut : var(--color-primary) via CSS. */
  accentColor?: string
}
