import { memo, useCallback, useMemo, type CSSProperties } from 'react'
import type { TabItem } from './Tabs.types'

export interface TabButtonProps {
  tab: TabItem
  isActive: boolean
  accentColor?: string
  onSelect: (id: string) => void
}

/** Un onglet de `Tabs`. Mémoïsé : callback et style figés (zéro déclaration inline). */
function TabButtonComponent({ tab, isActive, accentColor, onSelect }: TabButtonProps) {
  const handleClick = useCallback(() => onSelect(tab.id), [tab.id, onSelect])

  const style = useMemo<CSSProperties | undefined>(
    () => (isActive && accentColor ? { color: accentColor, borderColor: accentColor } : undefined),
    [isActive, accentColor]
  )

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`tabs__item ${isActive ? 'tabs__item--active' : ''}`}
      style={style}
      onClick={handleClick}
    >
      {tab.icon && <span className="tabs__icon">{tab.icon}</span>}
      {tab.label}
      {tab.badge !== undefined && tab.badge > 0 && <span className="tabs__badge">{tab.badge}</span>}
    </button>
  )
}

export const TabButton = memo(TabButtonComponent)
