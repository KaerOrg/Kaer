import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { TodayRoutine } from '../../../services/homeService'
import { Card } from '@ui/Card'
import { colors, spacing, radius } from '@theme'

interface TodayScheduleProps {
  routines: TodayRoutine[]
  isTeenMode: boolean
  teenColor: (moduleType: string) => string | undefined
  onPress: (routine: TodayRoutine) => void
}

interface RoutineRowProps {
  routine: TodayRoutine
  isTeenMode: boolean
  accentColor: string | undefined
  onPress: () => void
}

const RoutineRow = React.memo(function RoutineRow({
  routine,
  isTeenMode,
  accentColor,
  onPress,
}: RoutineRowProps) {
  const { t } = useTranslation()
  const icon = routine.mobile_icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']
  const iconColor = accentColor ?? colors.primary

  return (
    <Pressable onPress={onPress}>
      <Card accentColor={isTeenMode ? accentColor : undefined}>
        <View style={styles.row}>
          <View style={[styles.timeBadge, { borderColor: iconColor + '40', backgroundColor: iconColor + '14' }]}>
            <Text style={[styles.timeText, { color: iconColor }]}>{routine.effective_time}</Text>
          </View>
          <View style={[styles.iconWrap, isTeenMode && accentColor && { backgroundColor: accentColor + '1A', borderRadius: radius.md }]}>
            <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
          </View>
          <Text style={styles.label} numberOfLines={1}>{t(`modules.${routine.module_type}.label`)}</Text>
          <Text style={[styles.chevron, { color: isTeenMode && accentColor ? accentColor : colors.textMuted }]}>›</Text>
        </View>
      </Card>
    </Pressable>
  )
})

export function TodaySchedule({ routines, isTeenMode, teenColor, onPress }: TodayScheduleProps) {
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')

  if (routines.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('home.today_section')}</Text>
      <View style={styles.list}>
        {routines.map(routine => (
          <RoutineRow
            key={routine.id}
            routine={routine}
            isTeenMode={isTeenMode}
            accentColor={teenColor(routine.module_type)}
            onPress={() => onPress(routine)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minWidth: 54,
    alignItems: 'center',
  },
  timeText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  iconWrap: { width: 36, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  chevron: { fontSize: 24, fontWeight: '300' },
})
