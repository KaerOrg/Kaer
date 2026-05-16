import './Tabs.css'
import type { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange, variant = 'horizontal', className = '' }: TabsProps) {
  return (
    <div className={`tabs--${variant} ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tabs__item ${activeTab === tab.id ? 'tabs__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tabs__icon">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="tabs__badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
