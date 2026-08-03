import { memo, useCallback, useMemo, type CSSProperties } from 'react'
import { accessibleTextColor } from '../../../lib/accessibleColor'
import type { TabItem } from './Tabs.types'

export interface TabButtonProps {
  tab: TabItem
  isActive: boolean
  accentColor?: string
  iconOnly?: boolean
  onSelect: (id: string) => void
}

/** Un onglet de `Tabs`. Mémoïsé : callback et style figés (zéro déclaration inline). */
function TabButtonComponent({ tab, isActive, accentColor, iconOnly = false, onSelect }: TabButtonProps) {
  const handleClick = useCallback(() => onSelect(tab.id), [tab.id, onSelect])

  // Le filet garde l'accent brut (identité du module) ; le LIBELLÉ passe par une
  // variante assombrie quand l'accent échoue le ratio AA sur fond blanc. Plusieurs
  // accents du catalogue sont dans ce cas (l'orange #F97316 tombe à 2,9:1).
  const style = useMemo<CSSProperties | undefined>(
    () => (isActive && accentColor
      ? { color: accessibleTextColor(accentColor), borderColor: accentColor }
      : undefined),
    [isActive, accentColor]
  )

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={iconOnly ? tab.label : undefined}
      title={iconOnly ? tab.label : undefined}
      className={`tabs__item ${iconOnly ? 'tabs__item--icon-only' : ''} ${isActive ? 'tabs__item--active' : ''}`}
      style={style}
      onClick={handleClick}
    >
      {tab.icon && <span className="tabs__icon">{tab.icon}</span>}
      {iconOnly ? null : tab.label}
      {tab.badge !== undefined && tab.badge > 0 && <span className="tabs__badge">{tab.badge}</span>}
    </button>
  )
}

export const TabButton = memo(TabButtonComponent)
