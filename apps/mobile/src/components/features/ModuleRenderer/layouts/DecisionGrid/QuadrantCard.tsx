import React from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { EditableItemsList, type WeightConfig } from '../shared'
import type { PlanItem } from '../../../../../lib/database'
import { dgStyles } from './styles'

export interface QuadrantCardProps {
  sectionId: string
  title: string
  subtitle: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  accentColor: string
  bgColor: string
  items: ReadonlyArray<PlanItem>
  weightConfig: WeightConfig
  addLabel: string
  placeholder: string
  onAdd: (sectionId: string, text: string, weight: number | null) => Promise<void>
  onEdit: (item: PlanItem, text: string, weight: number | null) => Promise<void>
  onDelete: (item: PlanItem) => void
}

/**
 * One of the 4 quadrants of the decision grid. Renders a header (icon + title +
 * subtitle + count badge) and an EditableItemsList for its items.
 */
export function QuadrantCard({
  sectionId,
  title,
  subtitle,
  icon,
  accentColor,
  bgColor,
  items,
  weightConfig,
  addLabel,
  placeholder,
  onAdd,
  onEdit,
  onDelete,
}: QuadrantCardProps) {
  return (
    <View
      style={[dgStyles.quadrantCard, { borderTopColor: accentColor }]}
      testID={`quadrant-${sectionId}`}
    >
      <View style={[dgStyles.quadrantHeader, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={18} color={accentColor} />
        <View style={dgStyles.quadrantHeaderText}>
          <Text style={[dgStyles.quadrantTitle, { color: accentColor }]}>{title}</Text>
          {subtitle ? <Text style={dgStyles.quadrantSubtitle}>{subtitle}</Text> : null}
        </View>
        {items.length > 0 ? (
          <View style={[dgStyles.quadrantCountBadge, { backgroundColor: accentColor }]}>
            <Text style={dgStyles.quadrantCountText}>{items.length}</Text>
          </View>
        ) : null}
      </View>
      <View style={dgStyles.quadrantBody}>
        <EditableItemsList
          items={items}
          accentColor={accentColor}
          weightConfig={weightConfig}
          addLabel={addLabel}
          placeholder={placeholder}
          onAdd={(text, weight) => onAdd(sectionId, text, weight)}
          onEdit={onEdit}
          onDelete={onDelete}
          testIdPrefix={`quad-${sectionId}`}
        />
      </View>
    </View>
  )
}
