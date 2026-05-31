import './Tabs.css'
import type { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange, variant = 'horizontal', className = '', accentColor }: TabsProps) {
  return (
    <div className={`tabs--${variant} ${className}`} role="tablist">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tabs__item ${isActive ? 'tabs__item--active' : ''}`}
            style={isActive && accentColor ? { color: accentColor, borderColor: accentColor } : undefined}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="tabs__icon">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="tabs__badge">{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
