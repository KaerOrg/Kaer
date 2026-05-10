import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Info } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '../theme'

interface DisclaimerBannerProps {
  moduleKey: string
  isTeenMode: boolean
}

export function DisclaimerBanner({ moduleKey, isTeenMode }: DisclaimerBannerProps) {
  const { t } = useTranslation()
  const ns = isTeenMode ? 'teen' : 'common'
  return (
    <View style={styles.container}>
      <Info size={14} color={colors.primary} style={styles.icon} />
      <Text style={styles.text}>
        {t(`modules.${moduleKey}.disclaimer`, { ns })}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  icon: { marginTop: 2 },
  text: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 18 },
})
