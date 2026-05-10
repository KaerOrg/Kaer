import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen } from 'lucide-react'
import type { ContentField, PreviewKind } from '../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  /** Render the active tab's children with the appropriate sub-layout. */
  renderInner: (preview_kind: PreviewKind, fields: ContentField[]) => JSX.Element | null
}

interface TabSpec {
  key: string
  label: string
  iconName: string
  subPreviewKind: PreviewKind
  children: ContentField[]
}

// Aperçu praticien d'un module à onglets — délègue le rendu de chaque
// onglet à un sous-layout via `renderInner` (injecté par FieldRenderer pour
// éviter une dépendance circulaire).
export function TabsLayout({ fields, renderInner }: Props) {
  const { t } = useTranslation()
  const tabs = useMemo<TabSpec[]>(() => {
    return fields
      .filter(f => f.field_type === 'tab')
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => ({
        key: f.props['tab_key'] ?? f.id,
        label: f.text_code ? t(f.text_code) : '',
        iconName: f.props['icon_name'] ?? '',
        subPreviewKind: (f.props['sub_preview_kind'] ?? 'coming_soon') as PreviewKind,
        children: f.children ?? [],
      }))
  }, [fields, t])

  const [activeKey, setActiveKey] = useState<string>(tabs[0]?.key ?? '')
  const activeTab = tabs.find(tb => tb.key === activeKey) ?? tabs[0]

  if (!activeTab) {
    return null
  }

  return (
    <div className="tabs">
      <div className="tabs__bar" role="tablist">
        {tabs.map(tab => {
          const isActive = tab.key === activeTab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tabs__tab${isActive ? ' tabs__tab--active' : ''}`}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.iconName ? <BookOpen size={14} className="tabs__tab-icon" /> : null}
              <span className="tabs__tab-label">{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className="tabs__content">
        {renderInner(activeTab.subPreviewKind, activeTab.children)}
      </div>
    </div>
  )
}
