// ─── Layout `tabbed` — onglets génériques ────────────────────────────────────
//
// Pattern « N sous-vues dans un même module ». Chaque field racine `tab` porte
// `sub_preview_kind` (le layout enfant à utiliser) et `icon_name`. Ses children
// = les fields rendus par le sous-layout. La sélection d'onglet est un state
// local. Délègue le rendu à `FieldRenderer` (récursif).
// Conformité MDR 2017/745 : pure navigation, zéro interprétation.

import { useState, useMemo } from 'react'
import type { ComponentType } from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors } from '../../../../../theme'
import type { ContentField, PreviewKind } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { resolvePsyEduIcon } from '../PsyEdu/iconMap'
import type { FieldRendererProps } from '../../FieldRenderer/types'
import { styles } from './styles'

interface TabSpec {
  key: string
  label: string
  iconName: string
  subPreviewKind: PreviewKind
  children: ContentField[]
}

export interface TabsLayoutProps {
  /** Fields du module — les `tab` en sont extraits. */
  fields: ContentField[]
  /** Identifiant du module, propagé aux sous-layouts. */
  moduleId: string
}

export function TabsLayout({ fields, moduleId }: TabsLayoutProps) {
  // Lazy require — casse le cycle circulaire :
  // FieldRenderer/index → FieldRenderer.tsx → LayoutDispatcher → TabsLayout → FieldRenderer/index
  // Le require() à l'intérieur du composant est évalué à l'exécution (après initialisation complète).
  const { FieldRenderer } = require('../../FieldRenderer') as { FieldRenderer: ComponentType<FieldRendererProps> }

  const t = useModuleT()

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
  const activeTab = useMemo(
    () => tabs.find(tb => tb.key === activeKey) ?? tabs[0],
    [tabs, activeKey]
  )

  if (!activeTab) {
    return null
  }

  return (
    <View style={styles.container} testID="tabs-layout">
      <View style={styles.bar} accessibilityRole="tablist">
        {tabs.map(tab => {
          const isActive = tab.key === activeTab.key
          const Icon = tab.iconName ? resolvePsyEduIcon(tab.iconName) : null
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveKey(tab.key)}
              testID={`tab-${tab.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {Icon ? (
                <Icon size={16} color={isActive ? colors.primary : colors.textMuted} />
              ) : null}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <View style={styles.content} testID={`tab-content-${activeTab.key}`}>
        <FieldRenderer
          preview_kind={activeTab.subPreviewKind}
          fields={activeTab.children}
          moduleId={moduleId}
        />
      </View>
    </View>
  )
}
