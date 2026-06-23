import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@theme'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { FieldProps } from '../types'
import { FieldWidget } from '../FieldWidget'

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'activity':       'pulse-outline',
  'alert-triangle': 'warning-outline',
  'bell':           'notifications-outline',
  'calendar':       'calendar-outline',
  'check-circle':   'checkmark-circle-outline',
  'circle':         'radio-button-off-outline',
  'circle-dashed':  'ellipse-outline',
  'droplet':        'water-outline',
  'frown':          'sad-outline',
  'handshake':      'people-outline',
  'heart':          'heart-outline',
  'hourglass':      'hourglass-outline',
  'leaf':           'leaf-outline',
  'map-pin':        'location-outline',
  'moon':           'moon-outline',
  'pen-line':       'pencil-outline',
  'smile':          'happy-outline',
  'star':           'star-outline',
  'sun':            'sunny-outline',
  'thermometer':    'thermometer-outline',
  'timer':          'timer-outline',
  'wrench':         'construct-outline',
  'zap':            'flash-outline',
}

export function FieldRow({ field }: FieldProps) {
  const t = useModuleTranslation()
  const iconName    = field.props['icon'] ?? ''
  const widgetType  = field.props['widget_type']
  const detailCode  = field.props['detail_code']
  const detailText  = detailCode ? t(detailCode) : undefined
  const label       = field.text_code ? t(field.text_code) : ''
  const ionIcon     = ICON_MAP[iconName]

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        {iconName ? (
          <View style={styles.iconSlot}>
            {ionIcon
              ? <Ionicons name={ionIcon} size={16} color={colors.primary} />
              : <Text style={styles.fallback}>{iconName}</Text>
            }
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.control}>
        {widgetType
          ? <FieldWidget widgetType={widgetType} detailText={detailText} />
          : detailText
            ? <Text style={styles.detail}>{detailText}</Text>
            : null
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row:      { marginBottom: 12 },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  iconSlot: { width: 22, alignItems: 'center' },
  fallback: { fontSize: 12, color: colors.textMuted },
  label:    { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  control:  { paddingLeft: 32 },
  detail:   { fontSize: 12, color: colors.textMuted },
})
