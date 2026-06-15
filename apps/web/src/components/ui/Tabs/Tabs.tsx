import './Tabs.css'
import { TabButton } from './TabButton'
import type { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange, variant = 'horizontal', className = '', accentColor, iconOnly = false }: TabsProps) {
  return (
    <div className={`tabs--${variant} ${className}`} role="tablist">
      {tabs.map(tab => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          accentColor={accentColor}
          iconOnly={iconOnly}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}
